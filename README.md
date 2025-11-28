# ChessTard Frontend

A React-based frontend for the ChessTard application built with modern web technologies.

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth
- **Validation**: Zod

## Setup

This project uses [pnpm](https://pnpm.io/) as the package manager.

1. Install pnpm if you haven't already:
   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with the backend API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

## Scripts

Available pnpm scripts for development:

- `pnpm run dev` - Starts the development server with hot reload
- `pnpm run build` - Builds the project for production
- `pnpm run preview` - Previews the production build locally
- `pnpm run lint` - Runs ESLint to check for code issues

## Path Aliases

This project uses the `@` alias for clean import paths throughout the codebase.

### Configuration

**TypeScript compilation:**
- `tsconfig.app.json` maps `"@/*": ["./src/*"]` in `compilerOptions.paths`
- Enables imports like `import { Component } from "@/components/Component"`

**Vite bundler:**
- `vite.config.ts` maps `"@"` to `"./src"` in `resolve.alias`
- Allows the bundler to resolve the alias during development and build

### Usage Example

```typescript
// Instead of: import { Button } from "../../components/Button"
// Use: import { Button } from "@/components/Button"
import { Button } from "@/components/Button";
```

This setup provides clean, consistent imports while supporting both development and production environments.