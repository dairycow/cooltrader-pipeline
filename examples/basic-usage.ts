import { EODPipeline } from '../src/index.js';

async function main() {
  // Initialize the pipeline
  const pipeline = new EODPipeline({
    username: process.env.EOD_USERNAME || 'your-username',
    password: process.env.EOD_PASSWORD || 'your-password',
    baseUrl: 'https://your-eod-provider.com/api',
    timeout: 30000
  });

  try {
    // Test connection
    console.log('Testing connection...');
    const isConnected = await pipeline.testConnection();
    if (!isConnected) {
      console.error('Failed to connect to EOD service');
      return;
    }
    console.log('✅ Connected successfully');

    // Fetch daily data
    console.log('\nFetching daily data for 07/01/2025...');
    const dailyData = await pipeline.fetchDaily('07/01/2025');
    console.log(`📊 Fetched ${dailyData.length} records`);
    
    // Show first few records
    console.log('\nFirst 3 records:');
    dailyData.slice(0, 3).forEach(record => {
      console.log(`${record.symbol}: $${record.close} (Vol: ${record.volume.toLocaleString()})`);
    });

    // Fetch specific symbols
    console.log('\nFetching data for specific symbols...');
    const symbolData = await pipeline.fetchSymbols(['AAPL', 'MSFT', 'GOOGL'], '07/01/2025');
    console.log(`🎯 Found ${symbolData.length} matching records`);

    // Fetch historical data
    console.log('\nFetching historical data (March 2025)...');
    const historicalData = await pipeline.fetchHistorical('03/01/2025', '03/31/2025', {
      symbols: ['AAPL', 'MSFT'] // Optional: filter by symbols
    });
    
    console.log(`📈 Historical data summary:`);
    console.log(`  - Total records: ${historicalData.metadata.totalRecords}`);
    console.log(`  - Date range: ${historicalData.metadata.dateRange.start} to ${historicalData.metadata.dateRange.end}`);
    console.log(`  - Symbols: ${historicalData.metadata.symbols.length}`);

    // Analyze data
    if (historicalData.data.length > 0) {
      const avgVolume = historicalData.data.reduce((sum, record) => sum + record.volume, 0) / historicalData.data.length;
      console.log(`  - Average volume: ${Math.round(avgVolume).toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cleanup
    await pipeline.logout();
    console.log('\n👋 Logged out');
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}