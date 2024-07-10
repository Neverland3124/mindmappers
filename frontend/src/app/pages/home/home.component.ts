import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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
    email: '',
    picture: '',
  };

  showRooms: boolean = true;
  room: Room = {
    id: -1,
    name: '',
    description: '',
    owner: -1,
  };

  public socketService: SocketService = new SocketService();

  constructor(
    private roomApiService: RoomApiService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.socketService.connect();
    const currentRoom = this.roomApiService.getCurrentRoom();
    if (currentRoom) {
      this.handleJoinedRoom(currentRoom);
      return;
    }
    console.log('home component init', this.socketService);
  }

  ngAfterViewInit() {}

  handleJoinedRoom(room: Room) {
    console.log('joined room', room);
    this.room = room;
    this.showRooms = false;
    this.roomApiService.enterRoom(room);
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 0);
  }

  handleCreateRoom(createdRoom: Room) {
    console.log('create room', createdRoom);
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
