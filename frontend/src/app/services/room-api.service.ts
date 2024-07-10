import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Room } from '../classes/room';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoomApiService {
  endpoint = environment.apiEndpoint;
  roomRouter = this.endpoint + '/api/rooms';
  webhookRouter = this.endpoint + '/api/webhooks';

  token = localStorage.getItem('access_token') || '';
  constructor(private http: HttpClient) {}

  /**
   * Get all rooms
   *
   * @returns {Observable<Room[]>}
   */
  getRooms(): Observable<{ rooms: Room[]; count: number }> {
    return this.http.get<{ rooms: Room[]; count: number }>(
      `${this.roomRouter}/`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );
  }

  /**
   * Create a room
   *
   * @param {Room} room
   * @returns {Observable<Room>}
  //  */
  createRoom(roomName: string, description: string): Observable<Room> {
    return this.http.post<Room>(
      `${this.roomRouter}/`,
      {
        name: roomName,
        description: description,
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );
  }

  deleteRoom(roomId: number): Observable<Room> {
    return this.http.delete<Room>(`${this.roomRouter}/${roomId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  /**
   * Enter a room
   *
   * @param {Room} room
   * @returns none
   */
  enterRoom(room: Room) {
    sessionStorage.setItem('room', JSON.stringify(room));
    return;
  }

  /**
   * Exit a room
   *
   * @param {Room} room
   * @returns none
   */
  exitRoom() {
    sessionStorage.removeItem('room');
    return;
  }

  /**
   * Get current room
   *
   * @returns {Room}
   */
  getCurrentRoom(): Room | null {
    const roomData = sessionStorage.getItem('room');
    if (roomData === null) {
      return null;
    }
    return JSON.parse(roomData);
  }

  sendInvite(name: string, email: string, roomName: string) {
    return this.http.post(
      `${this.webhookRouter}/invite`,
      {
        name,
        email,
        roomName,
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );
  }
}
