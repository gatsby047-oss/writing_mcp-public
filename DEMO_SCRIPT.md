# Product Demo Walkthrough

This is a short 5-8 minute walkthrough for showing the product to other developers, recruiters, or collaborators.

## 1. Open With Positioning

Say:

> This is a Chinese-first AI writing workbench focused on personalization.  
> The key idea is not just generation, but that the system learns from accepted output and gradually builds a reusable writing profile.

## 2. Show The Four Views

Walk through:

1. `Bookshelf`
2. `Workbench`
3. `Profile`
4. `Settings`

Say:

> I intentionally kept the product narrow so the main loop stays obvious: write, ask AI for help, accept or reject, update the profile, and generate again with better alignment.

## 3. Create Or Open A Project

In `Workbench`:

1. Create a new project
2. Set genre, tone, and audience
3. Point out that this is the project-level style overlay

Say:

> There are two layers of personalization here.  
> One is the long-term user profile, and the other is the per-project style overlay for the current writing task.

## 4. Write A Small Draft

Type a short paragraph in the chapter editor.

Then point to:

- chapter summary
- outline fields
- lightweight context like characters, foreshadows, and banned phrases

Say:

> I kept only the context objects that most directly improve writing quality and prompt control, instead of turning the product into a heavy CMS.

## 5. Trigger AI

Run:

1. `Polish` or `Continue`
2. optionally `Chapter diagnosis`

Point out:

- current provider mode
- whether persona is injected
- preview before apply

Say:

> The model layer supports both `mock` mode and an OpenAI-compatible mode.  
> `mock` mode makes the app stable to demo even without live credentials.

## 6. Accept The Result

Click apply.

If auto-learning is enabled, explain:

> Accepting this result creates a learning event.  
> The system compares before and after text, infers preference signals, and updates the user profile.

## 7. Open Profile

In `Profile` show:

- style fingerprint
- preference signals
- learning history
- manual learning input
- undo last learning

Say:

> The learning system is inspectable and controllable.  
> I wanted the memory layer to feel visible, not like a black box.

## 8. Show Settings

In `Settings` show:

- `mock` vs `openai-compatible`
- persona toggle
- auto-learning toggle

Say:

> I separated "use persona" from "auto-learn" on purpose.  
> That makes the system easier to reason about and easier to demo.

## 9. Close With Architecture

Say:

> The frontend stores project data locally for reliability.  
> The server stores model settings and the user profile in local JSON files so API routes can read and update them consistently.  
> The API surface is intentionally small: settings, profile, learning, generate, analyze, and outline.

## 10. Suggested Closing Line

> If I extended this further, I would add better prompt evaluation, stronger learning confidence signals, and an MCP tool layer on top of the same persona services.
