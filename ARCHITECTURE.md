# Project Design Solver - Architecture

This application follows a **Service-Oriented Architecture** with a clear separation between the **UI Layer** (React + Tailwind) and the **Service Layer** (Generative AI Engine).

## 📂 Directory Structure

```text
/
├── App.tsx             # Main Orchestrator (State Management & UI Layout)
├── types.ts            # Shared Domain Model (Expert Roles, Artifact Types)
├── services/
│   └── pocketFlow.ts   # The "Engine" (Service Layer) - Manages Multi-Agent flow
├── components/         # Atomic UI Components (Material 3 Philosophy)
│   ├── ArtifactCard.tsx    # Neural Projection Visualizer
│   ├── SideDrawer.tsx      # Expert Specification Detail View
│   ├── AppMapViewer.tsx    # Technical Roadmap Visualizer
│   └── DottedBackground.tsx # Immersive Ambient UI
└── ARCHITECTURE.md     # This file
```

## 🧠 Service Layer: The Design Solver

The core logic resides in `services/pocketFlow.ts`. It orchestrates a multi-stage **Neural Projection** process:

1.  **Intent Agent**: Decrypts the user's "vague" idea into structured goals and constraints.
2.  **Product Cartographer**: Mapped out the application modules and functional priority.
3.  **Expert Team (Parallel)**:
    *   **UX Expert**: Defines critical user journeys and flows.
    *   **UI Expert**: Architecturally projects layout grids and zones.
    *   **Data Architect**: Models entities and relationships.
2.  **Synthesis Agent (Prototypes)**: Generates 3 high-fidelity, interactive HTML/Tailwind CSS visual proposals.

## 🎨 UI Layer: Material 3 Immersive

The UI uses **Material Design 3** principles adapted for a high-tech "Neural" aesthetic.
-   **Projection Deck**: A grid of cards where each "Expert" delivers their specialized artifact.
-   **Side Drawer**: Provides deep-dive technical logs and live interactive prototype shells.
-   **App Map**: A high-level architectural view for technical grounding.

## 🛠 Tech Stack

-   **Engine**: Gemini 3 Flash Preview via `@google/genai`.
-   **Frontend**: React + Tailwind CSS.
-   **Icons**: Lucide-React.
-   **Animations**: Tailwind + Framer-inspired CSS transitions.
