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

  token = localStorage.getItem('access_token') || '';
  constructor(private http: HttpClient) {}

  /**
   * Get all objects in a room
   */
  getObjects(roomId: number): Observable<{ objects: Object[]; count: number }> {
    return this.http.get<{ objects: Object[]; count: number }>(
      `${this.objectRouter}/?roomId=${roomId}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );
  }

  /**
   * Create an object
   *
   * @param text Text of the object
   * @param x X coordinate of the object
   * @param y Y coordinate of the object
   * @param size Size of the object
   * @param parentId Parent object id
   * @param roomId Room id
   *
   */
  createObject(
    text: string | null,
    x: number,
    y: number,
    size: number,
    parentId: number | null,
    roomId: number,
  ): Observable<Object> {
    return this.http.post<Object>(
      this.objectRouter,
      { text, x, y, size, parent: parentId, roomId },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );
  }

  /**
   * Update an object
   *
   * @param text Text of the object
   * @param x X coordinate of the object
   * @param y Y coordinate of the object
   * @param size Size of the object
   * @param parentId Parent object id
   *
   */
  updateObject(
    objectId: number,
    text: string | null = null,
    x: number | null = null,
    y: number | null = null,
    size: number | null = null,
    parent: number | null = null,
  ): Observable<Object> {
    console.log('update object', objectId, text, x, y, size, parent);
    console.log(`${this.objectRouter}`);
    return this.http.patch<Object>(
      `${this.objectRouter}/?objectId=${objectId}`,
      {
        text,
        x,
        y,
        size,
        parent,
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );
  }

  /**
   * Delete an object
   *
   * @param objectId Object id
   *
   */
  deleteObject(objectId: number): Observable<Object> {
    return this.http.delete<Object>(`${this.objectRouter}/${objectId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }
}
