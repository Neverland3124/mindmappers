import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../classes/user';
import { ApiService } from '../../services/api.service';

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

  constructor(private apiService: ApiService) {}

  logout() {
    this.apiService.signOut().subscribe((message) => {
      if (!message) {
        alert('Sign out failed');
        return;
      }

      this.signInPage.emit(true);
    });
  }
}
