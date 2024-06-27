import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../classes/user';
import { GetMeResponse } from '../classes/response';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  endpoint = environment.apiEndpoint;

  oauth2Router = this.endpoint + '/api/oauth2';

  token = localStorage.getItem('access_token') || '';

  constructor(private http: HttpClient) {}

  /**
   * Sign in without token, trigger OAuth2 server to sign in
   *
   * @returns {Observable<{ url: string }>}
   */
  signIn(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.oauth2Router}/signin`);
  }

  /**
   * Get user info
   *
   * @returns {Observable<GetMeResponse>}
   */
  me(): Observable<GetMeResponse> {
    return this.http.get<GetMeResponse>(`${this.endpoint}/api/oauth2/me`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  /**
   * Get access token
   *
   * @returns {string}
   */
  getAccessToken() {
    return this.token;
  }

  /**
   * Set access token
   *
   * @param {string} token
   */
  setAccessToken(token: string) {
    if (!token) {
      return;
    }
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  /**
   * Log out
   */
  signOut() {
    const removeToken = this.token;
    this.token = '';
    localStorage.removeItem('access_token');
    return this.http.get(`${this.oauth2Router}/signout`, {
      headers: {
        Authorization: `Bearer ${removeToken}`,
      },
    });
  }
}
