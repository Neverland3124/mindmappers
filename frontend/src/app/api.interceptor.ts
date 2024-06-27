import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor() {}

  /**
   * If we were using access tokens to secure our backend instead of cookies, this would be
   * super useful, as it can intercept all HTTP requests made from Angular's HTTPClient and
   * you can make it append arbitrary HTTP headers.
   */
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const newReq = request.clone({
      withCredentials: true,
    });
    return next.handle(newReq);
  }
}
