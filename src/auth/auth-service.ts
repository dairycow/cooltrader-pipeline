import axios, { AxiosInstance } from 'axios';
import { AuthSession, PipelineConfig } from '../types/index.js';

export class AuthService {
  private config: PipelineConfig;
  private session: AuthSession;
  private httpClient: AxiosInstance;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.session = { isValid: false };
    
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      withCredentials: true
    });
  }

  /**
   * Authenticate with username/password for CoolTrader aMember system
   */
  async login(): Promise<boolean> {
    try {
      // First, get the login page to extract any required hidden fields
      const loginPageResponse = await this.httpClient.get('/amember/login');
      
      // Extract login_attempt_id from the HTML (simple regex approach)
      const loginAttemptMatch = loginPageResponse.data.match(/name="login_attempt_id" value="([^"]+)"/);
      const loginAttemptId = loginAttemptMatch ? loginAttemptMatch[1] : '';

      // Prepare form data for aMember login
      const formData = new URLSearchParams({
        amember_login: this.config.username,
        amember_pass: this.config.password,
        login_attempt_id: loginAttemptId,
        amember_redirect_url: `${this.config.baseUrl}/amember/eodfiles/nextday/`
      });

      const response = await this.httpClient.post('/amember/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `${this.config.baseUrl}/amember/login`
        },
        maxRedirects: 0, // Don't follow redirects automatically
        validateStatus: (status) => status < 400 // Accept redirects as success
      });

      // Check if login was successful (usually a redirect or 200 with success content)
      if (response.status === 302 || response.status === 200) {
        this.session = {
          cookies: response.headers['set-cookie'] || [],
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours default
          isValid: true
        };

        // Store cookies for future requests
        if (this.session.cookies && this.session.cookies.length > 0) {
          const cookieString = this.session.cookies.map(cookie => cookie.split(';')[0]).join('; ');
          this.httpClient.defaults.headers.common['Cookie'] = cookieString;
        }

        return true;
      }

      return false;
    } catch (error: any) {
      // Handle redirects as potential success
      if (error.response && error.response.status === 302) {
        const location = error.response.headers.location;
        if (location && location.includes('eodfiles')) {
          this.session = {
            cookies: error.response.headers['set-cookie'] || [],
            expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)),
            isValid: true
          };

          if (this.session.cookies && this.session.cookies.length > 0) {
            const cookieString = this.session.cookies.map(cookie => cookie.split(';')[0]).join('; ');
            this.httpClient.defaults.headers.common['Cookie'] = cookieString;
          }

          return true;
        }
      }

      console.error('Login failed:', error.response?.status, error.response?.statusText);
      this.session.isValid = false;
      return false;
    }
  }

  /**
   * Check if current session is valid
   */
  isAuthenticated(): boolean {
    if (!this.session.isValid) return false;
    
    if (this.session.expiresAt && new Date() > this.session.expiresAt) {
      this.session.isValid = false;
      return false;
    }

    return true;
  }

  /**
   * Ensure we have a valid session, login if needed
   */
  async ensureAuthenticated(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return true;
    }

    return await this.login();
  }

  /**
   * Get the HTTP client with authentication headers
   */
  getHttpClient(): AxiosInstance {
    return this.httpClient;
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.session.isValid) {
        await this.httpClient.get('/amember/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.session = { isValid: false };
      delete this.httpClient.defaults.headers.common['Authorization'];
      delete this.httpClient.defaults.headers.common['Cookie'];
    }
  }

  /**
   * Get current session info
   */
  getSession(): AuthSession {
    return { ...this.session };
  }
}