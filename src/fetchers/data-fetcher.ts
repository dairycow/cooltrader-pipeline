import { AuthService } from '../auth/auth-service.js';
import { CSVParser } from '../parsers/csv-parser.js';
import { NormalizedEODData, FetchOptions, BulkDataResult } from '../types/index.js';

export class DataFetcher {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Fetch daily EOD data for a specific date from CoolTrader
   */
  async fetchDaily(date: string, options?: FetchOptions): Promise<NormalizedEODData[]> {
    await this.authService.ensureAuthenticated();
    
    try {
      const httpClient = this.authService.getHttpClient();
      
      // Convert date to YYYYMMDD format for CoolTrader
      const formattedDate = this.formatDateForCoolTrader(date);
      
      // Try different possible file locations
      const possiblePaths = [
        `/amember/eodfiles/nextday/asx200/${formattedDate}.csv`,
        `/amember/eodfiles/nextday/${formattedDate}.csv`,
        `/amember/eodfiles/nextday/all/${formattedDate}.csv`
      ];

      let response;
      let foundPath = '';

      for (const path of possiblePaths) {
        try {
          response = await httpClient.get(path, {
            responseType: 'text',
            timeout: 15000
          });
          
          if (response.status === 200 && response.data.length > 0) {
            foundPath = path;
            break;
          }
        } catch (error: any) {
          // Continue to next path if 404
          if (error.response?.status !== 404) {
            throw error;
          }
        }
      }

      if (!response || !foundPath) {
        throw new Error(`No data file found for date ${date} (${formattedDate})`);
      }

      console.log(`✅ Found data at: ${foundPath}`);

      const rawData = CSVParser.parseCSV(response.data);
      let normalizedData = CSVParser.normalize(rawData);

      // Apply filters if specified
      if (options?.symbols && options.symbols.length > 0) {
        normalizedData = CSVParser.filterBySymbols(normalizedData, options.symbols);
      }

      return normalizedData;
    } catch (error: any) {
      console.error(`Failed to fetch daily data for ${date}:`, error.message);
      throw new Error(`Failed to fetch daily data: ${error.message}`);
    }
  }

  /**
   * Convert date string to YYYYMMDD format for CoolTrader
   */
  private formatDateForCoolTrader(date: string): string {
    // Handle various input formats
    let dateObj: Date;
    
    if (date.includes('/')) {
      // MM/DD/YYYY or DD/MM/YYYY format
      const parts = date.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY for now (can be made configurable)
        dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      } else {
        throw new Error(`Invalid date format: ${date}`);
      }
    } else if (date.includes('-')) {
      // YYYY-MM-DD format
      dateObj = new Date(date);
    } else if (date.length === 8) {
      // YYYYMMDD format - already correct
      return date;
    } else {
      // Try to parse as-is
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }

    // Format as YYYYMMDD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  }

  /**
   * List available files in the CoolTrader EOD directory
   */
  async listAvailableFiles(): Promise<string[]> {
    await this.authService.ensureAuthenticated();
    
    try {
      const httpClient = this.authService.getHttpClient();
      const response = await httpClient.get('/amember/eodfiles/nextday/', {
        responseType: 'text'
      });

      // Extract CSV file links from HTML
      const fileLinks = response.data.match(/href="[^"]*\.csv[^"]*"/g) || [];
      return fileLinks.map((link: string) => {
        const match = link.match(/href="([^"]*)"/);
        return match ? match[1] : '';
      }).filter((link: string) => link.length > 0);
    } catch (error: any) {
      console.error('Failed to list available files:', error.message);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Fetch historical data by fetching individual daily files from /nextday/
   * Note: This fetches from recent daily files. For older historical data,
   * users should use the zip files that are available separately.
   */
  async fetchHistorical(startDate: string, endDate: string, options?: FetchOptions): Promise<BulkDataResult> {
    await this.authService.ensureAuthenticated();
    
    try {
      // Generate date range (only business days)
      const dates = this.generateDateRange(startDate, endDate);
      console.log(`📅 Fetching recent daily data for ${dates.length} business days`);

      let allData: NormalizedEODData[] = [];
      const symbols = new Set<string>();
      let successCount = 0;

      for (const date of dates) {
        try {
          const dailyData = await this.fetchDaily(date, options);
          allData = allData.concat(dailyData);
          dailyData.forEach(item => symbols.add(item.symbol));
          successCount++;
          console.log(`✅ Fetched ${dailyData.length} records for ${date}`);
        } catch (error: any) {
          console.log(`⚠️ No data available for ${date} (likely weekend/holiday or too old)`);
        }
      }

      console.log(`📊 Successfully fetched ${successCount}/${dates.length} files`);

      if (successCount === 0) {
        console.log(`💡 Tip: For older historical data, consider using the zip file downloads available separately`);
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
    } catch (error: any) {
      console.error(`Failed to fetch historical data:`, error.message);
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
  }

  /**
   * Generate array of date strings between start and end dates
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];
    
    const current = new Date(start);
    while (current <= end) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}${month}${day}`);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }


}