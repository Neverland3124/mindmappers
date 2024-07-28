import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Room } from '../classes/room';
import { Object } from '../classes/object';

import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ObjectApiService {
  endpoint = environment.apiEndpoint;
  objectRouter = this.endpoint + '/api/objects';

  constructor(private http: HttpClient) {}

  /**
   * Get all objects in a room
   */
  getObjects(roomId: number): Observable<{ objects: Object[]; count: number }> {
    return this.http.get<{ objects: Object[]; count: number }>(
      `${this.objectRouter}/?roomId=${roomId}`,
      {},
    );
  }

  createAllObjects(roomId: number, nodes: any[]): Observable<Object> {
    return this.http.post<Object>(this.objectRouter, { roomId, nodes }, {});
  }

  updateAllObjects(roomId: number, nodes: any[]): Observable<Object> {
    return this.http.patch<Object>(
      `${this.objectRouter}/`,
      {
        roomId,
        nodes,
      },
      {},
    );
  }

  deleteAllObjects(roomId: number, objectIds: any[]): Observable<Object> {
    return this.http.delete<Object>(`${this.objectRouter}/`, {
      body: {
        roomId,
        objectIds,
      },
    });
  }
}
