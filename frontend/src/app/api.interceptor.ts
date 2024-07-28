import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs';
import { ApiService } from './services/api.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private apiService: ApiService) {}

  // Add headers to the request and handle refresh token
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const token = this.apiService.getAccessToken();

    const newReq = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    // for sign out, need to remove the token from the local storage
    if (request.headers.has('X-Skip-Interceptor')) {
      this.apiService.setAccessToken('');
      const newHeaders = request.headers.delete('X-Skip-Interceptor');
      const newReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
        headers: newHeaders,
        withCredentials: true,
      });
      return next.handle(newReq);
    }

    return next.handle(newReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired, attempt to refresh it
          return this.apiService.refreshToken().pipe(
            switchMap((newToken: { access_token: string }) => {
              const { access_token } = newToken;
              // Clone the original request with the new token
              const retryReq = newReq.clone({
                setHeaders: { Authorization: `Bearer ${access_token}` },
              });
              // Retry the request
              return next.handle(retryReq);
            }),
            catchError((refreshError) => {
              // Remove the token from the local storage
              this.apiService.setAccessToken('');
              return throwError(() => {
                return refreshError.error;
              });
            }),
          );
        } else {
          return throwError(() => {
            return error.error;
          });
        }
      }),
    );
  }
}
