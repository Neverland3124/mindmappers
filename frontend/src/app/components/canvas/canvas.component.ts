import {
  Component,
  Input,
  Renderer2,
  ViewChild,
  ViewContainerRef,
  ViewChildren,
  ChangeDetectorRef,
  ComponentRef,
  EventEmitter,
  Output,
} from '@angular/core';
import { User } from '../../classes/user';
import { ResizeComponent } from '../../object/resize/resize.component';
import { LeaderLineService } from '../../services/leader-line.service';
import { NodeResizeEvent } from '../../object/resize/resize.component';
import { RoomApiService } from '../../services/room-api.service';
import { ObjectApiService } from '../../services/object-api.service';
import { Room } from '../../classes/room';
import { Object } from '../../classes/object';
import { SocketService } from '../../services/socket.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

interface Node {
  htmlElement: HTMLElement;
  resizeComponent: ResizeComponent;
  componentRef: ComponentRef<ResizeComponent>;
}

@Component({
  selector: 'app-canvas',
  standalone: false,
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent {
  @Input() user: User = {
    email: '',
    picture: '',
  };
  @Input() roomName: string = 'Room';
  @Input() roomId: number = 1;
  private nodeList: Node[] = [];
  private lines: any[] = [];

  @ViewChild('canvas', { read: ViewContainerRef }) canvas!: ViewContainerRef;
  @Input() socketService!: SocketService;
  @Output() exitRoom = new EventEmitter<void>();

  constructor(
    private leaderLineService: LeaderLineService,
    private objectApiService: ObjectApiService,
    private notificationService: NzNotificationService,
  ) {}

  emitExitRoom() {
    this.destroyNodesLines();
    this.exitRoom.emit();
  }

  ngOnInit() {
    setTimeout(() => {
      console.log('canvas ngOnInit', this.socketService);
      this.socketService.removeAllListeners();
      this.updateCanvas();
      this.setupSocketListener();
    }, 0);
  }

  updateCanvas() {
    console.log('updateCanvas', this.roomId, this.roomName);
    this.objectApiService.getObjects(this.roomId).subscribe((response) => {
      console.log('response', response);
      const objects = response.objects;
      setTimeout(() => {
        this.drawNodesAndLines(objects);
      }, 0);
    });
  }

  setupSocketListener() {
    // set the socket io of webhook same as the room

    this.socketService.listen('webhook-delivered', (webhook: any) => {
      // validate the userId
      const { roomName, userEmail, friendName, friendEmail } = webhook.webhook;
      if (userEmail !== this.user.email) {
        return;
      }
      console.log('webhook-delivered', webhook);
      this.notificationService.success(
        'Webhook delivered',
        `User: ${userEmail}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been sent.`,
        {
          nzDuration: 30000,
        },
      );
    });
    this.socketService.listen('webhook-opened', (webhook: any) => {
      const { roomName, userEmail, friendName, friendEmail } = webhook.webhook;
      if (userEmail !== this.user.email) {
        return;
      }
      console.log('webhook-opened', webhook);
      this.notificationService.info(
        'Webhook opened',
        `User: ${userEmail}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been opened.`,
        {
          nzDuration: 30000,
        },
      );
    });

    this.socketService.listen(
      `object-${this.roomId}-create`,
      (object: Object) => {
        console.log(`room ${this.roomId} create with `, object, this.nodeList);
        setTimeout(() => {
          console.log(
            'socket create listen',
            this.nodeList.find((o) => o.resizeComponent.id === object.id),
            object.id,
          );

          if (
            this.nodeList.find((o) => o.resizeComponent.id === object.id) ===
            undefined
          ) {
            console.log('socket create');
            // if we can't find the object, we create it
            let componentRef = this.canvas.createComponent(ResizeComponent);
            componentRef.instance.canvas = this.canvas.element.nativeElement;
            componentRef.instance.id = object.id;
            componentRef.instance.object = object;
            const objectResizeComponent: ResizeComponent =
              componentRef.instance;
            const objectHTMLElement: HTMLElement =
              componentRef.location.nativeElement.querySelector('div');

            componentRef.instance.requestAddNode.subscribe(
              (temp: NodeResizeEvent) => {
                this.sendAddNodeRequest(temp);
              },
            );
            this.deleteNode(componentRef);

            console.log('before listen add node', this.nodeList);
            this.nodeList.push({
              htmlElement: objectHTMLElement,
              resizeComponent: objectResizeComponent,
              componentRef: componentRef,
            });
            console.log('after listen add node', this.nodeList);

            if (object.parent != null) {
              const parentObject = this.nodeList.find(
                (o) => o.resizeComponent.id === object.parent,
              );
              const childObject = this.nodeList.find(
                (o) => o.resizeComponent.id === object.id,
              );
              if (parentObject && childObject) {
                this.addLineForTwoNode(
                  parentObject.htmlElement,
                  childObject.htmlElement,
                  parentObject.resizeComponent,
                  childObject.resizeComponent,
                );
              }
            }
          }
        }, 0);
      },
    );

    this.socketService.listen(
      `object-${this.roomId}-delete`,
      (object: Object) => {
        const removedObject = this.nodeList.find(
          (o) => o.resizeComponent.id === object.id,
        );
        setTimeout(() => {
          removedObject?.resizeComponent.requestDeleteNodeRemoveLine.emit();
          removedObject?.componentRef.destroy();
          this.nodeList = this.nodeList.filter(
            (o) => o.resizeComponent.id !== object.id,
          );
        }, 0);

        // update the parents of the children
        // TODO: refactor the if conditions
        console.log('nodeList', this.nodeList, 'object', object);
        const parentId = object.parent;
        const parent = this.nodeList.find(
          (o) => o.resizeComponent.id === parentId,
        );
        if (parent === null || parent === undefined) {
          // case our parent is null
          const children = this.nodeList.filter(
            (o) => o.resizeComponent.object.parent === parentId,
          );

          for (let child of children) {
            child.resizeComponent.object.parent = object.parent;
          }
          return;
        }
        // If the parent is null or cannot find, we don't need
        const children = this.nodeList.filter(
          (o) => o.resizeComponent.object.parent === object.id,
        );

        if (children === null || children === undefined) {
          // no children, return
          return;
        }

        for (let child of children) {
          child.resizeComponent.object.parent = object.parent;
          console.log('child and parent connect after delete', parent, child);
          this.addLineForTwoNode(
            parent.htmlElement,
            child.htmlElement,
            parent.resizeComponent,
            child.resizeComponent,
          );
        }
      },
    );

    this.socketService.listen(
      `object-${this.roomId}-update`,
      (object: Object) => {
        console.log(`room ${this.roomId} update with `, object);

        const currentObject = this.nodeList.find(
          (o) => o.resizeComponent.id === object.id,
        );
        console.log('currentObject', currentObject, 'object', object);
        currentObject?.resizeComponent.updateLocation(object);
        currentObject?.resizeComponent.updateText(object);
      },
    );
  }

  handleAddNode(event: NodeResizeEvent) {
    console.log('handleAddNode', event);
    const id = event.resizeComponent.id;
    this.objectApiService
      .createObject(null, 0, 0, 0, id, this.roomId)
      .subscribe();
  }

  createNode() {
    this.objectApiService
      .createObject(null, 0, 0, 0, null, this.roomId)
      .subscribe();
  }

  drawNodesAndLines(objects: Object[]) {
    // so we are given a list of nodes, we expected to create all the components and then draw all the lines
    for (let object of objects) {
      let componentRef = this.canvas.createComponent(ResizeComponent);
      componentRef.instance.canvas = this.canvas.element.nativeElement;
      componentRef.instance.id = object.id;
      componentRef.instance.object = object;
      const objectResizeComponent: ResizeComponent = componentRef.instance;
      const objectHTMLElement: HTMLElement =
        componentRef.location.nativeElement.querySelector('div');
      componentRef.instance.requestAddNode.subscribe(
        (temp: NodeResizeEvent) => {
          this.sendAddNodeRequest(temp);
        },
      );
      this.deleteNode(componentRef);

      this.nodeList.push({
        htmlElement: objectHTMLElement,
        resizeComponent: objectResizeComponent,
        componentRef: componentRef,
      });
    }

    console.log('temp', this.nodeList);

    setTimeout(() => {
      console.log('draw lines');
      for (let object of objects) {
        // console.log("draw line", object)
        if (object.parent != null) {
          // console.log("draw line have parent", object)
          // console.log(object)
          const parentObject = this.nodeList.find(
            (o) => o.resizeComponent.id === object.parent,
          );
          const childObject = this.nodeList.find(
            (o) => o.resizeComponent.id === object.id,
          );
          if (parentObject && childObject) {
            console.log('draw line', parentObject, childObject);
            this.addLineForTwoNode(
              parentObject.htmlElement,
              childObject.htmlElement,
              parentObject.resizeComponent,
              childObject.resizeComponent,
            );
          }
        }
      }
    }, 0);
  }

  sendAddNodeRequest(oldNode?: NodeResizeEvent): void {
    let parentNodeId = oldNode ? oldNode.resizeComponent.id : null;
    let x = oldNode ? oldNode.resizeComponent.object.x + 100 : 50;
    let y = oldNode ? oldNode.resizeComponent.object.y + 100 : -500;
    this.objectApiService
      .createObject(null, x, y, 180, parentNodeId, this.roomId)
      .subscribe((response) => {
        console.log('add component response', response);
        // componentRef.instance.id = response.id;
        // This is the only place where we add the new node to the list that is not websocket event
        // componentRef.instance.object = response;
      });
  }

  deleteNode(componentRef: ComponentRef<ResizeComponent>) {
    componentRef.instance.requestDeleteNode.subscribe(
      (remove: ResizeComponent) => {
        // only send the api request to delete the node
        this.objectApiService.deleteObject(remove.id).subscribe();
        return;
      },
    );
  }

  addLineForTwoNode(
    startElement: HTMLElement,
    endElement: HTMLElement,
    startResizeComponent: ResizeComponent,
    oneResizeComponent: ResizeComponent,
  ) {
    console.log(
      'addLine ForTwoNode',
      startResizeComponent.id,
      oneResizeComponent.id,
    );
    // call from line component

    setTimeout(() => {
      let line = this.leaderLineService.createLine(startElement, endElement, {
        color: 'black',
        size: 2,
      });
      console.log('line', line);
      this.lines.push(line);

      // todo: set debounceTime
      startResizeComponent.requestOnMoving.subscribe(() => {
        setTimeout(() => {
          // console.log('startResizeComponent.requestOnMoving');
          // console.log(line);
          if (line === null || line === undefined) {
            return;
          }
          if (this.lines.find((l) => l === line) === undefined) {
            return;
          }
          line.position();
        }, 0);
      });
      oneResizeComponent.requestOnMoving.subscribe(() => {
        setTimeout(() => {
          console.log('oneResizeComponent.requestOnMoving');
          if (line === null || line === undefined) {
            return;
          }
          if (this.lines.find((l) => l === line) === undefined) {
            return;
          }
          line.position();
        }, 0);
      });

      // the issue is that line.remove() might be called twice
      oneResizeComponent.requestDeleteNodeRemoveLine.subscribe(() => {
        // we do have remove
        if (line === null || line === undefined) {
          return;
        }
        // if we cannot find the line, we don't need to remove
        if (this.lines.find((l) => l === line) === undefined) {
          return;
        }
        line.remove();
        this.lines = this.lines.filter((l) => l !== line);
      });

      startResizeComponent.requestDeleteNodeRemoveLine.subscribe(() => {
        if (line === null || line === undefined) {
          return;
        }
        // if we cannot find the line, we don't need to remove
        if (this.lines.find((l) => l === line) === undefined) {
          return;
        }
        line.remove();
        this.lines = this.lines.filter((l) => l !== line);
      });
    }, 0);
  }

  destroyNodesLines() {
    this.lines.forEach((line) => line.remove());
    this.lines = [];

    this.nodeList.forEach((node) => {
      node.componentRef.destroy();
    });
    this.nodeList = [];
  }
}
