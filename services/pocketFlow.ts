
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { PocketStore, ExpertRole, Artifact, ArtifactType, ProjectMode, ProjectDepth } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Universal Schemas ---

export const IntentSchema = z.object({
  goal: z.string().default("Unknown Goal"),
  target: z.string().default("General Audience"),
  constraints: z.array(z.string()).default([]),
});

export const AppMapSchema = z.object({
  modules: z.array(z.object({
    name: z.string().default("New Module"),
    description: z.string().default("No description provided."),
    features: z.array(z.string()).default([]),
  })).default([]),
});

const BaseExpertSchema = z.object({
  summary: z.string().default("No summary available."),
  confidence: z.number().min(0).max(1).default(0.9),
});

export const UXSchema = BaseExpertSchema.extend({
  steps: z.array(z.object({ label: z.string(), desc: z.string() })).default([]),
});

export const UISchema = BaseExpertSchema.extend({
  layout: z.array(z.object({ area: z.string(), items: z.array(z.string()) })).default([]),
});

export const DataSchema = BaseExpertSchema.extend({
  entities: z.array(z.object({ name: z.string(), fields: z.array(z.string()) })).default([]),
});

export const ComponentSchema = BaseExpertSchema.extend({
  components: z.array(z.object({ name: z.string(), usage: z.string() })).default([]),
});

export const PersonaSchema = BaseExpertSchema.extend({
  personas: z.array(z.object({ name: z.string(), role: z.string(), goals: z.array(z.string()), frustrations: z.array(z.string()) })).default([]),
});

export const RiskSchema = BaseExpertSchema.extend({
  risks: z.array(z.object({ area: z.string(), severity: z.string(), mitigation: z.string() })).default([]),
});

export const TechStackSchema = BaseExpertSchema.extend({
  stack: z.object({ 
    frontend: z.string().default("React"), 
    backend: z.string().default("Node.js"), 
    database: z.string().default("PostgreSQL"), 
    infra: z.string().default("Cloud") 
    // Fix: provide full default object to match the inferred type of the Zod object schema
  }).default({ 
    frontend: "React", 
    backend: "Node.js", 
    database: "PostgreSQL", 
    infra: "Cloud" 
  }),
});

export const MonetizationSchema = BaseExpertSchema.extend({
  tiers: z.array(z.object({ name: z.string(), price: z.string(), features: z.array(z.string()) })).default([]),
});

// --- Activation Matrix ---

export function resolveAgents(mode: ProjectMode, depth: ProjectDepth): ExpertRole[] {
  const roles: ExpertRole[] = [ExpertRole.INTENT, ExpertRole.CARTOGRAPHER];
  
  // FOUNDATION
  roles.push(ExpertRole.UX, ExpertRole.UI, ExpertRole.PERSONA);
  
  if (depth !== 'quick') {
    roles.push(ExpertRole.COMPONENT, ExpertRole.DATA, ExpertRole.CONSISTENCY);
  }

  if (depth === 'deep') {
    roles.push(ExpertRole.SIMPLIFIER);
    if (mode === 'mvp') roles.push(ExpertRole.TECH_STACK, ExpertRole.PRICING);
    if (mode === 'scale') roles.push(ExpertRole.RISK, ExpertRole.ESTIMATION, ExpertRole.GTM);
  }

  return roles;
}

// --- Helpers ---

function safeJsonParse(text: string): unknown {
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch { return {}; }
}

function parseWithSchema<T>(schema: z.ZodSchema<T>, rawText: string): T {
  const raw = safeJsonParse(rawText);
  const res = schema.safeParse(raw);
  if (!res.success) {
    // Fix: ZodError does not have an 'errors' property; use 'issues' instead.
    console.error("Zod Validation Failed:", res.error.issues);
    // Attempt to return a valid object by parsing an empty one through the schema (triggering defaults)
    try {
      return schema.parse({});
    } catch {
      return raw as T;
    }
  }
  return res.data;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 1000)); }
  }
  throw lastErr;
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

// --- Nodes ---

/**
 * 1. Intent Analyst Node
 */
async function intentNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Decrypting Intent..." });
  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze: "${shared.idea_raw}". Identify the primary goal, target audience, and key constraints.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING },
          target: { type: Type.STRING },
          constraints: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["goal", "target"]
      }
    }
  }));
  const intent = parseWithSchema(IntentSchema, res.text || "{}");
  emit({ intent });
  return intent;
}

/**
 * 2. Product Cartographer Node
 */
async function cartographyNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Mapping Architecture...", status: "designing" });
  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Goal: "${shared.intent?.goal}". Map 4 core modules for this application.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                features: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "description", "features"]
            }
          }
        },
        required: ["modules"]
      }
    }
  }));
  const app_map = parseWithSchema(AppMapSchema, res.text || "{}");
  emit({ app_map });
  return app_map;
}

/**
 * 3. Expert Node
 */
async function expertNode(role: ExpertRole, shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  let schema: z.ZodSchema<any> = BaseExpertSchema;
  let type: ArtifactType = 'text';
  let task = "";

  switch (role) {
    case ExpertRole.UX: schema = UXSchema; type = 'ux-flow'; task = "Define a 4-step user journey."; break;
    case ExpertRole.UI: schema = UISchema; type = 'ui-layout'; task = "Propose dashboard layout zones."; break;
    case ExpertRole.DATA: schema = DataSchema; type = 'data-schema'; task = "Define core DB entities."; break;
    case ExpertRole.COMPONENT: schema = ComponentSchema; type = 'component-map'; task = "List key reusable UI components."; break;
    case ExpertRole.PERSONA: schema = PersonaSchema; type = 'persona-profile'; task = "Define 2 user personas."; break;
    case ExpertRole.RISK: schema = RiskSchema; type = 'risk-analysis'; task = "Identify technical/product risks."; break;
    case ExpertRole.TECH_STACK: schema = TechStackSchema; type = 'tech-roadmap'; task = "Recommend tech stack."; break;
    case ExpertRole.PRICING: schema = MonetizationSchema; type = 'monetization-plan'; task = "Suggest pricing tiers."; break;
    case ExpertRole.SIMPLIFIER: type = 'text'; task = "Suggest MVP simplification."; break;
    case ExpertRole.CONSISTENCY: type = 'consistency-report'; task = "Verify coherence across all generated artifacts."; break;
    default: task = "Provide expert analysis.";
  }

  const contextText = `
    Intent: ${JSON.stringify(shared.intent)}
    App Map: ${JSON.stringify(shared.app_map)}
    Previous Findings: ${shared.artifacts.map(a => `${a.role}: ${a.summary}`).join(' | ')}
  `;

  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Role: ${role}. Context: ${contextText}. Task: ${task}. Output JSON including a 'summary' string.`,
    config: { responseMimeType: "application/json" }
  }));

  const json = parseWithSchema(schema, res.text || "{}");
  const artifact: Artifact = {
    id: makeId(role.toLowerCase().replace(/\s+/g, '_')),
    role,
    title: `${role} Strategy`,
    summary: (json as any).summary || "Analysis complete.",
    content: res.text || "",
    type,
    projection: json,
    confidence: (json as any).confidence || 0.95
  };

  const updatedArtifacts = [...shared.artifacts, artifact];
  emit({ artifacts: updatedArtifacts });
  return artifact;
}

/**
 * 4. Synthesis Node
 */
async function synthesisNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Synthesizing Interactive Projection..." });
  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Synthesis Expert. Generate interactive HTML/Tailwind for: "${shared.idea_raw}". Use context: ${JSON.stringify(shared.artifacts)}. Raw HTML only. No markdown.`,
  }));

  let html = res.text || "";
  html = html.replace(/```html/g, "").replace(/```/g, "").trim();

  const proto: Artifact = {
    id: 'synthesis_projection',
    role: ExpertRole.PROTOTYPER,
    title: 'Visual Master Projection',
    summary: 'Master functional prototype based on expert strategies.',
    content: html,
    type: 'prototype',
    confidence: 1.0
  };

  emit({ artifacts: [...shared.artifacts, proto] });
  return proto;
}

// --- Runner ---

export async function runDesignSolver(
  idea: string,
  mode: ProjectMode,
  depth: ProjectDepth,
  onUpdate: (update: Partial<PocketStore>) => void
) {
  const shared: PocketStore = {
    idea_raw: idea,
    mode,
    depth,
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
    
    const activeRoles = resolveAgents(mode, depth);
    const foundationRoles = activeRoles.filter(r => [ExpertRole.PERSONA, ExpertRole.UX, ExpertRole.UI].includes(r));
    const enrichmentRoles = activeRoles.filter(r => !foundationRoles.includes(r) && ![ExpertRole.INTENT, ExpertRole.CARTOGRAPHER, ExpertRole.PROTOTYPER].includes(r));

    // Phase 1: Foundation (Parallel)
    emit({ currentStep: "Building Foundations..." });
    await Promise.all(foundationRoles.map(role => expertNode(role, shared, emit)));

    // Phase 2: Enrichment (Parallel, but now with Foundation context)
    if (enrichmentRoles.length > 0) {
      emit({ currentStep: "Deepening Strategic Logic..." });
      await Promise.all(enrichmentRoles.map(role => expertNode(role, shared, emit)));
    }

    // Phase 3: Final Synthesis
    await synthesisNode(shared, emit);

    emit({ status: "ready", currentStep: "Project Solver Complete" });
  } catch (err) {
    console.error(err);
    emit({ status: "error", currentStep: "Expert link failed." });
  }
}
