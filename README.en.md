# AI Persona Writing Studio

[中文](./README.md) | [English](./README.en.md)

A Chinese-first, interview-facing AI writing MVP.

It focuses on one narrow but complete product loop:

1. persistent writing preferences
2. profile-aware prompting
3. a learn-from-acceptance feedback loop
4. outline-to-draft generation for chapter writing

The point is not to wrap a model endpoint one more time. The point is to validate a more specific product belief:
an AI writing tool should remember the writer, learn from accepted output, and gradually become a more personal creative partner.

![Workbench overview](./docs/overview.png)

## 30-Second Takeaway

This is a minimal but complete product slice built to explore one core idea:
an AI writing tool should remember the writer, learn from accepted output, and gradually evolve toward a more personal creative partner.

- product angle: personalization instead of one-off generation
- MVP scope: write -> generate -> accept -> learn -> generate again
- engineering angle: local-first, low setup cost, explainable behavior, stable demo path

## Project Philosophy

This project is an early exploration toward a self-learning writing tool for building a creator's personal IP.

It grew out of personal experimentation and multiple rounds of iteration. The long-term goal is not only to generate text, but to accumulate preference memory, reinforce stylistic identity, and become a more personal creative partner over time.

## What This Repo Contains

This repository is the public Web edition of the project.

- The main product lives in `ui/`, built with Next.js App Router.
- The UI includes `Bookshelf`, `Workbench`, `Profile`, and `Settings`.
- The repo landing page is Chinese-first, while the app UI itself supports an English toggle.
- The server side is implemented with Next.js API routes plus local JSON storage.
- `mock` mode is available for stable demos without real model credentials.

## For Interviewers

This repo is intentionally framed as a minimal vibecoding-style MVP:

- one clear user problem: generic AI writing tools do not remember the writer
- one visible product thesis: accepted output should improve later generations
- one longer-term direction: evolve toward a self-learning personal-IP writing tool
- one end-to-end demo loop: write -> generate -> accept -> learn -> generate again
- minimal infrastructure: no auth, no database, no cloud dependency required for the core demo
- stable execution: `mock` mode keeps the product usable even without API keys

The goal is not feature breadth. The goal is to show product judgment, scope control, fast iteration, and a working personalization loop.

## If You Only Review Three Things

If you are scanning this repository quickly, start here:

1. [README.md](./README.md): product thesis, MVP scope, and demo framing
2. [ARCHITECTURE.md](./ARCHITECTURE.md): the learning loop, storage choices, and evolution path
3. [DEMO_SCRIPT.md](./DEMO_SCRIPT.md): the shortest path to understanding the product flow in action

## Why This Is A Good Minimal MVP

- It solves a real interaction problem instead of only wrapping a model endpoint.
- It is understandable enough to demo in a few minutes.
- It includes both product UI and server-side behavior, so it feels like a real shipped slice.
- It is small enough to build quickly, but opinionated enough to discuss trade-offs seriously.
- It leaves room for a larger personal-tooling vision without pretending the first version already solves everything.

## Current Status

This repo is currently a Web app, not a standalone MCP server.

- You can run it today as a local writing studio.
- The current API structure already leaves room for a future MCP layer.
- The more sensible next step is to expose profile-aware generation and learning as tools on top of the same service layer, instead of rebuilding the logic twice.

## Core Features

- Persistent user profile with controllable persona injection
- Auto-learning from accepted AI output, plus manual learning input
- Chinese-first interface with switchable English UI copy
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

The example values use a DashScope-style endpoint, but the implementation is designed for OpenAI-compatible chat completions APIs in general.

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
