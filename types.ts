
export enum ExpertRole {
  ARCHITECT = 'Product Architect',
  UX = 'UX Expert',
  UI = 'UI Expert',
  COMPONENT = 'Component Expert',
  DATA = 'Data Architect'
}

export type ArtifactType = 'text' | 'ui-layout' | 'data-schema' | 'ux-flow';

export interface Artifact {
  id: string;
  role: ExpertRole;
  title: string;
  content: string; // Textual summary
  type: ArtifactType;
  projection?: any; // Structured JSON for visual rendering
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
  status: 'idle' | 'analyzing' | 'designing' | 'ready' | 'error';
  currentStep: string;
}
