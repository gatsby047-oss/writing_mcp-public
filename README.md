# AI Persona Writing Studio

AI Persona Writing Studio is a Chinese-first writing workbench built as a fast, interview-facing MVP.

It focuses on one narrow but complete product loop:

1. persistent writing preferences
2. profile-aware prompting
3. a learn-from-acceptance feedback loop
4. outline-to-draft generation for chapter writing

The result is a focused app where AI suggestions become more aligned with the user's style over time, instead of behaving like a stateless text box on every request.

![Workbench overview](./docs/overview.png)

## What This Repo Contains

This repository is the public Web edition of the project.

- The main product lives in `ui/`, built with Next.js App Router.
- The UI includes `Bookshelf`, `Workbench`, `Profile`, and `Settings`.
- The server side is implemented with Next.js API routes plus local JSON storage.
- `mock` mode is available for stable demos without real model credentials.

## For Interviewers

This repo is intentionally framed as a minimal vibecoding-style MVP:

- one clear user problem: generic AI writing tools do not remember the writer
- one visible product thesis: accepted output should improve later generations
- one end-to-end demo loop: write -> generate -> accept -> learn -> generate again
- minimal infrastructure: no auth, no database, no cloud dependency required for the core demo
- stable execution: `mock` mode keeps the product usable even without API keys

The point is not feature breadth. The point is showing product judgment, scope control, fast iteration, and a working personalization loop.

## Why This Is A Good Minimal MVP

- It solves a real interaction problem instead of only wrapping a model endpoint.
- It keeps the system understandable enough to demo in a few minutes.
- It includes both product UI and server-side behavior, so it feels like a real shipped slice.
- It is small enough to build quickly, but opinionated enough to discuss trade-offs seriously.

## Current Status

This repo is a Web app with API routes, not a standalone MCP server.

- You can run it as a local writing studio today.
- The current API surface is designed so an MCP layer can be added later.
- The planned MCP direction is to expose profile-aware generation and learning as tools on top of the same core services, rather than rebuilding the logic twice.

## Core Features

- Persistent user profile with controllable persona injection
- Auto-learning from accepted AI output, plus manual learning input
- Project-level style overlay for genre, tone, audience, and writing constraints
- Multi-round outline workflow before full chapter generation
- Local QC checks for draft quality and banned phrases
- Dual provider mode: `mock` and `openai-compatible`

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Zustand
- Tailwind CSS
- Vitest

## Local Development

From the repository root:

```bash
npm run setup
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Production Check

```bash
npm run build
npm run start
```

## Tests

From the repository root:

```bash
npm run test:run
```

Or from `ui/`:

```bash
npm test
npm run test:run
```

## Environment Variables

Real model calls are optional. Without `ui/.env`, the app runs in `mock` mode automatically.

To enable an OpenAI-compatible provider:

1. Copy `ui/.env.example` to `ui/.env`
2. Fill in your own credentials

Default example values use a DashScope-compatible endpoint, but the code path is designed for OpenAI-compatible chat-completions APIs in general.

## Project Structure

```text
.
|- ui/
|  |- src/app/               # App Router pages and API routes
|  |- src/components/        # Product UI
|  |- src/lib/               # shared types, client calls, QC, state
|  \- src/lib/server/        # AI runtime, profile service, local storage
|- DEMO_SCRIPT.md            # short product walkthrough
|- INSTALL.md                # quick start
\- ARCHITECTURE.md           # design notes and roadmap
```

## API Surface

The Web app exposes a small local API:

- `GET/POST /api/settings/model`
- `GET/POST /api/profile`
- `POST /api/profile/learn`
- `GET /api/profile/learning-history`
- `POST /api/profile/undo`
- `POST /api/ai/generate`
- `POST /api/ai/analyze`
- `POST /api/ai/outline`

## Design Notes

- Project data is persisted in browser storage with Zustand.
- Model settings and the learned user profile are stored in local JSON files under `ui/.aiws-data`.
- The product is intentionally narrow so the personalization loop stays understandable.
- The learning layer uses heuristics rather than a training pipeline, which keeps the demo explainable and fast to run locally.
- The scope is deliberately MVP-sized: one strong loop, low setup cost, and clear demoability.

More detail:

- [INSTALL.md](./INSTALL.md)
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

## License

MIT. See [LICENSE](./LICENSE).
