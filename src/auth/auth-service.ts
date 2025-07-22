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
   * Authenticate with username/password
   */
  async login(): Promise<boolean> {
    try {
      // This is a placeholder - you'll need to adapt this to your specific EOD service
      const response = await this.httpClient.post('/login', {
        username: this.config.username,
        password: this.config.password
      });

      if (response.status === 200) {
        this.session = {
          token: response.data.token,
          cookies: response.headers['set-cookie'] || [],
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours default
          isValid: true
        };

        // Set default headers for future requests
        if (this.session.token) {
          this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.session.token}`;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
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
        await this.httpClient.post('/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.session = { isValid: false };
      delete this.httpClient.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Get current session info
   */
  getSession(): AuthSession {
    return { ...this.session };
  }
}