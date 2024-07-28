import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { User } from '../../classes/user';
import { GetMeResponse } from '../../classes/response';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AboutModalComponent } from '../../components/about-modal/about-modal.component';

@Component({
  selector: 'app-sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit {
  @Input() title: string;
  @Output() user = new EventEmitter<User>();
  @Output() signInPage = new EventEmitter<boolean>();
  @Output() homePage = new EventEmitter<boolean>();

  access_token: string = this.apiService.getAccessToken() || '';
  isLoading: boolean = true;
  constructor(
    private apiService: ApiService,
    private router: Router,
    private modalService: NzModalService,
  ) {
    this.title = environment.productName;
    this.handleAuthCallback();
  }

  handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    const roomId = urlParams.get('roomId');
    if (token) {
      this.apiService.setAccessToken(token);
    }
    if (roomId) {
      sessionStorage.setItem('roomId', roomId);
    }
    if (token || roomId) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.apiService.me().subscribe({
      next: (response) => {
        this.sentUser(this.maskUser(response));
        this.showHomePage();
        this.apiService.setAccessToken(response.access_token);
      },
      error: (error) => {
        this.isLoading = false;
      },
    });
  }

  maskUser(response: GetMeResponse) {
    return {
      id: response.id,
      email: response.email,
      avatar: response.avatar,
      name: response.name,
    };
  }

  // Send user info
  sentUser(obj: User) {
    this.user.emit(obj);
  }

  // Hide sign in page
  hideSignInPage() {
    this.signInPage.emit(false);
  }

  // Show home page
  showHomePage() {
    this.homePage.emit(true);
  }

  signIn() {
    this.apiService.signIn().subscribe((obj) => {
      window.location.href = obj.url;
    });
  }

  showAbout() {
    this.modalService.create({
      nzTitle: 'About MindMappers',
      nzContent: AboutModalComponent,
      nzFooter: null,
    });
  }

  freeTrial() {
    this.apiService.freeTrial().subscribe((obj) => {
      this.apiService.setAccessToken(obj.access_token);
      window.location.href = '/';
    });
  }

  reloadPage() {
    window.location.reload();
  }
}
