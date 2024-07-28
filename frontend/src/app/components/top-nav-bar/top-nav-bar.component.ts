import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../classes/user';
import { ApiService } from '../../services/api.service';
import { RoomApiService } from '../../services/room-api.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-top-nav-bar',
  standalone: false,
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.scss',
})
export class TopNavBarComponent {
  @Input() title: string = '';
  @Input() user: User = {
    id: -1,
    email: '',
    avatar: '',
    name: '',
  };
  @Output() signInPage = new EventEmitter<boolean>();

  constructor(
    private apiService: ApiService,
    private roomApiService: RoomApiService,
    private modalService: NzModalService,
    private messageService: NzMessageService,
  ) {}

  logout() {
    this.modalService.confirm({
      nzTitle: 'Are you sure you want to sign out?',
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => {
        this.apiService.signOut().subscribe({
          next: (_) => {
            this.apiService.setAccessToken('');
            this.roomApiService.exitRoom();
            sessionStorage.removeItem('roomId');
            this.signInPage.emit(true);
            return;
          },
          error: () => {
            this.messageService.error(
              'Seems some error happens during signing out.',
            );
            this.roomApiService.exitRoom();
            sessionStorage.removeItem('roomId');
            this.signInPage.emit(true);
          },
        });
      },
    });
  }

  refreshPage() {
    window.location.reload();
  }
}
