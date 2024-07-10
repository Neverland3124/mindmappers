import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../classes/user';
import { GetMeResponse } from '../../classes/response';

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

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
  ) {
    this.title = environment.productName;
  }

  images = [
    { url: 'https://picsum.photos/1920/1080?random=1', alt: 'Image 1 Description' },
    { url: 'https://picsum.photos/1920/1080?random=2', alt: 'Image 2 Description' },
    // Add more images as needed
  ];

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.access_token = this.apiService.getAccessToken();
      // User is redirected back from OAuth2 server
      if (params['access_token']) {
        this.apiService.setAccessToken(params['access_token']);
        this.access_token = this.apiService.getAccessToken();
        window.location.href = '/';
      } else {
        this.apiService.me().subscribe({
          next: (response) => {
            // Move to home page
            this.sentUser(this.maskUser(response));
            this.showHomePage();
            // update access token
            this.apiService.setAccessToken(response.access_token);
          },
          error: (error) => {
            console.error('An error occurred', error);
            this.apiService.setAccessToken('');
            this.access_token = '';
          },
        });
      }
      // Check if user is already signed in
      if (!this.access_token) {
        return;
      }
      // Get user info
    });
  }

  maskUser(response: GetMeResponse) {
    return {
      email: response.email,
      picture: response.picture,
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
}
