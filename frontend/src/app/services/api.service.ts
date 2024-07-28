import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GetMeResponse } from '../classes/response';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  endpoint = environment.apiEndpoint;

  oauth2Router = this.endpoint + '/api/oauth2';

  constructor(private http: HttpClient) {}

  /**
   * Sign in without token, trigger OAuth2 server to sign in
   *
   * @returns {Observable<{ url: string }>}
   */
  signIn(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.oauth2Router}/signin`, {});
  }

  /**
   * Get user info
   *
   * @returns {Observable<GetMeResponse>}
   */
  me(): Observable<GetMeResponse> {
    return this.http.get<GetMeResponse>(`${this.endpoint}/api/oauth2/me`, {});
  }

  refreshToken(): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${this.oauth2Router}/refresh`, {}, {})
      .pipe(
        tap((response) => {
          const newToken = response.access_token;
          this.setAccessToken(newToken);
        }),
      );
  }

  /**
   * Log out
   */
  signOut() {
    return this.http.post(
      `${this.oauth2Router}/signout`,
      {},
      {
        headers: new HttpHeaders({
          'X-Skip-Interceptor': 'true', // Custom header to skip interceptor
        }),
      },
    );
  }

  /**
   * Get access token
   *
   * @returns {string}
   */
  getAccessToken() {
    return localStorage.getItem('access_token') || '';
  }

  /**
   * Set access token
   *
   * @param {string} token
   */
  setAccessToken(token: string) {
    if (!token) {
      localStorage.removeItem('access_token');
      return;
    }
    localStorage.setItem('access_token', token);
  }

  getIsCollapsed() {
    return localStorage.getItem('isCollapsed') === 'true';
  }

  setIsCollapsed(isCollapsed: boolean) {
    localStorage.setItem('isCollapsed', isCollapsed ? 'true' : 'false');
  }

  getScrollMode() {
    if (localStorage.getItem('scrollMode') === null) {
      // default is infinite scroll
      return true;
    }
    return localStorage.getItem('scrollMode') === 'true';
  }

  setScrollMode(scrollMode: boolean) {
    // true means infinite scroll, false means pagination
    localStorage.setItem('scrollMode', scrollMode ? 'true' : 'false');
  }

  freeTrial(): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(
      `${this.endpoint}/api/oauth2/freetrial`,
      {},
      {},
    );
  }
}
