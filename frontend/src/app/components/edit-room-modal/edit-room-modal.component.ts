import { Component, Inject } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-edit-room-modal',
  standalone: false,
  templateUrl: './edit-room-modal.component.html',
  styleUrl: './edit-room-modal.component.scss',
})
export class EditRoomModalComponent {
  roomName: string;
  roomDescription: string;
  errorMessage = '';

  constructor(
    @Inject(NZ_MODAL_DATA)
    public data: { roomName: string; roomDescription: string },
  ) {
    this.roomName = data.roomName;
    this.roomDescription = data.roomDescription;
  }
}
