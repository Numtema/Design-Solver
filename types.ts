
export enum ExpertRole {
  ARCHITECT = 'Product Architect',
  UX = 'UX Expert',
  UI = 'UI Expert',
  COMPONENT = 'Component Expert',
  DATA = 'Data Architect',
  PROTOTYPER = 'Synthesis Expert'
}

export type ArtifactType = 'text' | 'ui-layout' | 'data-schema' | 'ux-flow' | 'prototype' | 'component-map';

export interface Artifact {
  id: string;
  role: ExpertRole;
  title: string;
  content: string; // Textual summary or code
  type: ArtifactType;
  projection?: any; // Structured JSON or extra metadata
}

export interface PocketStore {
  idea_raw: string;
  intent?: {
    goal: string;
    target: string;
    constraints: string[];
  };
  app_map?: {
    modules: { name: string; description: string; features: string[] }[];
  };
  artifacts: Artifact[];
  consistency?: {
    issues: string[];
    ok: boolean;
  };
  uiflash_project?: {
    sections: { id: string; title: string; cards: string[] }[];
    cards: { id: string; title: string; type: string; payload: any }[];
  };
  status: 'idle' | 'analyzing' | 'designing' | 'ready' | 'error';
  currentStep: string;
}
