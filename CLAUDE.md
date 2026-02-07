# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check with `tsc -b` then build with Vite
- `npm run lint` — Run ESLint across the project
- `npm run preview` — Preview the production build locally

## Architecture

This is a React 19 + TypeScript app built with Vite 7. It was scaffolded from the Vite React-TS template and is intended to become a family travel map application.

- **Entry point:** `index.html` loads `src/main.tsx`, which renders `<App />` inside `<StrictMode>`
- **Build tool:** Vite with `@vitejs/plugin-react` (Babel-based)
- **TypeScript:** Project references split into `tsconfig.app.json` (app source) and `tsconfig.node.json` (tooling config)
- **Linting:** ESLint 9 flat config with `typescript-eslint`, `react-hooks`, and `react-refresh` plugins
