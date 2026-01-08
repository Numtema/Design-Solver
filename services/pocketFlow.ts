
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
    onUpdate({ status: 'analyzing', currentStep: 'Decrypting Intention...' });
    const intentRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following product idea: "${idea}". 
      Return a JSON object with: 
      { "goal": "Primary objective", "target": "Audience", "constraints": ["Constraint 1", "Constraint 2"] }
      DO NOT use any markdown formatting or asterisks.`,
      config: { responseMimeType: "application/json" }
    });
    const intent = JSON.parse(intentRes.text || "{}");
    onUpdate({ intent });

    // 2. Cartography Node
    onUpdate({ currentStep: 'Mapping Architecture...' });
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
    onUpdate({ currentStep: 'Engaging Expert Agents...' });

    const roles = [
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

    const expertResults = await Promise.all(roles.map(async (expert) => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Role: ${expert.role}. Context: ${JSON.stringify(app_map)}. 
        Task: ${expert.prompt}. 
        Return strictly JSON format. No markdown fences.`,
        config: { responseMimeType: "application/json" }
      });

      const json = JSON.parse(response.text || "{}");
      const artifact: Artifact = {
        id: Math.random().toString(36).substr(2, 9),
        role: expert.role,
        title: `${expert.role} Strategy`,
        content: cleanText(json.summary || "Summary generated based on architectural decisions."),
        type: expert.type,
        projection: json
      };

      currentArtifacts = [...currentArtifacts, artifact];
      onUpdate({ artifacts: currentArtifacts });
      return artifact;
    }));

    // 4. Final Synthesis: 3 High Fidelity Prototypes
    onUpdate({ currentStep: 'Projecting Visual Prototypes...' });
    
    const prototypeStyles = [
      "Modern Material 3 - Glassmorphism touch, soft gradients, clean typography.",
      "Futuristic Minimalist - Dark mode, high contrast neon accents, technical monospace.",
      "Swiss Grid Style - Bold primary colors, asymmetrical layouts, heavy borders."
    ];

    const prototypePromises = prototypeStyles.map(async (style, idx) => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a World-Class UI Prototyper.
        Create a functional HTML/CSS prototype for the main screen of this app: "${idea}".
        Style Direction: ${style}
        Context: ${JSON.stringify(app_map)}
        
        Rules:
        1. Use Tailwind CSS via CDN.
        2. Use Lucide icons or Material Symbols.
        3. Make it highly aesthetic and interactive (hover states, smooth transitions).
        4. Include some dummy data related to the product goal: ${intent.goal}.
        5. Return ONLY RAW HTML. NO MARKDOWN. NO CODE BLOCKS.`,
      });

      const artifact: Artifact = {
        id: `proto_${idx}`,
        role: ExpertRole.PROTOTYPER,
        title: `Visual Proposal 0${idx + 1}`,
        content: response.text || "<!-- Prototype failed to load -->",
        type: 'prototype',
        projection: { style }
      };

      currentArtifacts = [...currentArtifacts, artifact];
      onUpdate({ artifacts: currentArtifacts });
      return artifact;
    });

    await Promise.all(prototypePromises);
    onUpdate({ status: 'ready', currentStep: 'Projection Complete' });

  } catch (error) {
    console.error("Solver Error:", error);
    onUpdate({ status: 'error', currentStep: 'System Failure' });
  }
}
