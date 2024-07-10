import { Component, Input } from '@angular/core';
import { RoomApiService } from '../../services/room-api.service';
import { forkJoin, of, timer } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-invite-modal',
  standalone: false,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class InviteModalComponent {
  @Input() roomName!: string;
  isVisible = false;
  isConfirmLoading = false;
  emailAddress = '';
  friendName = '';
  errorMessage = '';

  constructor(
    private roomApiService: RoomApiService,
    private messageService: NzMessageService,
  ) {}

  showModal(): void {
    this.emailAddress = '';
    this.friendName = '';
    this.errorMessage = '';
    this.isVisible = true;
  }

  handleOk(): void {
    this.isConfirmLoading = true;
    const email = this.emailAddress;
    const name = this.friendName;

    if (!name || !email) {
      // Handle missing name or email (e.g., show an error message to the user)
      this.errorMessage = 'Error: Name or email missing';
      this.isConfirmLoading = false;
      return;
    }

    // Simple email validation regex
    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailPattern.test(email)) {
      // Handle invalid email (e.g., show an error message to the user)
      console.error('Invalid email address');
      this.errorMessage = 'Error: Email form incorrect';
      this.isConfirmLoading = false;
      return;
    }
    this.errorMessage = '';

    // If email is valid, proceed with sending the invite
    forkJoin({
      apiResponse: this.roomApiService
        .sendInvite(name, email, this.roomName)
        .pipe(
          catchError((error) => of({ error })), // Catch the error and pass it along
        ),
      time: timer(1000), // Ensures a minimum delay of 1 second
    })
      // below just to ensure loading of 1s
      .pipe(
        tap(({ apiResponse }) => {
          if ((apiResponse as { error: any }).error) {
            throw (apiResponse as { error: any }).error;
          }
        }),
        finalize(() => {
          // Reset the loading state after all actions are complete
          this.isConfirmLoading = false;
        }),
      )
      .subscribe({
        next: (_) => {
          this.emailAddress = '';
          this.friendName = '';
          this.messageService.success('Invite sent successfully!');
        },
        error: (_) => {
          this.emailAddress = '';
          this.friendName = '';
          this.messageService.error(
            'Error sending invite. Please recheck and try again.',
          );
        },
      });
  }

  handleCancel(): void {
    this.isVisible = false;
  }
}
