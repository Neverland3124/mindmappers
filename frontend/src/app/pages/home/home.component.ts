import { Component, Input } from '@angular/core';
import { User } from '../../classes/user';
import { RoomApiService } from '../../services/room-api.service';
import { Room } from '../../classes/room';
import { SocketService } from '../../services/socket.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  @Input() user: User = {
    id: -1,
    email: '',
    avatar: '',
    name: '',
  };

  showRooms: boolean = true;
  room: Room = {
    id: -1,
    name: '',
    description: '',
    owner: -1,
    ownerName: '',
    ownerAvatar: '',
  };

  public socketService: SocketService = new SocketService();

  constructor(
    private roomApiService: RoomApiService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.socketService.connect();
    const currentRoom = this.roomApiService.getCurrentRoom();
    // Note: This will use the room stored in the session storage to join the room
    if (currentRoom) {
      this.handleJoinedRoom(currentRoom);
      return;
    }
  }

  handleJoinedRoom(room: Room) {
    this.room = room;
    this.showRooms = false;
    this.roomApiService.enterRoom(room);
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 0);
  }

  handleCreateRoom(createdRoom: Room) {
    this.room = createdRoom;
    this.showRooms = false; // is this showRooms to show the room list?
    this.roomApiService.enterRoom(createdRoom);
  }

  exitRoom() {
    this.showRooms = true;
    this.roomApiService.exitRoom();
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }
}
