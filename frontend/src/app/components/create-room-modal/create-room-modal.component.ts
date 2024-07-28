import { Component } from '@angular/core';
import { RoomApiService } from '../../services/room-api.service';
import { forkJoin, of, timer } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-create-room-modal',
  standalone: false,
  templateUrl: './create-room-modal.component.html',
  styleUrl: './create-room-modal.component.scss',
})
export class CreateRoomModalComponent {
  isVisible = false;
  isConfirmLoading = false;
  roomName = '';
  roomDescription = '';
  errorMessage = '';

  constructor(
    private roomApiService: RoomApiService,
    private messageService: NzMessageService,
  ) {}

  showModal(): void {
    this.roomName = '';
    this.roomDescription = '';
    this.errorMessage = '';
    this.isVisible = true;
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  handleCreate(): void {
    this.isConfirmLoading = true;
    const name = this.roomName;
    const description = this.roomDescription;

    if (!name || !description) {
      // Handle missing name or description (e.g., show an error message to the user)
      this.errorMessage = 'Error: Name or description missing';
      this.isConfirmLoading = false;
      return;
    }

    this.errorMessage = '';

    // both name and description are present, proceed with creating the room
    forkJoin({
      apiResponse: this.roomApiService.createRoom(name, description).pipe(
        catchError((error) => of({ error })), // Catch the error and pass it along
      ),
      time: timer(500), // Ensures a minimum delay of 1 second
    })
      .pipe(
        tap(({ apiResponse }) => {
          if ((apiResponse as { error: any }).error) {
            throw (apiResponse as { error: any }).error;
          }
        }),
        finalize(() => {
          this.isConfirmLoading = false;
        }),
      )
      .subscribe({
        next: (_) => {
          this.roomName = '';
          this.roomDescription = '';
          this.messageService.success('Room created successfully');
          this.isVisible = false;
        },
        error: (error) => {
          this.roomName = '';
          const errorMessage = error.error;
          if (errorMessage === 'Room name already exists') {
            this.messageService.error('Error: Room name already exists');
          } else {
            this.roomDescription = '';
            this.messageService.error(
              'Error creating room. Please recheck and try again.',
            );
          }
        },
      });
  }
}
