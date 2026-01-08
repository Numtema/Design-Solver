
import { GoogleGenAI } from "@google/genai";
import { PocketStore, ExpertRole, Artifact, ArtifactType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanText = (text: string) => {
  return text.replace(/\*/g, '').replace(/#/g, '').replace(/^[ \t]*[-+*][ \t]+/gm, '• ').trim();
};

export async function runDesignSolver(idea: string, onUpdate: (update: any) => void) {
  let currentArtifacts: Artifact[] = [];

  try {
    // 1. Intent Node
    onUpdate({ status: 'analyzing', currentStep: 'Analyzing Idea...' });
    const intentRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following product idea: "${idea}". 
      Return a JSON object with: 
      { "goal": "Primary objective", "target": "Audience", "constraints": ["Constraint 1", "Constraint 2"] }
      DO NOT use any markdown formatting or asterisks in the strings.`,
      config: { responseMimeType: "application/json" }
    });
    const intent = JSON.parse(intentRes.text || "{}");
    onUpdate({ intent });

    // 2. Cartography Node
    onUpdate({ currentStep: 'Mapping Product Architecture...' });
    const mapRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this goal: "${intent.goal}", design the application map.
      Define 4 main modules with descriptions and key features.
      Return JSON: { "modules": [{ "name": "Module Name", "description": "Short desc", "features": ["Feature A", "Feature B"] }] }`,
      config: { responseMimeType: "application/json" }
    });
    const app_map = JSON.parse(mapRes.text || "{}");
    onUpdate({ app_map, status: 'designing' });

    // 3. Expert Team Execution (Parallel)
    onUpdate({ currentStep: 'Projecting Prototypes...' });

    const roles = [
      { 
        role: ExpertRole.ARCHITECT, 
        type: 'text' as ArtifactType, 
        prompt: "Provide technical roadmap. Return text summary." 
      },
      { 
        role: ExpertRole.UX, 
        type: 'ux-flow' as ArtifactType, 
        prompt: "Define a 4-step user journey. Return JSON with { 'summary': 'text', 'steps': [{'label': 'step name', 'desc': 'desc'}] }" 
      },
      { 
        role: ExpertRole.UI, 
        type: 'ui-layout' as ArtifactType, 
        prompt: "Propose dashboard layout. Return JSON with { 'summary': 'text', 'layout': [{'area': 'Sidebar', 'items': ['Home', 'Profile']}, {'area': 'Header', 'items': ['Search', 'User']}, {'area': 'Main', 'items': ['Chart', 'Table']}] }" 
      },
      { 
        role: ExpertRole.DATA, 
        type: 'data-schema' as ArtifactType, 
        prompt: "Define core entities. Return JSON with { 'summary': 'text', 'entities': [{'name': 'User', 'fields': ['id', 'email']}, {'name': 'Order', 'fields': ['id', 'total']}] }" 
      }
    ];

    const expertPromises = roles.map(async (expert) => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Role: ${expert.role}. Context: ${JSON.stringify(app_map)}. 
        Task: ${expert.prompt}. 
        Return strictly JSON format. No markdown fences.`,
        config: { responseMimeType: expert.type === 'text' ? undefined : "application/json" }
      });

      let content = "";
      let projection = null;

      if (expert.type === 'text') {
        content = cleanText(response.text || "");
      } else {
        try {
          const json = JSON.parse(response.text || "{}");
          content = cleanText(json.summary || "Summary generated based on architectural decisions.");
          projection = json;
        } catch (e) {
          content = cleanText(response.text || "");
        }
      }

      const artifact: Artifact = {
        id: Math.random().toString(36).substr(2, 9),
        role: expert.role,
        title: `${expert.role} Specification`,
        content: content,
        type: expert.type,
        projection: projection
      };

      currentArtifacts = [...currentArtifacts, artifact];
      onUpdate({ artifacts: currentArtifacts });
      return artifact;
    });

    await Promise.all(expertPromises);
    onUpdate({ status: 'ready', currentStep: 'Project Ready' });

  } catch (error) {
    console.error("Solver Error:", error);
    onUpdate({ status: 'error', currentStep: 'System Failure' });
  }
}
