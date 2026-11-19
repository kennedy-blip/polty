# Specification

## Project Setup

### Prerequisites
- Node.js (>=18)
- npm (>=9)

### Installation
```bash
npm install
```

### Development
Run the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Building for Production
```bash
npm run build
```
The production build will be output to the `dist` directory.

### Preview Production Build
```bash
npm run preview
```

## Project Structure
- `src/` – React source code.
- `api/` – Vercel serverless functions (TypeScript).
- `public/` – Static assets (e.g., `index.html`).
- `vite.config.ts` – Vite configuration.
- `tsconfig.json` – TypeScript configuration.

## Running Tests
The repository currently does not include automated tests.

## License
MIT
