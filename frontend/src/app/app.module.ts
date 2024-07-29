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
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzUploadModule } from 'ng-zorro-antd/upload';

import { HomeComponent } from './pages/home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { TopNavBarComponent } from './components/top-nav-bar/top-nav-bar.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ApiInterceptor } from './api.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoomComponent } from './components/room/room.component';
import { InviteModalComponent } from './components/invite-modal/invite-modal.component';
import { GoCanvasComponent } from './components/gocanvas/gocanvas.component';
import { GojsAngularModule } from 'gojs-angular';
import { ImageModalComponent } from './components/image-modal/image-modal.component';
import { CreateRoomModalComponent } from './components/create-room-modal/create-room-modal.component';
import { EditRoomModalComponent } from './components/edit-room-modal/edit-room-modal.component';
import { AboutModalComponent } from './components/about-modal/about-modal.component';
import { InstructionModalComponent } from './components/instruction-modal/instruction-modal.component';
import { FloatingDivComponent } from './components/floating-div/floating-div.component';
import { CreditsModalComponent } from './components/credits-modal/credits-modal.component';

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
    RoomComponent,
    InviteModalComponent,
    GoCanvasComponent,
    ImageModalComponent,
    CreateRoomModalComponent,
    EditRoomModalComponent,
    AboutModalComponent,
    InstructionModalComponent,
    FloatingDivComponent,
    CreditsModalComponent,
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
    NzFormModule,
    NzInputModule,
    NzRadioModule,
    NzEmptyModule,
    NzModalModule,
    NzCardModule,
    NzCarouselModule,
    BrowserAnimationsModule,
    GojsAngularModule,
    NzPopconfirmModule,
    NzToolTipModule,
    NzSpinModule,
    NzSkeletonModule,
    NzAvatarModule,
    NzDividerModule,
    NzUploadModule,
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
