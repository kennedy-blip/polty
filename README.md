# PolicyPulse — API Contract Governance Studio

A full-stack TypeScript application combining a Vite + React frontend with Vercel Serverless Functions backend for API contract verification, breaking-change diffing, and release policy gating.

## Features

- **Contract Registry**: Browse and load API service contracts from `/api/contracts`
- **Schema Diff Editor**: Compare baseline vs. candidate JSON schemas with real-time audit
- **Breaking Change Report**: Structured findings grouped by severity with suggested semver bumps
- **Release Gate**: Automatic PASS/BLOCK decisions based on breaking changes
- **Developer Dark Mode**: Obsidian backgrounds, glassmorphic panels, monospace schema display

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4
- **Backend**: Vercel Serverless Functions (`@vercel/node`)
- **Styling**: Tailwind CSS with custom colors and JetBrains Mono font
- **Routing**: React Router DOM (client-side navigation)

## Local Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` with the API available at `/api/*`.

## Build & Deploy

```bash
npm run build
```

The built static site is ready for deployment on Vercel. The `vercel.json` configuration handles SPA rewrites and API routing.

## API Endpoints

- `GET /api/contracts` – List registered service contracts
- `POST /api/contracts` – Register or update a contract
- `DELETE /api/contracts` – Remove a contract by ID
- `POST /api/audit` – Run schema compatibility audit

## Project Structure

```
.
├── api/
│   ├── contracts.ts      # Serverless function for contract management
│   └── audit.ts          # Serverless function for schema audit
├── src/
│   ├── components/       # React components
│   │   ├── PolicyHeader.tsx
│   │   ├── SchemaDiffEditor.tsx
│   │   ├── BreakingChangeReport.tsx
│   │   └── ContractRegistry.tsx
│   ├── types.ts          # TypeScript type definitions
│   ├── App.tsx           # Main application router
│   ├── main.tsx          # React entry point
│   └── index.css         # Tailwind base styles
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── index.html
```

## Deployment

Push to GitHub and enable Vercel deployment. Vercel will automatically detect the `vercel.json` configuration and serve the static site with serverless functions.

## License

MIT