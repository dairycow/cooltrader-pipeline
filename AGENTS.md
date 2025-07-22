# AGENTS.md - Development Guidelines

## Build/Test Commands
- `npm run build` - Compile TypeScript to dist/
- `npm run test` - Run all Jest tests
- `npm run test -- csv-parser.test.ts` - Run single test file
- `npm run lint` - Run ESLint on src/**/*.ts
- `npm run typecheck` - TypeScript type checking without emit
- `npm run dev` - Run development server with tsx

## Code Style Guidelines
- **Imports**: Use `.js` extensions for local imports (ESM compatibility)
- **Types**: Strict TypeScript, all exports must be typed
- **Classes**: PascalCase, private members prefixed with underscore
- **Interfaces**: PascalCase, descriptive names (e.g., `NormalizedEODData`)
- **Methods**: camelCase, JSDoc comments for public methods
- **Error Handling**: Try-catch with console.error, return null/false for parsing failures
- **Formatting**: 2-space indentation, semicolons required
- **File Structure**: Barrel exports in types/index.ts, organized by feature

## Architecture Notes
- ESNext modules with Node resolution
- Jest for testing with ts-jest preset
- No ESLint config found - follow TypeScript strict mode conventions
- CSV parsing without headers: Symbol,Date,Open,High,Low,Close,Volume format