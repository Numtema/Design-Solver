
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { PocketStore, ExpertRole, Artifact, ArtifactType, ProjectMode, ProjectDepth } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Universal Schemas ---

export const IntentSchema = z.object({
  goal: z.string(),
  target: z.string(),
  constraints: z.array(z.string()).default([]),
});

export const AppMapSchema = z.object({
  modules: z.array(z.object({
    name: z.string(),
    description: z.string(),
    features: z.array(z.string()),
  })),
});

const BaseExpertSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1).default(0.9),
});

export const UXSchema = BaseExpertSchema.extend({
  steps: z.array(z.object({ label: z.string(), desc: z.string() })),
});

export const UISchema = BaseExpertSchema.extend({
  layout: z.array(z.object({ area: z.string(), items: z.array(z.string()) })),
});

export const DataSchema = BaseExpertSchema.extend({
  entities: z.array(z.object({ name: z.string(), fields: z.array(z.string()) })),
});

export const ComponentSchema = BaseExpertSchema.extend({
  components: z.array(z.object({ name: z.string(), usage: z.string() })),
});

export const PersonaSchema = BaseExpertSchema.extend({
  personas: z.array(z.object({ name: z.string(), role: z.string(), goals: z.array(z.string()), frustrations: z.array(z.string()) })),
});

export const RiskSchema = BaseExpertSchema.extend({
  risks: z.array(z.object({ area: z.string(), severity: z.string(), mitigation: z.string() })),
});

export const TechStackSchema = BaseExpertSchema.extend({
  stack: z.object({ frontend: z.string(), backend: z.string(), database: z.string(), infra: z.string() }),
});

export const MonetizationSchema = BaseExpertSchema.extend({
  tiers: z.array(z.object({ name: z.string(), price: z.string(), features: z.array(z.string()) })),
});

// --- Activation Matrix ---

export function resolveAgents(mode: ProjectMode, depth: ProjectDepth): ExpertRole[] {
  const roles: ExpertRole[] = [ExpertRole.INTENT, ExpertRole.CARTOGRAPHER];
  
  // FOUNDATION
  roles.push(ExpertRole.UX, ExpertRole.UI);
  
  if (depth !== 'quick') {
    roles.push(ExpertRole.COMPONENT, ExpertRole.DATA, ExpertRole.CONSISTENCY);
  }

  if (depth === 'deep') {
    roles.push(ExpertRole.PERSONA, ExpertRole.SIMPLIFIER);
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
  if (!res.success) return schema.parse({ summary: "Generated with minor validation issues." }) as T;
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
 * Decrypts the raw user idea.
 */
async function intentNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Decrypting Intent..." });
  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following product idea: "${shared.idea_raw}". 
    Return a JSON object: { "goal": "Primary objective", "target": "Audience", "constraints": ["Constraint 1"] }
    Strictly JSON. No markdown.`,
    config: { responseMimeType: "application/json" }
  }));
  const intent = parseWithSchema(IntentSchema, res.text || "{}");
  emit({ intent });
  return "ok";
}

/**
 * 2. Product Cartographer Node
 * Structures the app modules.
 */
async function cartographyNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Mapping Architecture...", status: "designing" });
  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on Goal: "${shared.intent?.goal}", Target: "${shared.intent?.target}". 
    Map 4 essential modules for this application.
    Return JSON: { "modules": [{ "name": "Module Name", "description": "Short desc", "features": ["Feature A"] }] }`,
    config: { responseMimeType: "application/json" }
  }));
  const app_map = parseWithSchema(AppMapSchema, res.text || "{}");
  emit({ app_map });
  return "ok";
}

/**
 * 3. Specialized Expert Node (Universal)
 * Can run any role from the taxonomy.
 */
async function expertNode(role: ExpertRole, shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  let schema: z.ZodSchema<any> = BaseExpertSchema;
  let type: ArtifactType = 'text';
  let promptText = "";

  switch (role) {
    case ExpertRole.UX: schema = UXSchema; type = 'ux-flow'; promptText = "Define a 4-step user journey. JSON: { summary, steps: [{label, desc}] }"; break;
    case ExpertRole.UI: schema = UISchema; type = 'ui-layout'; promptText = "Propose dashboard layout zones. JSON: { summary, layout: [{area, items}] }"; break;
    case ExpertRole.DATA: schema = DataSchema; type = 'data-schema'; promptText = "Define core DB entities. JSON: { summary, entities: [{name, fields}] }"; break;
    case ExpertRole.COMPONENT: schema = ComponentSchema; type = 'component-map'; promptText = "List key reusable UI components. JSON: { summary, components: [{name, usage}] }"; break;
    case ExpertRole.PERSONA: schema = PersonaSchema; type = 'persona-profile'; promptText = "Define 2 core user personas. JSON: { summary, personas: [{name, role, goals, frustrations}] }"; break;
    case ExpertRole.RISK: schema = RiskSchema; type = 'risk-analysis'; promptText = "Identify technical/product risks. JSON: { summary, risks: [{area, severity, mitigation}] }"; break;
    case ExpertRole.TECH_STACK: schema = TechStackSchema; type = 'tech-roadmap'; promptText = "Recommend a modern tech stack. JSON: { summary, stack: {frontend, backend, database, infra} }"; break;
    case ExpertRole.PRICING: schema = MonetizationSchema; type = 'monetization-plan'; promptText = "Suggest pricing tiers. JSON: { summary, tiers: [{name, price, features}] }"; break;
    case ExpertRole.SIMPLIFIER: schema = BaseExpertSchema; type = 'text'; promptText = "Suggest ways to simplify this MVP for faster launch."; break;
    case ExpertRole.CONSISTENCY: schema = BaseExpertSchema; type = 'consistency-report'; promptText = "Review the coherence between modules, UX, and UI. Identify gaps."; break;
    default: schema = BaseExpertSchema; type = 'text'; promptText = "Provide your expert perspective on this product."; break;
  }

  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Role: ${role}. 
    Context: Intent=${JSON.stringify(shared.intent)}, Map=${JSON.stringify(shared.app_map)}. 
    Task: ${promptText}. 
    Output strictly valid JSON.`,
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

  emit({ artifacts: [...shared.artifacts, artifact] });
  return artifact;
}

/**
 * 4. Synthesis Node
 * Generates the master visual prototype.
 */
async function synthesisNode(shared: PocketStore, emit: (u: Partial<PocketStore>) => void) {
  emit({ currentStep: "Synthesizing Interactive Projection..." });
  const res = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the Synthesis Expert. 
    Construct a high-fidelity interactive HTML/Tailwind prototype for: "${shared.idea_raw}".
    Use the following expert guidance: ${JSON.stringify(shared.artifacts.slice(0, 5))}.
    Return ONLY RAW HTML. No markdown code blocks. Use Lucide icons and Tailwind via CDN.`,
  }));

  let html = res.text || "";
  html = html.replace(/```html/g, "").replace(/```/g, "").trim();

  const proto: Artifact = {
    id: 'synthesis_projection',
    role: ExpertRole.PROTOTYPER,
    title: 'Visual Master Projection',
    summary: 'A fully functional visual prototype derived from all expert artifacts.',
    content: html,
    type: 'prototype',
    confidence: 1.0
  };

  emit({ artifacts: [...shared.artifacts, proto] });
  return "ok";
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
    const expertRoles = activeRoles.filter(r => r !== ExpertRole.INTENT && r !== ExpertRole.CARTOGRAPHER && r !== ExpertRole.PROTOTYPER);

    // Parallel execution for expert team
    emit({ currentStep: `Engaging ${expertRoles.length} Experts...` });
    await Promise.all(expertRoles.map(role => expertNode(role, shared, emit)));

    // Final synthesis
    await synthesisNode(shared, emit);

    emit({ status: "ready", currentStep: "Design Solver Finished" });
  } catch (err) {
    console.error(err);
    emit({ status: "error", currentStep: "Neural Failure" });
  }
}
