import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { HomeComponent } from './pages/home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SocketService } from './services/socket.service';

import { AppComponent } from './app.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { TopNavBarComponent } from './components/top-nav-bar/top-nav-bar.component';
import { SignInBtnComponent } from './components/sign-in-btn/sign-in-btn.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ApiInterceptor } from './api.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CanvasComponent } from './components/canvas/canvas.component';
import { AngularDraggableModule } from 'angular2-draggable';
import { ResizableModule } from 'angular-resizable-element';
import { ResizeComponent } from './object/resize/resize.component';
import { LineComponent } from './object/line/line.component';
import { RoomComponent } from './components/room/room.component';
import { InviteModalComponent } from './components/modal/modal.component';

/** config angular i18n **/
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
registerLocaleData(en);

const appRoutes: Routes = [{ path: '', component: SignInComponent }];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SignInComponent,
    TopNavBarComponent,
    SignInBtnComponent,
    CanvasComponent,
    ResizeComponent,
    LineComponent,
    RoomComponent,
    InviteModalComponent,
  ],
  imports: [
    DragDropModule,
    CommonModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NzLayoutModule,
    NzIconModule,
    NzMenuModule,
    NzButtonModule,
    NzListModule,
    RouterModule.forRoot(appRoutes),
    AngularDraggableModule,
    ResizableModule,
    NzFormModule,
    NzInputModule,
    NzRadioModule,
    NzEmptyModule,
    NzModalModule,
    NzCardModule,
    NzCarouselModule,
    BrowserAnimationsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true,
    },
    provideNzI18n(en_US), // Add the ng-zorro-antd i18n provider here
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
