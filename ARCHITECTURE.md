# Architecture Notes

This document supplements [README.md](README.md) with implementation details, design trade-offs, and roadmap notes.

## Repository Framing

This repository is intentionally optimized as a small but complete MVP rather than a broad platform.

That means:

- one strong product idea instead of many half-finished features
- local-first architecture to keep setup cost close to zero
- visible user value in the first demo session
- enough implementation depth to discuss engineering choices honestly

In other words, the repository is designed to foreground shipping judgment, not just coding volume.

## Long-Term Vision

This project is not only a short demo artifact. It is an early exploration toward a self-learning, evolving writing tool that helps users build a recognizable personal IP.

The current public version captures the first practical step of that idea:

- remember writing preferences
- learn from accepted output
- reflect those signals back into future generations

It also reflects the way the project was built in practice: through personal experimentation, repeated simplification, and multiple rounds of iteration rather than a single big-design pass.

## Product Summary

AI Persona Writing Studio is a focused writing workbench with a personalization loop at its core:

1. the user writes or edits a chapter
2. AI generates a continuation, polish, summary, or outline
3. the user accepts useful output
4. the system learns from that acceptance
5. later prompts reuse the learned profile

The goal is to make AI feel progressively more aligned with the writer's preferences over time.

## Learning System

The project uses heuristic inference rather than a trained ML pipeline.

When a user accepts an AI result:

1. the system compares `beforeText` and `afterText`
2. it infers preference signals from text deltas
3. it merges those signals into the user's long-term profile
4. it builds future persona prompts from that profile

Why heuristics:

- zero training setup
- explainable signals with reasons
- stable local demo behavior
- easier unit testing

Known limitations:

- thresholds are hand-tuned
- keyword matching misses nuance
- the system does not yet learn from rejected output

## Profile Design

Two controls are intentionally separate:

- `profile.enabled`
- `profile.autoLearningEnabled`

This split makes the product easier to reason about:

- users can inspect the profile without forcing it into prompts
- teams can demo learning behavior separately from prompting behavior
- debugging is simpler because prompt injection and profile updates are not fused into one switch

## Storage Model

Two storage layers are used for different jobs:

- browser storage through Zustand persistence for projects, chapters, and context objects
- local JSON files under `ui/.aiws-data` for model settings and user profile

Why this shape:

- no database required for local demos
- stable behavior across app reloads
- easy to inspect and reset during development
- much lower setup friction for an interview-facing MVP

## API Design

The app exposes a small API surface through Next.js routes:

- settings
- profile
- learning history
- undo learning
- generate
- analyze
- outline

This keeps the architecture simple while making it possible to reuse the same server-side logic from more than one interface later.

## AI Runtime

The runtime supports two modes:

- `mock`
- `openai-compatible`

`mock` mode is more than placeholder text. It uses contextual templates so the app remains demoable without depending on external credentials.

If a real provider fails, the system falls back gracefully instead of hard-failing the whole writing flow.

This is an MVP decision as much as an engineering decision: reliable demos matter more than provider complexity at this stage.

## Outline Workflow

The outline flow is intentionally multi-step:

1. generate initial clarification questions
2. answer the most important missing pieces
3. optionally generate a follow-up round
4. build a structured outline
5. draft a chapter from that outline

This reduces low-signal generation and produces chapter plans that better match author intent.

## MCP Status

This project is not an MCP server yet.

The current architecture is compatible with that future direction because the server logic is already separated into reusable services. A natural next step would be exposing tools such as:

- `generate`
- `learn-profile`
- `get-profile`
- `generate-outline`

That would allow external agents to call the same persona layer used by the Web app.

## Potential Extensions

Near-term ideas:

- confidence scoring for inferred learning events
- profile export and import
- better diff visibility in learning history
- learning from rejected suggestions as well as accepted ones

Medium-term ideas:

- embedding-based style similarity instead of only heuristics
- evaluation harness for prompt quality
- MCP tool layer on top of the same core services

## Testing

Current coverage focuses on the local intelligence layer:

- QC heuristics
- profile learning logic
- API response encoding

Run:

```bash
npm run test:run
```
