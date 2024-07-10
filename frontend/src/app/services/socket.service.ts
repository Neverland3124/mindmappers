import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private url = environment.apiEndpoint;
  private socket: any;
  constructor() {

  }

  connect() {
    this.socket = io(this.url, {
      transports: ['websocket'],
    });  
  }

  listen(eventName: string, callback: (data: any) => void) {
    this.socket.on(eventName, callback);
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  removeAllListeners() {
    this.socket.removeAllListeners();
  }
}
