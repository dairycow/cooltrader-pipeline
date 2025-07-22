import { CSVParser } from '../src/parsers/csv-parser';

describe('CSVParser', () => {
  const sampleCSVContent = `360,01/07/2025,32.38,33.81,32.38,33.59,1256137
14D,01/07/2025,0.017,0.018,0.017,0.018,174103
1AD,01/07/2025,0.002,0.002,0.002,0.002,3800000`;

  test('should parse CSV content correctly', () => {
    const result = CSVParser.parseCSV(sampleCSVContent);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      symbol: '360',
      date: '01/07/2025',
      open: 32.38,
      high: 33.81,
      low: 32.38,
      close: 33.59,
      volume: 1256137
    });
  });

  test('should normalize data with Date objects', () => {
    const rawData = CSVParser.parseCSV(sampleCSVContent);
    const normalized = CSVParser.normalize(rawData);
    
    expect(normalized[0].date).toBeInstanceOf(Date);
    expect(normalized[0].date.getFullYear()).toBe(2025);
    expect(normalized[0].date.getMonth()).toBe(6); // July (0-indexed, so 6 = July)
    expect(normalized[0].date.getDate()).toBe(1); // 01/07/2025 = 1st July 2025
  });

  test('should filter by symbols', () => {
    const rawData = CSVParser.parseCSV(sampleCSVContent);
    const normalized = CSVParser.normalize(rawData);
    const filtered = CSVParser.filterBySymbols(normalized, ['360', '1AD']);
    
    expect(filtered).toHaveLength(2);
    expect(filtered.map(d => d.symbol)).toEqual(['360', '1AD']);
  });

  test('should validate data structure', () => {
    const validData = {
      symbol: 'AAPL',
      date: '01/07/2025',
      open: 100,
      high: 105,
      low: 99,
      close: 103,
      volume: 1000000
    };

    const invalidData = {
      symbol: 'AAPL',
      date: '01/07/2025',
      open: 100,
      high: 95, // Invalid: high < low
      low: 99,
      close: 103,
      volume: 1000000
    };

    expect(CSVParser.validate(validData)).toBe(true);
    expect(CSVParser.validate(invalidData)).toBe(false);
  });

  test('should handle malformed CSV rows gracefully', () => {
    const malformedCSV = `360,01/07/2025,32.38,33.81,32.38,33.59,1256137
INVALID_ROW
14D,01/07/2025,0.017,0.018,0.017,0.018,174103`;

    const result = CSVParser.parseCSV(malformedCSV);
    expect(result).toHaveLength(2); // Should skip the invalid row
  });
});