
import { GoogleGenAI } from "@google/genai";
import { PocketStore, ExpertRole, Artifact, ArtifactType } from "../types";

/**
 * Service Layer: PocketFlow Engine
 * Manages the multi-agent design generation process.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanText = (text: string) => {
  return text.replace(/\*/g, '').replace(/#/g, '').replace(/^[ \t]*[-+*][ \t]+/gm, '• ').trim();
};

export async function runDesignSolver(idea: string, onUpdate: (update: Partial<PocketStore>) => void) {
  let currentArtifacts: Artifact[] = [];

  try {
    // Stage 1: Intent & Alignment
    onUpdate({ status: 'analyzing', currentStep: 'Decrypting Intention...' });
    const intentRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following product idea: "${idea}". 
      Return a JSON object with: 
      { "goal": "Primary objective", "target": "Audience", "constraints": ["Constraint 1", "Constraint 2"] }
      DO NOT use any markdown formatting.`,
      config: { responseMimeType: "application/json" }
    });
    const intent = JSON.parse(intentRes.text || "{}");
    onUpdate({ intent });

    // Stage 2: Product Cartography
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

    // Stage 3: Expert Specialization
    onUpdate({ currentStep: 'Engaging Expert Agents...' });

    const roles = [
      { 
        role: ExpertRole.UX, 
        type: 'ux-flow' as ArtifactType, 
        prompt: "Define a 4-step user journey. Return JSON with { 'summary': 'text', 'steps': [{'label': 'Step Name', 'desc': 'Description'}] }" 
      },
      { 
        role: ExpertRole.UI, 
        type: 'ui-layout' as ArtifactType, 
        prompt: "Propose dashboard layout. Return JSON with { 'summary': 'text', 'layout': [{'area': 'Zone Name', 'items': ['Module 1', 'Module 2']}] }" 
      },
      { 
        role: ExpertRole.DATA, 
        type: 'data-schema' as ArtifactType, 
        prompt: "Define core database entities. Return JSON with { 'summary': 'text', 'entities': [{'name': 'User', 'fields': ['id', 'email']}] }" 
      }
    ];

    // Execute specialized agents in parallel
    await Promise.all(roles.map(async (expert) => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Role: ${expert.role}. Context: ${JSON.stringify(app_map)}. 
          Task: ${expert.prompt}. Return strictly JSON format. No markdown fences.`,
          config: { responseMimeType: "application/json" }
        });

        const json = JSON.parse(response.text || "{}");
        const artifact: Artifact = {
          id: Math.random().toString(36).substr(2, 9),
          role: expert.role,
          title: `${expert.role} Strategy`,
          content: cleanText(json.summary || "Strategizing based on product requirements."),
          type: expert.type,
          projection: json
        };

        currentArtifacts = [...currentArtifacts, artifact];
        onUpdate({ artifacts: [...currentArtifacts] });
      } catch (err) {
        console.error(`Expert ${expert.role} failed:`, err);
      }
    }));

    // Stage 4: Interactive Synthesis (Prototyping)
    onUpdate({ currentStep: 'Synthesizing Visual Prototypes...' });
    
    const prototypeStyles = [
      "Material Design 3 - Glassmorphism, soft violet/purple accents, high-end commercial look.",
      "Cyber-Technical - Dark mode, high-contrast neon, technical monospace data viz.",
      "Brutalist Editorial - Bold typography, primary colors, sharp grids, modern Swiss style."
    ];

    await Promise.all(prototypeStyles.map(async (style, idx) => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Expert Task: Create a high-fidelity HTML/Tailwind CSS interactive prototype for: "${idea}".
          Direction: ${style}
          Architecture Context: ${JSON.stringify(app_map)}
          
          Technical Rules:
          - Use Tailwind CSS CDN.
          - Use Lucide-react logic or FontAwesome style icons via script.
          - Must be a single interactive dashboard or landing page.
          - Make it feel professional and production-ready.
          - Return ONLY RAW HTML. NO MARKDOWN. NO CODE BLOCKS.`,
        });

        const artifact: Artifact = {
          id: `proto_${idx}`,
          role: ExpertRole.PROTOTYPER,
          title: `Visual Projection 0${idx + 1}`,
          content: response.text || "<!-- Prototype generation failed -->",
          type: 'prototype',
          projection: { style }
        };

        currentArtifacts = [...currentArtifacts, artifact];
        onUpdate({ artifacts: [...currentArtifacts] });
      } catch (err) {
        console.error("Prototype failed:", err);
      }
    }));

    onUpdate({ status: 'ready', currentStep: 'Solution Fully Projected' });

  } catch (error) {
    console.error("Solver Main Loop Error:", error);
    onUpdate({ status: 'error', currentStep: 'Critical system failure.' });
    throw error;
  }
}
