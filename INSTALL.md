# Quick Start

This repository defaults to the Web product in `ui/`.

## Run Locally

From the repository root:

```bash
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build And Start

```bash
npm run build
npm run start
```

## Run Tests

```bash
npm run test:run
```

## Real Model Credentials

The app works without any API key.

- No `ui/.env`: runs in `mock` mode
- With `ui/.env`: can call an OpenAI-compatible endpoint

Setup:

```bash
cp ui/.env.example ui/.env
```

Then fill in your own values inside `ui/.env`.
