import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Mind Mappers';
  signInPage: boolean = true;
  homePage: boolean = false;
  topNavBar: boolean = false;
  user = {
    id: -1,
    email: '',
    avatar: '',
    name: '',
  };

  constructor() {}

  displaySignInPage(show: boolean) {
    this.signInPage = show;
    this.homePage = !show;
    this.topNavBar = !show;
  }

  displayHomePage(show: boolean) {
    this.topNavBar = show;
    this.homePage = show;
    this.signInPage = !show;
  }

  setUser(obj: { email: string; avatar: string; id: number; name: string }) {
    this.user = obj;
  }
}
