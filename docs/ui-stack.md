# UI Stack and Components

This document provides an overview of the UI libraries and components used in this project.

## Core Libraries

-   **shadcn/ui**: This project uses `shadcn/ui` for its base component library. It provides a set of beautifully designed, accessible, and customizable components that can be easily integrated into the application. Components are added via the CLI and live directly in the codebase for full control.

-   **Framer Motion**: For animations and interactive elements, the application uses `framer-motion`. It's a powerful and easy-to-use animation library for React that helps create fluid and complex animations with simple syntax.

## Key Components

### `BackgroundPaths`

-   **Location**: `src/components/ui/background-path.tsx`
-   **Description**: This is a custom component that renders an animated, generative background of flowing paths. It uses `framer-motion` to animate SVG paths, creating a dynamic and visually engaging effect for hero sections or backgrounds.
-   **Usage**: It's designed to be a full-page container that wraps the main content, placing the animated paths in the background.
