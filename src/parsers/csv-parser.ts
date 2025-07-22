import { EODData, NormalizedEODData, ParsedCSVRow } from '../types/index.js';

export class CSVParser {
  /**
   * Parse CSV content without headers
   * Format: Symbol,Date,Open,High,Low,Close,Volume
   */
  static parseCSV(csvContent: string): EODData[] {
    const lines = csvContent.trim().split('\n');
    const results: EODData[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const row = this.parseCSVRow(line);
      if (row) {
        results.push(row);
      }
    }

    return results;
  }

  private static parseCSVRow(line: string): EODData | null {
    try {
      const columns = line.split(',');
      
      if (columns.length !== 7) {
        console.warn(`Invalid CSV row format: ${line}`);
        return null;
      }

      const [symbol, date, open, high, low, close, volume] = columns;

      return {
        symbol: symbol.trim(),
        date: date.trim(),
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseInt(volume, 10)
      };
    } catch (error) {
      console.error(`Error parsing CSV row: ${line}`, error);
      return null;
    }
  }

  /**
   * Normalize EOD data by converting date string to Date object
   */
  static normalize(data: EODData[]): NormalizedEODData[] {
    return data.map(item => ({
      ...item,
      date: this.parseDate(item.date)
    }));
  }

  private static parseDate(dateStr: string): Date {
    // Convert MM/DD/YYYY to Date object
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  }

  /**
   * Filter data by symbol(s)
   */
  static filterBySymbols(data: NormalizedEODData[], symbols: string[]): NormalizedEODData[] {
    const symbolSet = new Set(symbols.map(s => s.toUpperCase()));
    return data.filter(item => symbolSet.has(item.symbol.toUpperCase()));
  }

  /**
   * Filter data by date range
   */
  static filterByDateRange(
    data: NormalizedEODData[], 
    startDate?: Date, 
    endDate?: Date
  ): NormalizedEODData[] {
    return data.filter(item => {
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });
  }

  /**
   * Validate EOD data structure
   */
  static validate(data: EODData): boolean {
    return (
      typeof data.symbol === 'string' &&
      typeof data.date === 'string' &&
      typeof data.open === 'number' &&
      typeof data.high === 'number' &&
      typeof data.low === 'number' &&
      typeof data.close === 'number' &&
      typeof data.volume === 'number' &&
      !isNaN(data.open) &&
      !isNaN(data.high) &&
      !isNaN(data.low) &&
      !isNaN(data.close) &&
      !isNaN(data.volume) &&
      data.high >= data.low &&
      data.volume >= 0
    );
  }
}