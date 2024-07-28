import { Component, Input } from '@angular/core';
import { ImageApiService } from '../../services/image-api.service';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SocketService } from '../../services/socket.service';

enum ImageState {
  Loading = 0,
  NoImageYet = 1,
  Generating = 2,
  Ready = 3,
}

@Component({
  selector: 'app-image-modal',
  standalone: false,
  templateUrl: './image-modal.component.html',
  styleUrl: './image-modal.component.scss',
})
export class ImageModalComponent {
  @Input() socketService!: SocketService;
  @Input() roomId: number = 0;
  imageUrl: string = '';
  imageText: string = 'Loading...';
  isVisible = false;
  imageState: ImageState = ImageState.Loading;

  constructor(private imageApiService: ImageApiService) {}

  ngOnInit(): void {
    this.socketService.listen(`image-${this.roomId}`, (data) => {
      if (data && data.imageUrl) {
        this.imageUrl = data.imageUrl;
        this.imageState = ImageState.Ready; // Image is ready
      }
      return;
    });
  }

  showModal(): void {
    this.isVisible = true;
    this.imageText = 'Loading...';
    this.imageState = ImageState.Loading; // Use enum here

    this.fetchImage();
  }

  fetchImage(): void {
    forkJoin({
      apiResponse: this.imageApiService.getImage(this.roomId).pipe(
        catchError((error) => of({ error })), // Catch the error and pass it along
      ),
      time: timer(1500), // Ensures a minimum delay of 1.5 seconds
    })
      .pipe(
        tap(({ apiResponse }) => {
          if ((apiResponse as { error: any }).error) {
            throw (apiResponse as { error: any }).error;
          }
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.imageUrl = response.apiResponse.imageUrl;
          this.imageState = ImageState.Ready; // Image is ready
        },
        error: (error: any) => {
          const errorMessage = error.message;
          if (errorMessage === 'No Image Yet') {
            this.imageText = 'No Image Yet';
            this.imageState = ImageState.NoImageYet; // No image yet
          } else if (errorMessage === 'Image is generating') {
            this.imageText = 'Image is generating';
            this.imageState = ImageState.Generating; // Image is generating
            setTimeout(() => {
              this.fetchImage();
            }, 8000);
          }
        },
      });
  }

  handleCancel(): void {
    this.isVisible = false;
  }
}
