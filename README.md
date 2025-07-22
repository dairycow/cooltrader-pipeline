# CoolTrader Pipeline

A TypeScript library for downloading and processing End-of-Day (EOD) stock market data from authenticated data providers.

## Features

- 🔐 **Authentication** - Handle login/session management with EOD data providers
- 📊 **Daily Data** - Fetch current day EOD data in CSV format
- 📈 **Historical Data** - Process bulk historical data from zip archives
- 🎯 **Type Safe** - Full TypeScript support with comprehensive type definitions
- 🔍 **Filtering** - Filter data by symbols, date ranges, and more
- ⚡ **Fast** - Optimized for both Bun and Node.js runtimes
- 🧪 **Tested** - Comprehensive test suite included

## Installation

```bash
npm install cooltrader-pipeline
# or
bun add cooltrader-pipeline
```

## Quick Start

```typescript
import { EODPipeline } from 'cooltrader-pipeline';

const pipeline = new EODPipeline({
  username: process.env.EOD_USERNAME!,
  password: process.env.EOD_PASSWORD!,
  baseUrl: 'https://your-eod-provider.com/api'
});

// Fetch today's data
const todayData = await pipeline.fetchDaily('07/01/2025');
console.log(`Fetched ${todayData.length} records`);

// Fetch specific symbols
const appleData = await pipeline.fetchSymbols(['AAPL'], '07/01/2025');

// Fetch historical data
const historicalData = await pipeline.fetchHistorical('01/01/2025', '03/31/2025');
console.log(`Total records: ${historicalData.metadata.totalRecords}`);
```

## Data Format

The library processes CSV data in the following format:
```
Symbol,Date,Open,High,Low,Close,Volume
AAPL,01/07/2025,150.00,155.50,149.75,154.25,25000000
```

## API Reference

### EODPipeline

#### Constructor
```typescript
new EODPipeline(config: PipelineConfig)
```

#### Methods

- `fetchDaily(date: string, options?: FetchOptions): Promise<NormalizedEODData[]>`
- `fetchHistorical(startDate: string, endDate: string, options?: FetchOptions): Promise<BulkDataResult>`
- `fetchSymbols(symbols: string[], date: string): Promise<NormalizedEODData[]>`
- `testConnection(): Promise<boolean>`
- `login(): Promise<boolean>`
- `logout(): Promise<void>`

### Types

```typescript
interface NormalizedEODData {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PipelineConfig {
  username: string;
  password: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing with Sample Data

The repository includes sample data files for testing:
- `20250701.csv` - Daily data sample
- `202503.zip`, `202504.zip`, `202505.zip` - Historical data samples

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request