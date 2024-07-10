import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../classes/user';
import { ApiService } from '../../services/api.service';
import { RoomApiService } from '../../services/room-api.service';

@Component({
  selector: 'app-top-nav-bar',
  standalone: false,
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.scss',
})
export class TopNavBarComponent {
  @Input() title: string = '';
  @Input() user: User = {
    email: '',
    picture: '',
  };
  @Output() signInPage = new EventEmitter<boolean>();

  constructor(private apiService: ApiService, private roomApiService: RoomApiService) {}

  logout() {
    this.apiService.signOut().subscribe({
      next: (_) => {
        document.querySelectorAll('.leader-line').forEach((e) => e.remove());
        this.roomApiService.exitRoom();
        this.signInPage.emit(true);
        return;
      },
      error: (_) => {
        alert('Sign out failed');
        document.querySelectorAll('.leader-line').forEach((e) => e.remove());
        this.roomApiService.exitRoom();
        this.signInPage.emit(true);
      },
    });
  }
}
