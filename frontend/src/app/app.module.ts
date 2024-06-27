import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { HomeComponent } from './pages/home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { TopNavBarComponent } from './components/top-nav-bar/top-nav-bar.component';
import { SignInBtnComponent } from './components/sign-in-btn/sign-in-btn.component';
import { SquareComponent } from './object/square/square.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ApiInterceptor } from './api.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CanvasComponent } from './components/canvas/canvas.component';
import { AngularDraggableModule } from 'angular2-draggable';
import { ResizableModule } from 'angular-resizable-element';
import { ResizeComponent } from './object/resize/resize.component';
import { LineComponent } from './object/line/line.component';

const appRoutes: Routes = [{ path: '', component: SignInComponent }];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SignInComponent,
    TopNavBarComponent,
    SignInBtnComponent,
    SquareComponent,
    CanvasComponent,
    ResizeComponent,
    LineComponent,
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
    RouterModule.forRoot(appRoutes),
    AngularDraggableModule,
    ResizableModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
