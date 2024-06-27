import {
  ChangeDetectorRef,
  Component,
  Input,
  Renderer2,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { User } from '../../classes/user';
import { ResizeComponent } from '../../object/resize/resize.component';
import { LeaderLineService } from '../../services/leader-line.service';
import { NodeResizeEvent } from '../../object/resize/resize.component';
@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  @Input() user: User = {
    email: '',
    picture: '',
  };

  @ViewChild('canvas', { read: ViewContainerRef }) canvas!: ViewContainerRef;
  // @ViewChild('testuse')

  constructor(
    private renderer: Renderer2,
    private leaderLineService: LeaderLineService,
  ) {}

  ngAfterViewInit() {
    // Initialize the canvas or perform any additional setup if needed
  }

  createNode() {
    let componentRef = this.canvas.createComponent(ResizeComponent);
    console.log('homehome 1.5');
    componentRef.instance.canvas = this.canvas.element.nativeElement;
    const newResizeComponent = componentRef.instance;
    const newElement: HTMLElement =
      componentRef.location.nativeElement.querySelector('div');
    console.log('newElement', newElement);

    componentRef.instance.requestAddNode.subscribe((temp: NodeResizeEvent) => {
      // temp: is the old one
      // new one from no where
      const newE: NodeResizeEvent = this.addNodeButtonClick(temp); // Now element is guaranteed to be of type HTMLElement
      console.log('after add', newE.htmlElement, newE.resizeComponent);

      this.addLineForTwoNode(
        temp.htmlElement,
        newE.htmlElement,
        newE.resizeComponent,
        temp.resizeComponent,
      ); // All arguments are now guaranteed to be defined
    });
  }

  // when we right click, we call requestAddNode.emit
  // then this will be called
  addNodeButtonClick(oldNode: NodeResizeEvent): NodeResizeEvent {
    let componentRef = this.canvas.createComponent(ResizeComponent);
    console.log('homehome 1.5');
    componentRef.instance.canvas = this.canvas.element.nativeElement;
    const newResizeComponent = componentRef.instance;
    const newElement: HTMLElement =
      componentRef.location.nativeElement.querySelector('div');
    console.log('newElement', newElement);

    componentRef.instance.requestAddNode.subscribe((temp: NodeResizeEvent) => {
      // temp: is the old one
      // new one from no where
      const newE: NodeResizeEvent = this.addNodeButtonClick(temp); // Now element is guaranteed to be of type HTMLElement
      console.log('after add', newE.htmlElement, newE.resizeComponent);

      this.addLineForTwoNode(
        temp.htmlElement,
        newE.htmlElement,
        newE.resizeComponent,
        temp.resizeComponent,
      ); // All arguments are now guaranteed to be defined
    });
    return { htmlElement: newElement, resizeComponent: newResizeComponent };
  }

  addLineForTwoNode(
    startElement: HTMLElement,
    endElement: HTMLElement,
    startResizeComponent: ResizeComponent,
    oneResizeComponent: ResizeComponent,
  ) {
    console.log(
      'addLine ForTwoNode',
      startElement,
      endElement,
      startResizeComponent,
      oneResizeComponent,
    );
    // call from line component
    let line = this.leaderLineService.createLine(startElement, endElement, {
      color: 'black',
      size: 2,
    });

    // set the start and end socket
    // line.setOptions({ startSocket: 'right', endSocket: 'left' });

    // todo: set debounceTime
    startResizeComponent.requestOnMoving.subscribe((element: HTMLElement) => {
      // console.log('requestOnMoving 1', element);

      line.position();
      // Handle the moving of the node
    });
    oneResizeComponent.requestOnMoving.subscribe((element: HTMLElement) => {
      // console.log('requestOnMoving 2', element);
      line.position();
      // Handle the moving of the node
    });
    // line.setOptions({startSocket: 'buttom', endSocket: 'buttom'});
  }
}
