import { Component, Input, AfterViewInit, ElementRef } from '@angular/core';
import { LeaderLineService } from '../../services/leader-line.service';
import { ResizeComponent } from '../resize/resize.component';

@Component({
  selector: 'app-leader-line-example',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'], // Corrected property name
  standalone: false,
})
export class LineComponent implements AfterViewInit {
  @Input() startElement!: ResizeComponent;
  @Input() endElement!: ResizeComponent;

  constructor(private leaderLineService: LeaderLineService) {}

  ngAfterViewInit() {
    this.drawLine();
  }

  drawLine() {
    // this.leaderLineService.createLine(
    //   this.startElement.
    //   this.endElement.element.nativeElement
    // );
  }
}

// import { NgModule, Injector } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { createCustomElement } from '@angular/elements';

// @NgModule({
//   declarations: [MyComponent],
//   imports: [BrowserModule],
//   entryComponents: [MyComponent]
// })
// export class AppModule {
//   constructor(private injector: Injector) {}

//   ngDoBootstrap() {
//     const myElement = createCustomElement(MyComponent, { injector: this.injector });
//     customElements.define('my-element', myElement);
//   }
// }
