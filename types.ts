
export enum ExpertRole {
  // FOUNDATION
  INTENT = 'Intent Analyst',
  CARTOGRAPHER = 'Product Cartographer',
  UX = 'UX Expert',
  UI = 'UI Expert',
  DATA = 'Data Architect',
  COMPONENT = 'Component Expert',
  
  // QUALITY
  CONSISTENCY = 'Consistency Guardian',
  SIMPLIFIER = 'Simplification Expert',
  RISK = 'Risk & Complexity Analyst',
  
  // BUSINESS
  PERSONA = 'Persona Specialist',
  PRICING = 'Monetization Strategist',
  GTM = 'Go-To-Market Lead',
  
  // TECH
  TECH_STACK = 'Tech Stack Architect',
  API_CONTRACT = 'API Contract Designer',
  ESTIMATION = 'Estimation Lead',
  
  // PROJECTION
  PROTOTYPER = 'Synthesis Expert'
}

export type ArtifactType = 
  | 'text' 
  | 'ui-layout' 
  | 'data-schema' 
  | 'ux-flow' 
  | 'prototype' 
  | 'component-map'
  | 'consistency-report'
  | 'persona-profile'
  | 'risk-analysis'
  | 'monetization-plan'
  | 'tech-roadmap'
  | 'gtm-strategy'
  | 'estimation-spec';

export interface Artifact {
  id: string;
  role: ExpertRole;
  title: string;
  summary: string;
  content: string; // Detailed content or code
  type: ArtifactType;
  projection?: any; // Structured JSON
  confidence: number;
}

export type ProjectMode = 'idea' | 'mvp' | 'scale';
export type ProjectDepth = 'quick' | 'standard' | 'deep';

export interface PocketStore {
  idea_raw: string;
  mode: ProjectMode;
  depth: ProjectDepth;
  intent?: {
    goal: string;
    target: string;
    constraints: string[];
  };
  app_map?: {
    modules: { name: string; description: string; features: string[] }[];
  };
  artifacts: Artifact[];
  status: 'idle' | 'analyzing' | 'designing' | 'ready' | 'error';
  currentStep: string;
}
