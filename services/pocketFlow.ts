
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { PocketStore, ExpertRole, Artifact, ArtifactType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

export const IntentSchema = z.object({
  goal: z.string().min(1),
  target: z.string().min(1),
  constraints: z.array(z.string()).default([]),
});

export const AppMapSchema = z.object({
  modules: z.array(z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    features: z.array(z.string()).default([]),
  })).min(1),
});

export const UXSchema = z.object({
  summary: z.string().default(""),
  steps: z.array(z.object({
    label: z.string().min(1),
    desc: z.string().min(1),
  })).default([]),
});

export const UISchema = z.object({
  summary: z.string().default(""),
  layout: z.array(z.object({
    area: z.string().min(1),
    items: z.array(z.string()).default([]),
  })).default([]),
});

export const DataSchema = z.object({
  summary: z.string().default(""),
  entities: z.array(z.object({
    name: z.string().min(1),
    fields: z.array(z.string()).default([]),
  })).default([]),
});

export const ComponentSchema = z.object({
  summary: z.string().default(""),
  design_system: z.object({
    primary_color: z.string(),
    font_family: z.string(),
  }).optional(),
  components: z.array(z.object({
    name: z.string(),
    usage: z.string(),
  })).default([]),
});

// --- Helpers ---

const cleanText = (text: string) =>
  text.replace(/\*/g, "").replace(/#/g, "").replace(/^[ \t]*[-+*][ \t]+/gm, "• ").trim();

// Helper to extract clean content from possible markdown blocks
const extractContent = (text: string) => {
  const match = text.match(/```(?:html|json|text)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1].trim() : text.trim();
};

function safeJsonParse(text: string): unknown {
  const cleaned = extractContent(text);
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch { return {}; }
}

function parseWithSchema<T>(schema: z.ZodSchema<T>, rawText: string): T {
  const raw = safeJsonParse(rawText);
  const res = schema.safeParse(raw);
  if (!res.success) {
    // Attempt minimal fallback
    try { return schema.parse({}); } catch { return raw as T; }
  }
  return res.data;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, waitMs = 1000): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (i < retries) await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw last;
}

function makeId(prefix = "a") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Nodes ---

/** 1. Intent Node */
async function intentNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ status: "analyzing", currentStep: "Decrypting Intent..." });

  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following product idea: "${shared.idea_raw}". 
Return a JSON object: { "goal": "...", "target": "...", "constraints": ["..."] }
Rules: STRICTLY JSON, NO ASTERISKS, NO MARKDOWN.`,
    config: { responseMimeType: "application/json" }
  }));

  const intent = parseWithSchema(IntentSchema, res.text || "{}");
  emit({ intent });
}

/** 2. Cartography Node */
async function cartographyNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Mapping Architecture...", status: "designing" });

  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this intent: ${JSON.stringify(shared.intent)}, map the application architecture with 4 modules.
Return JSON: { "modules": [{ "name": "...", "description": "...", "features": ["..."] }] }
Rules: STRICTLY JSON, NO ASTERISKS.`,
    config: { responseMimeType: "application/json" }
  }));

  const app_map = parseWithSchema(AppMapSchema, res.text || "{}");
  emit({ app_map });
}

/** 3. Expert Team Node (Parallel) */
async function expertTeamNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Engaging Experts..." });

  // Fix: Explicitly typed the roles array to resolve type mismatch when iterating over different Zod schemas in the parallel node.
  const roles: {
    role: ExpertRole;
    type: ArtifactType;
    schema: z.ZodSchema<any>;
    task: string;
  }[] = [
    {
      role: ExpertRole.UX,
      type: "ux-flow" as ArtifactType,
      schema: UXSchema,
      task: `Define a 4-step user journey. JSON: { "summary": "...", "steps": [{"label": "...", "desc": "..."}] }`
    },
    {
      role: ExpertRole.UI,
      type: "ui-layout" as ArtifactType,
      schema: UISchema,
      task: `Propose dashboard layout. JSON: { "summary": "...", "layout": [{"area": "...", "items": ["..."]}] }`
    },
    {
      role: ExpertRole.DATA,
      type: "data-schema" as ArtifactType,
      schema: DataSchema,
      task: `Define core DB entities. JSON: { "summary": "...", "entities": [{"name": "...", "fields": ["..."]}] }`
    },
    {
      role: ExpertRole.COMPONENT,
      type: "component-map" as ArtifactType,
      schema: ComponentSchema,
      task: `Define key UI components and design style. JSON: { "summary": "...", "design_system": {"primary_color": "...", "font_family": "..."}, "components": [{"name": "...", "usage": "..."}] }`
    }
  ];

  let currentArtifacts = shared.artifacts;

  await Promise.all(roles.map(async (expert) => {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Role: ${expert.role}. Map: ${JSON.stringify(shared.app_map)}. Task: ${expert.task}. Rules: STRICTLY JSON, NO MARKDOWN.`,
        config: { responseMimeType: "application/json" }
      }));

      const json = parseWithSchema(expert.schema, response.text || "{}");
      const artifact: Artifact = {
        id: makeId(expert.role.replace(/\s+/g, '').toLowerCase()),
        role: expert.role,
        title: `${expert.role} Strategy`,
        content: cleanText((json as any).summary || "Expert analysis complete."),
        type: expert.type,
        projection: json
      };

      currentArtifacts = [...currentArtifacts, artifact];
      emit({ artifacts: currentArtifacts });
    } catch (err) {
      console.error(`Expert ${expert.role} failed:`, err);
    }
  }));
}

/** 4. Synthesis Node (Prototypes) */
async function synthesisNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Projecting Visual Solutions..." });

  const styles = [
    "Modern Glassmorphism - Vibrant blur, high polish.",
    "Industrial Minimalist - Monochrome, tight grids, functional.",
    "Futuristic Technical - Dark background, neon indicators, monospace labels."
  ];

  let currentArtifacts = shared.artifacts;

  await Promise.all(styles.map(async (style, idx) => {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a high-fidelity HTML/Tailwind CSS interactive prototype for: "${shared.idea_raw}". 
Style: ${style}. Architecture: ${JSON.stringify(shared.app_map)}. 
Rules: ONLY RAW HTML, NO MARKDOWN, NO CODE FENCES. Use Lucide icons script and Tailwind CDN.`,
      }));

      // Fix: Used extractContent helper to strip potential markdown code fences from the HTML response.
      const artifact: Artifact = {
        id: `proto_${idx}`,
        role: ExpertRole.PROTOTYPER,
        title: `Projection 0${idx + 1}`,
        content: extractContent(response.text || "<!-- Build Error -->"),
        type: 'prototype',
        projection: { style }
      };

      currentArtifacts = [...currentArtifacts, artifact];
      emit({ artifacts: currentArtifacts });
    } catch (err) {
      console.error(`Prototype ${idx} failed:`, err);
    }
  }));
}

/** 5. Consistency & Projection Node */
async function projectionNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Finalizing Unified Project..." });

  const issues: string[] = [];
  if (!shared.app_map?.modules.length) issues.push("Missing core application modules.");
  if (shared.artifacts.length < 5) issues.push("Expert specialization incomplete.");

  emit({ 
    consistency: { issues, ok: issues.length === 0 },
    uiflash_project: {
      sections: [
        { id: "core", title: "Core Architecture", cards: ["app_map"] },
        { id: "experts", title: "Expert Projections", cards: shared.artifacts.filter(a => a.type !== 'prototype').map(a => a.id) },
        { id: "visuals", title: "Visual Synthesis", cards: shared.artifacts.filter(a => a.type === 'prototype').map(a => a.id) }
      ],
      cards: [
        { id: "app_map", title: "Architecture Map", type: "app-map", payload: shared.app_map },
        ...shared.artifacts.map(a => ({ id: a.id, title: a.title, type: a.type, payload: a.projection }))
      ]
    }
  });
}

// --- Main Flow ---

export async function runDesignSolver(
  idea: string,
  onUpdate: (update: Partial<PocketStore>) => void
) {
  const shared: PocketStore = {
    idea_raw: idea,
    status: "idle",
    currentStep: "",
    artifacts: [],
  } as any;

  const emit = (u: Partial<PocketStore>) => {
    Object.assign(shared, u);
    onUpdate(u);
  };

  try {
    await intentNode(shared, emit);
    await cartographyNode(shared, emit);
    await expertTeamNode(shared, emit);
    await synthesisNode(shared, emit);
    await projectionNode(shared, emit);

    emit({ status: "ready", currentStep: "Project Solver Complete" });
  } catch (error) {
    console.error("Solver Error:", error);
    emit({ status: "error", currentStep: "Neural link severed." });
    throw error;
  }
}
