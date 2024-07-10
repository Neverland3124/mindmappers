import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { Object } from '../../classes/object';
import { ObjectApiService } from '../../services/object-api.service';

const MAX_TEXTAREA_FONT_SIZE = 32;
const MIN_TEXTAREA_FONT_SIZE = 18;
export interface NodeResizeEvent {
  htmlElement: HTMLElement;
  resizeComponent: ResizeComponent;
}

@Component({
  selector: 'app-resize',
  standalone: false,
  templateUrl: './resize.component.html',
  styleUrl: './resize.component.scss',
})
export class ResizeComponent implements OnInit {
  // todo: store one
  // @Input() object!: Object;
  // @Input() id!: number;

  @Input() object: Object = {
    id: -1,
    text: '',
    x: 50,
    y: -500,
    size: 180,
    parent: 0,
  };
  @Input() id: number = -1;
  @Input() canvas!: HTMLElement;

  @Output() requestAddNode = new EventEmitter<NodeResizeEvent>();
  @Output() requestOnMoving = new EventEmitter<ResizeComponent>();
  @Output() requestDeleteNode = new EventEmitter<ResizeComponent>();
  @Output() requestDeleteNodeRemoveLine = new EventEmitter<ResizeComponent>();

  @ViewChild('myTextArea') myTextArea!: ElementRef;

  fontSize = 18; // default font size
  numberOfLines = 1; // default textarea to be 1 line
  private resizeEvents = new Subject<Event>();
  private movingEvents = new Subject<Event>();
  typingEvents = new Subject<string>();
  subscription: any;
  position = { x: 0, y: 0 };

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private objectApiService: ObjectApiService,
    private cdr: ChangeDetectorRef,
  ) {
    // TODO: debounce for realtime websocket
    this.resizeEvents
      .pipe(
        debounceTime(50), // 0.05s
      )
      .subscribe((event) => {
        this.updateObjectSize(event);
      });
    this.movingEvents
      .pipe(
        debounceTime(50), // Adjust debounce time as needed
      )
      .subscribe(() => {
        this.requestOnMoving.emit(this);
      });
  }

  emitResizeEvent(event: any) {
    this.resizeEvents.next(event);
    this.requestOnMoving.emit(this);
  }

  updateLocation(object: Object) {
    console.log(
      'updateLocation',
      object.x,
      object.y,
      object.size,
      this.object.x,
      this.object.y,
      this.object.size,
    );
    let currentObject = object;
    if (!currentObject.x) {
      currentObject.x = this.object.x;
    }
    if (!currentObject.y) {
      currentObject.y = this.object.y;
    }
    if (!currentObject.size) {
      currentObject.size = this.object.size;
    }
    this.setPosition(object.x, object.y, object.size);

    console.log('updateLocation', object.x, object.y, object.size);
    this.emitMovingOffset();
  }

  updateObjectSize(event: any) {
    let width = event.size.width;
    this.objectApiService
      .updateObject(this.id, null, null, null, width, null)
      .subscribe();
    this.adjustTextAreaFontSize(width);
  }

  updateText(object: Object) {
    console.log('updateText', object.text, object.size);
    console.log(
      'here this.myTextArea.nativeElement',
      this.myTextArea.nativeElement,
    );

    // this.myTextArea.nativeElement.value = object.text;
    this.renderer.setProperty(this.myTextArea.nativeElement, 'value', object.text);
    console.log('text content', this.myTextArea.nativeElement.value);
    // this.cdr.detectChanges();
  }

  adjustTextAreaFontSize(width: number) {
    let newFontSize = width / 10;

    newFontSize = Math.max(
      MIN_TEXTAREA_FONT_SIZE,
      Math.min(newFontSize, MAX_TEXTAREA_FONT_SIZE),
    );

    this.fontSize = newFontSize;
  }

  addNode(element: ResizeComponent, event: HTMLElement) {
    this.triggerAddNodeRequest(element, event);
  }

  triggerAddNodeRequest(element: ResizeComponent, event: HTMLElement) {
    this.requestAddNode.emit({
      htmlElement: event, // yourHtmlElement should be of type HTMLElement
      resizeComponent: element, // yourResizeComponentInstance should be an instance of ResizeComponent or the relevant type
    });
  }

  preventFocus(event: any): void {
    event.preventDefault();
  }
  // rightClick(event: any):void {
  onDoubleClick(event: any): void {
    event.preventDefault();
    this.requestDeleteNode.emit(this);
    this.requestDeleteNodeRemoveLine.emit(this);
    return;
  }

  // onDoubleClick(event: any): void {
  rightClick(event: any): void {
    event.preventDefault();
    // this adds a node by right clicking
    console.log('right click, this grandparent', event.target.parentElement);
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

  rightClickDoNothing(event: any) {
    event.preventDefault();
  }

  addNodeButtonClick(event: any) {
    console.log('add node button click');
  }

  deleteButtonClick(event: any) {
    console.log('delete button click');
  }

  emitMovingOffset(event?: any) {
    this.requestOnMoving.emit(event);
    // this.movingEvents.next(event);
  }

  ngOnInit(): void {
    // Set initial position and text and size
    console.log('resize componenet ngOnInit', this.object, this.id);
    this.setPosition(this.object.x, this.object.y, this.object.size);

    // Subscribe to typingEvents and call onTypingFinished when typing is finished
    this.subscription = this.typingEvents
      .pipe(
        debounceTime(500), // Adjust debounce time as needed
      )
      .subscribe((data) => {
        this.onTypingFinished(data);
      });
  }

  ngAfterViewInit(): void {
    this.myTextArea.nativeElement.textContent = this.object.text;
  }

  onTypingFinished(data: string): void {
    this.objectApiService.updateObject(this.id, data).subscribe();
  }

  onKeyUp(event: any): void {
    const value = event.target.value;
    this.typingEvents.next(value);
  }

  setPosition(x: number, y: number, width: number): void {
    // Update the component's position based on x and y values
    // console.log("before", this.position.x, this.position.y, x, y, width, this.position)
    // If we use position to set x and y, we will need to wait the update of the position by setTimout of 0
    // this.position.x = x;
    // this.position.y = y;
    this.position = { x: x, y: y };
    if (width <= 10) {
      width = 180;
    }
    // console.log("after", this.position.x, this.position.y, x, y, width, this.position)

    const height = width / 2;

    const resizableWidget =
      this.el.nativeElement.querySelector('.resizable-widget');
    if (resizableWidget) {
      this.renderer.setStyle(resizableWidget, 'width', `${width}px`);
      this.renderer.setStyle(resizableWidget, 'height', `${height}px`);
      this.adjustTextAreaFontSize(width);
      // If we use the render way, it directly updates the position, no need of setTimeout
      // this.renderer.setStyle(resizableWidget, 'transform', `translate(${x}px, ${y}px)`);
    }
  }

  onDragEnd(event: any): void {
    this.emitMovingOffset();
    // TODO: Distinguish between drag and focus on textarea
    const transform = event.style.transform;
    const regex = /translate\((-?\d+)px, (-?\d+)px\)/;
    const match = transform.match(regex);
    // TODO: use this.position?
    // console.log('this.position', this.position);

    if (match) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      // console.log('id', this.id, 'x', x, 'y', y);

      // Now you can use x and y to update the object
      this.objectApiService
        .updateObject(this.id, null, x, y, null, null)
        .subscribe();
    }
  }
}
