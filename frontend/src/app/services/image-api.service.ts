import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageApiService {
  endpoint = environment.apiEndpoint;
  imageRouter = this.endpoint + '/api/images';

  constructor(private http: HttpClient) {}

  generateImage(roomId: number): Observable<any> {
    return this.http.post<any>(
      this.imageRouter,
      {
        roomId,
      },
      {},
    );
  }

  getImage(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.imageRouter}/?roomId=${roomId}`, {});
  }
}
