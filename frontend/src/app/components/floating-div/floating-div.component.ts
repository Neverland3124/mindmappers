import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-floating-div',
  standalone: false,
  templateUrl: './floating-div.component.html',
  styleUrl: './floating-div.component.scss',
})
export class FloatingDivComponent {
  @ViewChild('floatingDiv', { static: true }) floatingDiv!: ElementRef;
  speedX = 1; // Speed of the div on X-axis
  speedY = 1; // Speed of the div on Y-axis
  x = 0;
  y = 0;
  isAnimating = false; // Flag to control animation
  speedLevels = [-1.5, -1.2, -1, -0.8, 0.8, 1, 1.2, 1.5]; // Different speed levels

  currentSpeedIndex = 0; // Index to track current speed

  ngOnInit() {
    setTimeout(() => {
      if (!this.isAnimating) {
        this.isAnimating = true;
        this.animateDiv();
      }
      this.changeSpeed();
    }, 4000);

    this.floatingDiv.nativeElement.addEventListener(
      'contextmenu',
      (event: any) => {
        event.preventDefault();
        // right click to stop animation
        this.isAnimating = false;
      },
    );

    this.floatingDiv.nativeElement.addEventListener('click', (event: any) => {
      event.preventDefault();
      // left click to start animation
      if (!this.isAnimating) {
        this.isAnimating = true;
        this.animateDiv();
      }
      this.changeSpeed();
    });
  }

  getRandomSpeed() {
    const randomIndex = Math.floor(Math.random() * this.speedLevels.length);
    return this.speedLevels[randomIndex];
  }

  changeSpeed() {
    this.speedX = this.getRandomSpeed();
    this.speedY = this.getRandomSpeed();
  }

  animateDiv() {
    const div = this.floatingDiv.nativeElement;
    const updatePosition = () => {
      if (!this.isAnimating) return; // Stop animation if flag is false

      const rect = div.getBoundingClientRect();

      // Check for collision with the right and left edges
      if (rect.right >= window.innerWidth || rect.left <= 0) {
        this.speedX = -this.speedX;
      }

      // Check for collision with the bottom and top edges
      if (rect.bottom >= window.innerHeight || rect.top <= 0) {
        this.speedY = -this.speedY;
      }

      this.x += this.speedX;
      this.y += this.speedY;
      div.style.transform = `translate(${this.x}px, ${this.y}px)`;

      requestAnimationFrame(updatePosition);
    };
    requestAnimationFrame(updatePosition);
  }
}
