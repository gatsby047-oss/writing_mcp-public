# Product Demo Outline

This document provides a concise 5-8 minute walkthrough for presenting the product to interviewers, collaborators, or technical reviewers.

## 1. Positioning

Key message:

> This is a Chinese-first AI writing workbench focused on personalization.  
> The key idea is not just generation, but that the system learns from accepted output and gradually builds a reusable writing profile.

## 2. Show The Four Views

What to show:

1. `Bookshelf`
2. `Workbench`
3. `Profile`
4. `Settings`

Key point:

> The product stays intentionally narrow so the main loop remains easy to understand: write, ask AI for help, accept or reject, update the profile, and generate again with better alignment.

## 3. Create Or Open A Project

What to show in `Workbench`:

1. Create a new project
2. Set genre, tone, and audience
3. Point out the project-level style overlay

Key point:

> The product uses two layers of personalization: a long-term user profile and a per-project style overlay for the current writing task.

## 4. Write A Small Draft

What to show:

- a short paragraph in the chapter editor
- chapter summary
- outline fields
- lightweight context such as characters, foreshadows, and banned phrases

Key point:

> The workbench keeps only the context objects that most directly improve writing quality and prompt control instead of becoming a heavy CMS.

## 5. Trigger AI

Suggested actions:

1. `Polish` or `Continue`
2. optionally `Chapter diagnosis`

What to point out:

- current provider mode
- whether persona is injected
- preview before apply

Key point:

> The model layer supports both `mock` mode and an OpenAI-compatible mode. `mock` mode keeps the app stable to demo even without live credentials.

## 6. Accept The Result

What to show:

- click apply
- if auto-learning is enabled, show the resulting learning event

Key point:

> Accepting a result creates a learning event. The system compares before and after text, infers preference signals, and updates the user profile.

## 7. Open Profile

What to show in `Profile`:

- style fingerprint
- preference signals
- learning history
- manual learning input
- undo last learning

Key point:

> The learning system is inspectable and controllable, so the memory layer remains visible rather than acting like a black box.

## 8. Show Settings

What to show in `Settings`:

- `mock` vs `openai-compatible`
- persona toggle
- auto-learning toggle

Key point:

> Persona usage and auto-learning are intentionally separated, which makes the system easier to reason about and easier to demonstrate.

## 9. Close With Architecture

Key point:

> The frontend stores project data locally for reliability. The server stores model settings and the user profile in local JSON files so API routes can read and update them consistently. The API surface stays intentionally small: settings, profile, learning, generate, analyze, and outline.

## 10. Closing Direction

Suggested closing focus:

> Likely next steps include stronger prompt evaluation, better confidence signals for learning events, and an MCP tool layer on top of the same persona services.
