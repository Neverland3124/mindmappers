import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { HomeComponent } from '../../pages/home/home.component';

const MAX_TEXTAREA_FONT_SIZE = 32;
const MIN_TEXTAREA_FONT_SIZE = 18;
export interface NodeResizeEvent {
  htmlElement: HTMLElement;
  resizeComponent: ResizeComponent; // Or any other type you need to emit alongside HTMLElement
}

@Component({
  selector: 'app-resize',
  standalone: false,
  templateUrl: './resize.component.html',
  styleUrl: './resize.component.scss',
})
export class ResizeComponent {
  @Input() canvas!: HTMLElement;
  @Output() requestAddNode = new EventEmitter<NodeResizeEvent>();

  @Output() requestOnMoving = new EventEmitter<ResizeComponent>();
  //  use the ! postfix operator to tell TypeScript that you will ensure the property is assigned before it's used.
  fontSize = 18; // default font size
  numberOfLines = 1; // default textarea to be 1 line
  private resizeEvents = new Subject<Event>();

  // name = 'Angular';
  position: string = '';

  constructor() {
    this.resizeEvents
      .pipe(
        debounceTime(50), // 0.05s
      )
      .subscribe((event) => {
        this.adjustTextAreaFontSize(event);
      });
  }

  emitResizeEvent(event: any) {
    this.resizeEvents.next(event);

    this.requestOnMoving.emit(event);
  }

  newPosition(event: any) {
    const boundingRect = event.currentTarget.getBoundingClientRect();
    const element = event.currentTarget;

    // const x = event.pageX - boundingRect.left;
    const x = element.offsetLeft;
    const y = element.offsetTop;

    this.position = '(' + x + ', ' + y + ')';
    console.log('yeah');
  }

  adjustTextAreaFontSize(event: any) {
    // based on the width of the container, we want to adjust the font size
    // todo: need a better function to calculate the font size
    let newFontSize = event.size.width / 10;
    console.log('adjustFontSize newFontSize', newFontSize);

    newFontSize = Math.max(
      MIN_TEXTAREA_FONT_SIZE,
      Math.min(newFontSize, MAX_TEXTAREA_FONT_SIZE),
    );

    console.log('adjustFontSize newFontSize', newFontSize);
    this.fontSize = newFontSize;
  }

  addNode(element: ResizeComponent, event: HTMLElement) {
    console.log('add node');
    this.triggerAddNodeRequest(element, event);
  }

  triggerAddNodeRequest(element: ResizeComponent, event: HTMLElement) {
    console.log('trigger add node request 1');
    console.log('trigger add node request element', element);
    console.log('trigger add node request event', event);
    this.requestAddNode.emit({
      htmlElement: event, // yourHtmlElement should be of type HTMLElement
      resizeComponent: element, // yourResizeComponentInstance should be an instance of ResizeComponent or the relevant type
    });
    console.log('trigger add node request 2');
  }

  preventFocus(event: any): void {
    console.log('click');
    event.preventDefault();
  }

  doubleClick(event: any) {
    console.log('double click');
    // event.target.isEditing = true;
    // event.target.disabled = false;
  }

  rightClick(event: any) {
    event.preventDefault();
    console.log('right click');
    console.log('this grandparent', event.target.parentElement);
    if (event.target.tagName.toLowerCase() === 'textarea') {
      this.addNode(
        this,
        event.target.parentElement.parentElement.querySelector('div'),
      );
    } else if (event.target.classList.contains('ng-resizable-handle')) {
      this.addNode(
        this,
        event.target.parentElement.parentElement.querySelector('div'),
      );
    } else {
      this.addNode(this, event.target.parentElement.querySelector('div'));
    }
  }

  // rightClickTextArea(event: any) {
  //   event.preventDefault();
  //   console.log('right click');
  //   console.log("this grandparent", event.target.parentElement);
  //   this.addNode(this, event.target.parentElement.parentElement.querySelector('div'));
  // }

  rightClickDoNothing(event: any) {
    event.preventDefault();
  }

  addNodeButtonClick(event: any) {
    console.log('add node button click');
  }

  deleteButtonClick(event: any) {
    console.log('delete button click');
  }

  emitMovingOffset(event: any) {
    // console.log('emit moving offset', event);
    // here waht we have is event.x and event.y
    // we would like to move the line that have the object as it's start or end
    this.requestOnMoving.emit(event);
  }
}
