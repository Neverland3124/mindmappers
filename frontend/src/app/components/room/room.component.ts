import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  Input,
  ViewChild,
} from '@angular/core';
import { Room } from '../../classes/room';
import { NgForm } from '@angular/forms';
import { RoomApiService } from '../../services/room-api.service';
import { SocketService } from '../../services/socket.service';
import { ChangeDetectorRef } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { User } from '../../classes/user';

@Component({
  selector: 'app-room',
  standalone: false,
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  @Input() user: User = {
    email: '',
    picture: '',
  };
  @Output() joinedRoom = new EventEmitter<Room>();
  @Output() createdRoom = new EventEmitter<Room>();
  @Input() socketService!: SocketService;
  @ViewChild('roomForm') roomForm!: NgForm;

  rooms: Room[] = [];
  contentTpl = 'No rooms so far';

  constructor(
    private roomApiService: RoomApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private messageService: NzMessageService,
    private notificationService: NzNotificationService,
  ) {}

  showPublicRooms: boolean = true;

  ngOnInit() {
    setTimeout(() => {
      console.log('room ngOnInit', this.socketService);
      this.roomApiService.getRooms().subscribe((response) => {
        this.rooms = response.rooms;
      });

      this.socketService.removeAllListeners();

      this.socketService.listen('webhook-delivered', (webhook: any) => {
        // validate the userId
        const { roomName, userEmail, friendName, friendEmail } =
          webhook.webhook;
        if (userEmail !== this.user.email) {
          return;
        }
        console.log('webhook-delivered', webhook);
        this.notificationService.success(
          'Webhook delivered',
          `User: ${userEmail}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been sent.`,
          {
            nzDuration: 30000,
          },
        );
      });
      this.socketService.listen('webhook-opened', (webhook: any) => {
        const { roomName, userEmail, friendName, friendEmail } =
          webhook.webhook;
        if (userEmail !== this.user.email) {
          return;
        }
        console.log('webhook-opened', webhook);
        this.notificationService.info(
          'Webhook opened',
          `User: ${userEmail}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been opened.`,
          {
            nzDuration: 30000,
          },
        );
      });

      this.socketService.listen('room-created', (room: Room) => {
        this.rooms.unshift(room); // TODO: pagination
        console.log(room);
        this.changeDetectorRef.detectChanges();
      });

      this.socketService.listen('room-deleted', (emitObject: any) => {
        console.log('room-deleted', emitObject);
        console.log(
          'find',
          this.rooms.find((o) => o.id === emitObject.id),
        );
        this.rooms = this.rooms.filter((o) => o.id !== emitObject.id);
        this.changeDetectorRef.detectChanges();
      });
    }, 0);
  }

  joinRoom(room: Room) {
    this.joinedRoom.emit(room);
    this.roomApiService.enterRoom(room);
  }

  createRoom() {
    this.showPublicRooms = false;
  }

  deleteRoom(room: Room) {
    console.log('delete room', room);
    this.roomApiService.deleteRoom(room.id).subscribe({
      next: (_) => {
        // this.rooms = this.rooms.filter((r) => r.id !== room.id);
      },
      error: (_) => {
        this.messageService.error('Error deleting room, please retry');
      },
    });
  }

  onSubmit(roomForm: NgForm) {
    if (!roomForm.valid) {
      this.messageService.error('Please fill in all fields');
      return;
    }

    //
    this.roomApiService
      .createRoom(roomForm.value.roomName, roomForm.value.roomDescription)
      .subscribe({
        next: (response) => {
          // successfully created room
          this.createdRoom.emit(response);
          this.showPublicRooms = true;
        },
        error: (_) => {
          this.messageService.error('Error creating room, please retry');
        },
      });

    roomForm.reset();
  }

  back() {
    this.showPublicRooms = true;
  }

  clear() {
    // Assuming roomForm is the template variable for your form
    this.roomForm.resetForm({
      roomName: '',
      roomDescription: '',
    });
  }
}
