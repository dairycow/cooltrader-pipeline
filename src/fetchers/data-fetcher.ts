import { AuthService } from '../auth/auth-service.js';
import { CSVParser } from '../parsers/csv-parser.js';
import { NormalizedEODData, FetchOptions, BulkDataResult } from '../types/index.js';
import * as yauzl from 'yauzl';
import { promisify } from 'util';

export class DataFetcher {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Fetch daily EOD data for a specific date
   */
  async fetchDaily(date: string, options?: FetchOptions): Promise<NormalizedEODData[]> {
    await this.authService.ensureAuthenticated();
    
    try {
      const httpClient = this.authService.getHttpClient();
      
      // This endpoint structure is a placeholder - adapt to your EOD service
      const response = await httpClient.get(`/data/daily/${date}.csv`, {
        responseType: 'text'
      });

      const rawData = CSVParser.parseCSV(response.data);
      let normalizedData = CSVParser.normalize(rawData);

      // Apply filters if specified
      if (options?.symbols && options.symbols.length > 0) {
        normalizedData = CSVParser.filterBySymbols(normalizedData, options.symbols);
      }

      return normalizedData;
    } catch (error) {
      console.error(`Failed to fetch daily data for ${date}:`, error);
      throw new Error(`Failed to fetch daily data: ${error}`);
    }
  }

  /**
   * Fetch historical data (zip files containing multiple CSV files)
   */
  async fetchHistorical(startDate: string, endDate: string, options?: FetchOptions): Promise<BulkDataResult> {
    await this.authService.ensureAuthenticated();
    
    try {
      const httpClient = this.authService.getHttpClient();
      
      // Determine which zip files we need based on date range
      const zipFiles = this.getRequiredZipFiles(startDate, endDate);
      
      let allData: NormalizedEODData[] = [];
      const symbols = new Set<string>();

      for (const zipFile of zipFiles) {
        const response = await httpClient.get(`/data/historical/${zipFile}`, {
          responseType: 'arraybuffer'
        });

        const zipData = await this.extractZipData(Buffer.from(response.data));
        const normalizedData = CSVParser.normalize(zipData);
        
        allData = allData.concat(normalizedData);
        normalizedData.forEach(item => symbols.add(item.symbol));
      }

      // Apply date range filter
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      allData = CSVParser.filterByDateRange(allData, startDateObj, endDateObj);

      // Apply symbol filter if specified
      if (options?.symbols && options.symbols.length > 0) {
        allData = CSVParser.filterBySymbols(allData, options.symbols);
      }

      return {
        data: allData,
        metadata: {
          totalRecords: allData.length,
          dateRange: {
            start: startDate,
            end: endDate
          },
          symbols: Array.from(symbols)
        }
      };
    } catch (error) {
      console.error(`Failed to fetch historical data:`, error);
      throw new Error(`Failed to fetch historical data: ${error}`);
    }
  }

  /**
   * Extract and parse CSV files from zip archive
   */
  private async extractZipData(zipBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const allData: any[] = [];

      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }

        if (!zipfile) {
          reject(new Error('Failed to open zip file'));
          return;
        }

        zipfile.readEntry();

        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            zipfile.readEntry();
          } else if (entry.fileName.endsWith('.csv')) {
            // CSV file entry
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              if (!readStream) {
                zipfile.readEntry();
                return;
              }

              let csvContent = '';
              readStream.on('data', (chunk) => {
                csvContent += chunk.toString();
              });

              readStream.on('end', () => {
                const csvData = CSVParser.parseCSV(csvContent);
                allData.push(...csvData);
                zipfile.readEntry();
              });

              readStream.on('error', (err) => {
                reject(err);
              });
            });
          } else {
            zipfile.readEntry();
          }
        });

        zipfile.on('end', () => {
          resolve(allData);
        });

        zipfile.on('error', (err) => {
          reject(err);
        });
      });
    });
  }

  /**
   * Determine which zip files are needed for a date range
   */
  private getRequiredZipFiles(startDate: string, endDate: string): string[] {
    // This is a simplified implementation
    // You'll need to adapt this based on your EOD service's file naming convention
    const start = new Date(startDate);
    const end = new Date(endDate);
    const zipFiles: string[] = [];

    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      zipFiles.push(`${year}${month}.zip`);
      
      current.setMonth(current.getMonth() + 1);
    }

    return zipFiles;
  }
}