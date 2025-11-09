# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `src/app`, with top-level routes such as `firecrawl/`, `elementor-editor/`, `voice-chat/`, and API handlers under `src/app/api/*`. Shared UI primitives and feature widgets sit in `src/components`, while `src/lib` holds tool registries, API clients, and utility logic; pair them with stateful hooks from `src/hooks` and shared contracts in `src/types`. Global styles are in `src/app/globals.css` plus feature-specific assets in `public/`, `widgets/`, and `style-kit-demo/`. Long-form references live in `docs/`, and executable examples plus Jest-style suites belong under `tests/`, with additional scripted harnesses (`test-stylekit-generation.mjs`, `test-api.mjs`, etc.) in the repo root.

## Build, Test, and Development Commands
- `npm run dev` (or `pnpm dev`): launches Next.js with Turbopack; use when iterating on UI routes inside `src/app`.
- `npm run build`: production build that exercises every route; required before publishing.
- `npm run start`: serves the compiled output to mimic Vercel.
- `npm run lint`: runs the Next.js ESLint config (`eslint.config.mjs`) and blocks unformatted imports.
- `npm run test-reasoning` or `node test-stylekit-generation.mjs`: validates AI gateway flow and style-kit export logic; pass model IDs via env vars if needed.

## Coding Style & Naming Conventions
Write features in TypeScript with functional React components and keep indentation at two spaces (matching existing files). Components use `PascalCase`, hooks `useCamelCase`, and shared helpers `camelCase`; keep file names lowercase with dashes under `src/app` so routes stay predictable. Tailwind classes should be grouped from layout → spacing → effects, and keep business logic outside components by leaning on `src/lib/*`. Always run `npm run lint` before committing so Next/TypeScript rules and import ordering stay consistent.

## Testing Guidelines
Browser-dependent integration tests live in `tests/playground-integration.test.ts` and assume a WordPress Playground client; guard tests with environment checks before asserting. Name new suites `*.test.ts(x)` and colocate near the code unless they interact with multiple routes, in which case prefer the top-level `tests/` folder. Use the targeted harness scripts (`test-*.mjs`) when validating AI workflow regressions or style-kit exporters; they can be run directly with `node`. Document any third-party mocks or required env vars inside the test file header so other agents can replay the scenario.

## Commit & Pull Request Guidelines
Follow the conventional short prefix seen in history (`feat:`, `fix:`, `chore:`, `docs:`) plus a concise, imperative summary. Commits should group related code, doc, and test updates per feature so reviewers can revert cleanly. Every PR needs: a paragraph summarizing scope, a checklist of affected routes or scripts, screenshots or recordings for UI changes, and links to tracking issues. Mention any required env changes and list manual test steps so AI agents can replay them quickly before merging.

## Security & Configuration Tips
Store API keys (Firecrawl, Vercel AI Gateway, Supabase, Cartesia) in `.env.local` and never check them in; redact dumps in PRs. Review `assistant-config.json` and `vercel.json` before editing to keep deployment targets consistent, and strip large generated assets from diffs unless the change is intentional.
