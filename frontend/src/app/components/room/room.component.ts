import {
  Component,
  Output,
  EventEmitter,
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
import { NzModalService } from 'ng-zorro-antd/modal';
import { EditRoomModalComponent } from '../edit-room-modal/edit-room-modal.component';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-room',
  standalone: false,
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  @Input() user: User = {
    id: -1,
    email: '',
    avatar: '',
    name: '',
  };
  @Output() joinedRoom = new EventEmitter<Room>();
  @Output() createdRoom = new EventEmitter<Room>();
  @Input() socketService!: SocketService;
  @ViewChild('roomForm') roomForm!: NgForm;

  dataReady: boolean = false;
  contentTpl = 'No rooms so far';
  rooms: Room[] = [];

  constructor(
    private roomApiService: RoomApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private messageService: NzMessageService,
    private notificationService: NzNotificationService,
    private modalService: NzModalService,
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.ensureMinimumLoadingTime();
      this.setupSocketListeners();
    }, 0);
  }

  ensureMinimumLoadingTime() {
    const dataFetchPromise = new Promise<void>((resolve) => {
      this.roomApiService.getRooms().subscribe((response) => {
        this.rooms = response.rooms;
        resolve();
      });
    });

    // A dummy promise to resolve after 1 second
    const minimumLoadingTimePromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500); // Ensure at least 1 second of loading
    });

    Promise.all([dataFetchPromise, minimumLoadingTimePromise]).then(() => {
      this.dataReady = true;
      const sessionStorageRoomId = sessionStorage.getItem('roomId');
      sessionStorage.removeItem('roomId');
      if (sessionStorageRoomId) {
        const room = this.rooms.find(
          (r) => r.id === parseInt(sessionStorageRoomId),
        );
        if (room) {
          this.joinRoom(room);
        } else {
          this.messageService.error('Room not found, maybe it was deleted.');
        }
      }
    });
  }

  setupSocketListeners() {
    this.socketService.removeAllListeners();

    this.socketService.listen('webhook-delivered', (webhook: any) => {
      // validate the userId
      const { roomName, userEmail, friendName, friendEmail } = webhook.webhook;
      if (userEmail !== this.user.email) {
        return;
      }
      this.notificationService.success(
        'Webhook delivered',
        `User: ${this.user.name}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been sent.`,
        {
          nzDuration: 30000,
        },
      );
    });
    this.socketService.listen('webhook-clicked', (webhook: any) => {
      const { roomName, userEmail, friendName, friendEmail } = webhook.webhook;
      if (userEmail !== this.user.email) {
        return;
      }
      this.notificationService.info(
        'Webhook clicked',
        `User: ${this.user.name}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been clicked.`,
        {
          nzDuration: 30000,
        },
      );
    });

    this.socketService.listen('room-created', (room: Room) => {
      this.rooms.unshift(room);
      this.changeDetectorRef.detectChanges();
    });

    this.socketService.listen('room-updated', (updatedRoom: any) => {
      // find the room and update it
      this.rooms = this.rooms.map((room) => {
        if (room.id === updatedRoom.id) {
          return {
            ...room,
            name: updatedRoom.name,
            description: updatedRoom.description,
          };
        }
        return room;
      });
      this.changeDetectorRef.detectChanges();
    });

    this.socketService.listen('room-deleted', (emitObject: any) => {
      this.rooms = this.rooms.filter((o) => o.id !== emitObject.id);
      this.changeDetectorRef.detectChanges();
    });
  }

  joinRoom(room: Room) {
    this.joinedRoom.emit(room);
    this.roomApiService.enterRoom(room);
  }

  editRoom(room: Room) {
    if (this.user.id !== room.owner) {
      // Not the owner, do nothing
      return;
    }

    this.modalService.create({
      nzTitle: 'Edit Room Info',
      nzContent: EditRoomModalComponent,
      nzData: {
        roomName: room.name,
        roomDescription: room.description,
      },
      nzFooter: [
        {
          label: 'Cancel',
          onClick: () => this.modalService.closeAll(),
        },
        {
          label: 'Save',
          type: 'primary',
          autoLoading: true, // Automatically handle loading state
          onClick: async (componentInstance: EditRoomModalComponent) => {
            const name = componentInstance.roomName;
            const description = componentInstance.roomDescription;

            if (!name || !description) {
              componentInstance.errorMessage =
                'Error: Name or description missing';
              return;
            }
            componentInstance.errorMessage = '';

            // both name and description are present, proceed with creating the room
            return firstValueFrom(
              forkJoin({
                apiResponse: this.roomApiService
                  .editRoom(room.id, name, description)
                  .pipe(
                    catchError((error) => of({ error })), // Catch the error and pass it along
                  ),
                time: timer(1000), // Ensures a minimum delay of 1 second
              }).pipe(
                tap(({ apiResponse }) => {
                  if ((apiResponse as { error: any }).error) {
                    throw (apiResponse as { error: any }).error;
                  }
                }),
              ),
            )
              .then(() => {
                this.messageService.success('Room info edited successfully');
                this.modalService.closeAll();
              })
              .catch((error) => {
                componentInstance.roomName = '';
                const errorMessage = error.error.error;
                if (errorMessage === 'Room name already exists') {
                  this.messageService.error('Error: Room name already exists');
                } else {
                  this.messageService.error(
                    'Error editing room info, please retry.',
                  );
                  componentInstance.roomDescription = '';
                }
              });
          },
        },
      ],
    });
  }

  deleteRoom(room: Room) {
    if (this.user.id !== room.owner) {
      // Not the owner do nothing;
      return;
    }

    this.modalService.confirm({
      nzTitle: 'Are you sure you want to delete this room?',
      nzContent: 'This action cannot be undone!',
      nzOnOk: () => {
        this.roomApiService.deleteRoom(room.id).subscribe({
          next: (_) => {
            // this.rooms = this.rooms.filter((r) => r.id !== room.id);
          },
          error: (_) => {
            this.messageService.error('Error deleting room, please retry.');
          },
        });
      },
    });
  }
}
