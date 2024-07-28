import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
  ElementRef,
} from '@angular/core';
import * as go from 'gojs';
import { DataSyncService, DiagramComponent } from 'gojs-angular';
import { ObjectApiService } from '../../services/object-api.service';
import { ImageApiService } from '../../services/image-api.service';
import { User } from '../../classes/user';
import { SocketService } from '../../services/socket.service';
import { produce } from 'immer';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Object } from '../../classes/object';
import { RealtimeDragSelectingTool } from '../../../assets/js/realtime-drag-selecting-tool';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApiService } from '../../services/api.service';
import { RoomApiService } from '../../services/room-api.service';
import { Room } from '../../classes/room';
import { TextEditor } from '../../../assets/js/TextEditor';
import { InstructionModalComponent } from '../instruction-modal/instruction-modal.component';
import { AboutModalComponent } from '../about-modal/about-modal.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';
const $ = go.GraphObject.make;

const colors = {
  pink: '#facbcb',
  blue: '#b7d8f7',
  green: '#b9e1c8',
  yellow: '#faeb98',
  background: '#e8e8e8',
  light_orange: '#f9d6b8',
  dark_orange: '#db591d',
};

interface NodeData {
  text: string;
  loc: string;
  dir?: string;
  parent?: number;
  font?: string;
}

type ObjectWithUserId = {
  nodes: Object[];
  userId: number;
};

type ObjectIdWithUserId = {
  keys: number[];
  userId: number;
};

@Component({
  selector: 'app-gocanvas',
  standalone: false,
  templateUrl: './gocanvas.component.html',
  styleUrl: './gocanvas.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GoCanvasComponent {
  @Input() user: User = {
    id: -1,
    email: '',
    avatar: '',
    name: '',
  };
  @Input() room: Room = {
    id: -1,
    name: '',
    description: '',
    owner: -1,
    ownerName: '',
    ownerAvatar: '',
  };
  @Input() socketService!: SocketService;
  @Input() roomDescription: string = 'Description of Room';
  @Output() exitRoom = new EventEmitter<void>();

  @ViewChild('myDiagram', { static: true }) public myDiagramComponent:
    | DiagramComponent
    | undefined;

  @ViewChild('fileInput') fileInput!: ElementRef;

  observedDiagram: any = null;
  selectedNodeData: number[] | null = null;
  diagramDivClassName: string = 'myDiagramDiv';
  overviewDivClassName: string = 'myOverviewDiv';
  populatingData = false;
  viewportBoundsChangedSubject = new Subject<any>();

  state = {
    diagramNodeData: [
      // { id: 1, loc: '0 0', text: 'Nodes loading', dir: 'right' },
      // { id: 2, loc: '190 15', text: 'Please Wait', dir: 'right', parent: 1 },
    ],
    diagramLinkData: [
      // { from: 1, to: 2, progress: true, text: 'Browse' }
    ],
    diagramModelData: { prop: 'value' },
    skipsDiagramUpdate: true, // A boolean flag, specifying whether the component should skip updating, often set when updating state from a GoJS model change.
  }; // end state object

  isCollapsed = true;
  scrollMode = go.ScrollMode.Infinite;

  menuState = {
    haveNodeSelected: true, // default no node selected
    pasteAction: true,
    undoAction: false,
    redoAction: false,
    alwaysFalse: false,
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private objectApiService: ObjectApiService,
    private imageApiService: ImageApiService,
    private messageService: NzMessageService,
    private modalService: NzModalService,
    private roomApiService: RoomApiService,
    private notificationService: NzNotificationService,
  ) {
    this.initDiagram = this.initDiagram.bind(this);
  }

  ngOnInit(): void {
    this.isCollapsed = this.apiService.getIsCollapsed();
    this.scrollMode = this.apiService.getScrollMode()
      ? go.ScrollMode.Infinite
      : go.ScrollMode.Document;
    setTimeout(() => {
      this.setupSocketListeners();
    }, 0);
  }

  ngAfterViewInit() {
    if (this.observedDiagram) return;
    this.observedDiagram = this.myDiagramComponent?.diagram;
    this.cdr.detectChanges();
    const appComp: any = this;
    setTimeout(() => {
      this.populateState();
      if (this.myDiagramComponent?.diagram) {
        // Set zoom level
        const zoomLevel = parseFloat(
          sessionStorage.getItem(`${this.room.id}-zoomLevel`) || '1',
        );
        this.myDiagramComponent.diagram.scale = zoomLevel;
        // Set viewport bounds
        const savedBounds = sessionStorage.getItem(
          `${this.room.id}-viewportBounds`,
        );
        if (savedBounds) {
          const bounds = JSON.parse(savedBounds);
          const rect = new go.Rect(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
          );
          this.myDiagramComponent.diagram.position = rect.position;
        }
      }
    }, 0);
    this.viewportBoundsChangedSubject
      .pipe(
        debounceTime(600), // 600 milliseconds debounce time
      )
      .subscribe((e) => {
        this.onViewportBoundsChangeHandler(e);
      });
    this.myDiagramComponent?.diagram.addDiagramListener(
      'ViewportBoundsChanged',
      (e) => {
        this.viewportBoundsChangedSubject.next(e);
      },
    );

    this.myDiagramComponent?.diagram.addDiagramListener(
      'ChangedSelection',
      function (e) {
        const current_selection = e.diagram.selection;
        if (current_selection.count === 0) {
          appComp.selectedNodeData = null;
          appComp.menuState.haveNodeSelected = true;
        } else {
          const selectedKeys: go.Key[] = [];
          current_selection.each((item) => {
            selectedKeys.push(item.key);
          });
          appComp.selectedNodeData = selectedKeys;
          appComp.menuState.haveNodeSelected = false;
        }
      },
    );

    const diagram = this.myDiagramComponent?.diagram;
    if (diagram) {
      diagram.commandHandler.doKeyDown = function () {
        const e = this.diagram.lastInput;
        if (e.code === 'KeyZ' && e.control) {
          appComp.undoAction();
        } else if (e.code === 'KeyY' && e.control) {
          appComp.redoAction();
        } else if (e.code === 'KeyC' && e.control) {
          appComp.copyAction();
        } else if (e.code === 'KeyX' && e.control) {
          appComp.cutAction();
        } else if (e.code === 'Tab') {
          // If have selected one node, create a new node
          if (appComp.selectedNodeData) {
            const key = appComp.selectedNodeData[0];
            const node =
              appComp.myDiagramComponent?.diagram.findNodeForKey(key);
            appComp.addNodeAndLink(this.diagram, node);
          }
        } else if (e.code === 'Enter') {
          // Create a sibling node
          if (appComp.selectedNodeData) {
            const key = appComp.selectedNodeData[0];
            const node =
              appComp.myDiagramComponent?.diagram.findNodeForKey(key);
            const parent = appComp.myDiagramComponent?.diagram.findNodeForKey(
              node.data.parent,
            );
            if (parent) {
              appComp.addNodeAndLink(this.diagram, parent);
            }
          }
        } else if (e.code === 'KeyW') {
          // Go to the it's parent node
          if (appComp.selectedNodeData) {
            const key = appComp.selectedNodeData[0];
            const node =
              appComp.myDiagramComponent?.diagram.findNodeForKey(key);
            const parent = appComp.myDiagramComponent?.diagram.findNodeForKey(
              node.data.parent,
            );
            if (parent) {
              appComp.myDiagramComponent?.diagram.select(parent);
            }
          }
        } else if (e.code === 'KeyS') {
          // Go to the first child node
          if (appComp.selectedNodeData) {
            const key = appComp.selectedNodeData[0];
            const node =
              appComp.myDiagramComponent?.diagram.findNodeForKey(key);
            const children = node.findTreeChildrenNodes();
            const firstChild = children.first();
            if (firstChild) {
              appComp.myDiagramComponent?.diagram.select(firstChild);
            }
          }
        } else {
          // call base method with no arguments
          go.CommandHandler.prototype.doKeyDown.call(this);
        }
      };
    }
    this.updateUndoRedoState();
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks
    if (this.viewportBoundsChangedSubject) {
      this.viewportBoundsChangedSubject.unsubscribe();
    }
  }

  onViewportBoundsChangeHandler(e: any) {
    const zoomLevel = e.diagram.scale;

    const currentZoomLevel =
      sessionStorage.getItem(`${this.room.id}-zoomLevel`) || 1;
    if (zoomLevel !== currentZoomLevel) {
      sessionStorage.setItem(
        `${this.room.id}-zoomLevel`,
        JSON.stringify(zoomLevel),
      );
    }

    const bounds = e.diagram.viewportBounds;
    const serializedBounds = JSON.stringify({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
    sessionStorage.setItem(`${this.room.id}-viewportBounds`, serializedBounds);
  }

  populateState() {
    this.objectApiService.getObjects(this.room.id).subscribe((response) => {
      const diagramNodeData = response.objects.map((obj) => ({
        key: obj.key,
        text: obj.text || 'empty node',
        loc: obj.loc,
        dir: obj.dir,
        parent: obj.parent || 0,
        font: obj.font || '16px sans-serif',
      }));

      this.populatingData = true;

      this.myDiagramComponent?.diagram.clear();
      this.myDiagramComponent?.diagram.startTransaction('populating data');
      this.state = produce(this.state, (draft: any) => {
        draft.diagramNodeData = diagramNodeData;
        draft.skipsDiagramUpdate = false;
      });
      this.myDiagramComponent?.diagram.commitTransaction('populating data');
      this.cdr.detectChanges();
      this.myDiagramComponent?.diagram.undoManager.clear();
      this.populatingData = false;
    });
  }

  /**
   * The most important function
   * Create the diagram, set up the node and link template
   * Diagram Set up recourse:
   * https://gojs.net/latest/samples/mindMap.html
   * https://gojs.net/latest/samples/stateChart.html
   *
   */
  initDiagram(): go.Diagram {
    const dia = $(go.Diagram, {
      // enable undo & redo
      'undoManager.isEnabled': true,
      // Handle for mind map like diagram
      // Allow copy whole tree, copy parent key, delete tree, drag tree
      'commandHandler.copiesTree': true,
      'commandHandler.copiesParentKey': true,
      'commandHandler.deletesTree': true,
      'draggingTool.dragsTree': true,
      'toolManager.mouseWheelBehavior': go.WheelMode.Zoom,
      // "animationManager.isInitial": false,
      // "animationManager.isEnabled": false,
      'textEditingTool.defaultTextEditor': TextEditor,

      scrollMode: this.scrollMode,
      // support double-click in background creating a new node
      'clickCreatingTool.archetypeNodeData': {
        text: 'new idea',
        // color: 'lightblue'
      },
      model: $(go.TreeModel, {
        // nodeKeyProperty: 'id',
        // linkKeyProperty: 'key', // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
      }),
      // Below allows select multiple nodes after drag and wait briefly
      dragSelectingTool: $(
        RealtimeDragSelectingTool,
        { isPartialInclusion: true, delay: 225 },
        {
          box: $(
            go.Part, // replace the magenta box with a red one
            { layerName: 'Tool', selectable: false },
            $(go.Shape, {
              name: 'SHAPE',
              fill: 'rgba(250, 203, 203, 0.1)',
              stroke: 'pink',
              strokeWidth: 2,
            }),
          ),
        },
      ),
    });

    dia.nodeTemplate = $(
      go.Node,
      // Auto will fits the item in
      // Link to different type: https://gojs.net/latest/intro/nodes.html
      'Auto',
      {
        isShadowed: true,
        shadowBlur: 0,
        shadowOffset: new go.Point(4, 4),
        shadowColor: 'grey',
        cursor: 'grab',
      },
      $(
        go.Shape,
        'RoundedRectangle',
        {
          strokeWidth: 1.5,
          fill: colors.light_orange,
          portId: '',
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
          // maxSize: new go.Size(200, 150),
        },
        new go.Binding('fill', 'type', (type) => {
          if (type === 'Start') return colors.green;
          if (type === 'End') return colors.pink;
          return colors.blue;
        }),
        new go.Binding('figure', 'type', (type) => {
          if (type === 'Start' || type === 'End') return 'Circle';
          return 'RoundedRectangle';
        }),
        new go.Binding('fromSpot', 'dir', (d) => this.spotConverter(d, true)),
        new go.Binding('toSpot', 'dir', (d) => this.spotConverter(d, false)),
      ),
      $(
        go.TextBlock,
        {
          name: 'TEXT',
          shadowVisible: false,
          margin: 8,
          font: '16px sans-serif', // set font
          stroke: '#000000', // set color
          editable: true,
          maxSize: new go.Size(2000, NaN),
        },
        new go.Binding('text', 'text').makeTwoWay(),
        new go.Binding('scale', 'scale').makeTwoWay(),
        new go.Binding('font', 'font').makeTwoWay(),
      ),
    ).bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify);

    // template for select node
    dia.nodeTemplate.selectionAdornmentTemplate = $(
      go.Adornment,
      'Spot',
      $(
        go.Panel,
        'Auto',
        $(go.Shape, 'RoundedRectangle', {
          fill: null,
          stroke: colors.pink,
          strokeWidth: 3,
        }),
        $(go.Placeholder), // a Placeholder sizes itself to the selected Node
      ),
      $(
        'Button',
        {
          alignment: go.Spot.TopRight,
          click: (e: any, obj: any) => {
            const temp_diagram = e.diagram;
            const temp_node = obj.part.adornedPart;
            this.addNodeAndLink(temp_diagram, temp_node, true);
          },
        },
        $(go.Shape, 'PlusLine', { width: 6, height: 6 }), // add the Shape to the Button
      ),
    );

    let lineColor = colors.dark_orange;
    // link to link template options: https://gojs.net/latest/intro/links.html
    dia.linkTemplate = $(
      go.Link, // the whole link panel
      {
        curve: go.Curve.Bezier,
        toShortLength: 4,
        routing: go.Routing.AvoidsNodes,
        // corner: 1,    // rounded corners,
        // curviness: 20,
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides,
        selectable: false,
      },
      $(
        go.Shape, // the link shape
        { stroke: lineColor, strokeWidth: 2 }, // strokeWidth is the width of the line
      ),
      $(
        go.Shape, // the arrowhead
        { toArrow: 'Kite', fill: lineColor, stroke: lineColor, scale: 1.5 },
      ),
    );

    dia.addDiagramListener('SelectionMoved', (e) => {
      dia.startTransaction('SelectionMoved');
      e.diagram.selection.each((node: any) => {
        if (!node) return; // Skip if no node found
        let parentNode = dia.findNodeForKey(node.data.parent);
        if (!parentNode) return; // Skip if no parent node found

        let parentX = parentNode.location.x;
        let parentY = parentNode.location.y;
        let nodeX = node.location.x;
        let nodeY = node.location.y;

        // Update node direction based on its position relative to the parent
        let newDirection = '';
        const HORIZONTAL_THRESHOLD = 50; // Define a horizontal threshold value
        const VERTICAL_THRESHOLD = 50;

        if (
          Math.abs(parentX - nodeX) <= HORIZONTAL_THRESHOLD &&
          nodeY < parentY
        ) {
          // Node is above the parent within the horizontal threshold
          newDirection = 'top';
        } else if (
          Math.abs(parentX - nodeX) <= HORIZONTAL_THRESHOLD &&
          nodeY > parentY
        ) {
          // Node is below the parent within the horizontal threshold
          newDirection = 'bottom';
        } else if (
          Math.abs(parentY - nodeY) <= VERTICAL_THRESHOLD &&
          nodeX > parentX
        ) {
          // Node is to the right of the parent within the vertical threshold
          newDirection = 'right';
        } else if (
          Math.abs(parentY - nodeY) <= VERTICAL_THRESHOLD &&
          nodeX < parentX
        ) {
          // Node is to the left of the parent within the vertical threshold
          newDirection = 'left';
        } else {
          // Default case: decide based on predominant direction
          if (Math.abs(parentX - nodeX) > Math.abs(parentY - nodeY)) {
            if (nodeX > parentX) {
              newDirection = 'right';
            } else {
              newDirection = 'left';
            }
          } else {
            if (nodeY > parentY) {
              newDirection = 'bottom';
            } else {
              newDirection = 'top';
            }
          }
        }
        this.updateNodeDirection(node, newDirection, dia);
        this.layoutTree(node, dia);
      });
      dia.commitTransaction('SelectionMoved');
    });

    dia.toolManager.draggingTool.moveCursor = 'grab';
    return dia;
  } // End of initDiagram

  // Overview div init
  initOverview(): any {
    return $(go.Overview, { contentAlignment: go.Spot.Center });
  }

  /******************* Helper functions for initDiagram *******************/
  // direction converter for node
  spotConverter(dir: any, from: any) {
    if (dir === 'left') {
      return from ? go.Spot.Left : go.Spot.Right;
    } else if (dir === 'right') {
      return from ? go.Spot.Right : go.Spot.Left;
    } else if (dir === 'top') {
      return from ? go.Spot.Top : go.Spot.Bottom;
    } else {
      return from ? go.Spot.Bottom : go.Spot.Top;
    }
  }

  // add node and link
  addNodeAndLink(dia: any, obj: any, manual: boolean = false) {
    // Get from official document
    // let adornment = obj.part;
    // let fromNode = adornment.adornedPart;
    let diagram = dia;
    let fromNode = obj;
    diagram.startTransaction('Add State');
    let fromData = fromNode.data;
    let toData: NodeData = {
      text: 'new',
      loc: '',
      dir: fromData.dir,
      parent: fromData.key,
      font: fromData.font,
    };
    let p = fromNode.location.copy();
    const randomOffset = 350; // Define the range for randomness
    const yAxisOffset = 0.5;
    const randomNumber1 = Math.random();
    const randomNumber2 = Math.random();

    if (fromData.dir === 'left') {
      p.x -= 100 + randomNumber1 * randomOffset;
      p.y += (randomNumber2 - yAxisOffset) * 1.5 * randomOffset; // Randomize y-axis
    } else if (fromData.dir === 'right') {
      p.x += 100 + randomNumber1 * randomOffset;
      p.y += (randomNumber2 - yAxisOffset) * 1.5 * randomOffset; // Randomize y-axis
    } else if (fromData.dir === 'top') {
      p.y -= 100 + randomNumber1 * randomOffset;
      p.x += (randomNumber2 - yAxisOffset) * 1.5 * randomOffset; // Randomize x-axis
    } else {
      p.y += 100 + randomNumber1 * randomOffset;
      p.x += (randomNumber2 - yAxisOffset) * 1.5 * randomOffset; // Randomize x-axis
    }
    toData.loc = go.Point.stringify(p);

    let model = diagram.model;
    model.addNodeData(toData);
    diagram.commitTransaction('Add State');

    if (!manual) {
      // click on add make manual to true so skip the layout subtree
      diagram.startTransaction('Layout SubTree');
      this.layoutTree(fromNode, diagram);
      diagram.commitTransaction('Layout SubTree');
    }

    // select the new Node
    let newnode = diagram.findNodeForData(toData);
    diagram.select(newnode);

    // if the new node is off-screen, scroll the diagram to show the new node
    diagram.scrollToRect(newnode.actualBounds);

    // below set current node to edit
    if (diagram.currentTool instanceof go.TextEditingTool) {
      diagram.currentTool.acceptText(go.TextEditingTool.LostFocus);
    }
    // expand any "macros"
    // diagram.commandHandler.ungroupSelection();

    // start editing the first node that was dropped after ungrouping
    let tb: any = diagram.selection.first()?.findObject('TEXT');
    if (tb) diagram.commandHandler.editTextBlock(tb);
  }

  generateImage() {
    this.imageApiService.generateImage(this.room.id).subscribe({
      next: (response) => {
        this.messageService.success(response.message);
      },
      error: (error) => {
        if (error.status === 409) {
          this.messageService.info(
            'An image is currently being generated for this room. Please wait.',
          );
        } else {
          this.messageService.info(error.error);
        }
      },
    });
  }

  updateNodeDirection(node: any, dir: any, dia: any) {
    dia.model.setDataProperty(node.data, 'dir', dir);
    // recursively update the direction of the child nodes
    let chl = node.findTreeChildrenNodes(); // gives us an iterator of the child nodes related to this particular node
    while (chl.next()) {
      this.updateNodeDirection(chl.value, dir, dia);
    }
  }

  layoutTree(node: any, dia: any) {
    if (node.isTreeRoot) {
      this.layoutAll(dia); // lay out everything
    } else {
      // otherwise lay out only the subtree starting at this parent node
      let parts = node.findTreeParts();
      let angle = 0;
      switch (node.data.dir) {
        case 'right':
          angle = 0;
          break;
        case 'top':
          angle = 270;
          break;
        case 'left':
          angle = 180;
          break;
        case 'bottom':
          angle = 90;
          break;
      }
      this.layoutAngle(parts, angle);
    }
  }

  layoutAngle(parts: any, angle: any) {
    let layout = new go.TreeLayout({
      angle: angle,
      arrangement: go.TreeArrangement.FixedRoots,
      nodeSpacing: 30,
      layerSpacing: 120,
      setsPortSpot: false, // don't set port spots since we're managing them with our spotConverter function
      setsChildPortSpot: false,
    });
    layout.doLayout(parts);
  }

  layoutAll(dia: any) {
    dia.startTransaction('Layout all');
    dia.findTreeRoots().each((root: any) => {
      if (root === null) return;
      // split the nodes and links into two collections
      let rightward = new go.Set(/*go.Part*/);
      let leftward = new go.Set(/*go.Part*/);
      let topward = new go.Set(/*go.Part*/);
      let bottomward = new go.Set(/*go.Part*/);
      root.findLinksConnected().each((link: any) => {
        let child = link.toNode;
        if (child.data.dir === 'left') {
          leftward.add(root); // the root node is in both collections
          leftward.add(link);
          leftward.addAll(child.findTreeParts());
        } else if (child.data.dir === 'bottom') {
          bottomward.add(root); // the root node is in both collections
          bottomward.add(link);
          bottomward.addAll(child.findTreeParts());
        } else if (child.data.dir === 'top') {
          topward.add(root); // the root node is in both collections
          topward.add(link);
          topward.addAll(child.findTreeParts());
        } else {
          rightward.add(root); // the root node is in both collections
          rightward.add(link);
          rightward.addAll(child.findTreeParts());
        }
      });
      // do one layout and then the other without moving the shared root node
      this.layoutAngle(rightward, 0);
      this.layoutAngle(topward, 270);
      this.layoutAngle(leftward, 180);
      this.layoutAngle(bottomward, 90);
    });
    dia.commitTransaction('Layout all');
  }

  /******************* End Helper functions for initDiagram *******************/

  public diagramModelChange = (changes: go.IncrementalData) => {
    if (this.populatingData) {
      // don't need to send request to server when populating data
      return;
    }
    if (!changes) return;

    const appComp: any = this;
    if (!this.observedDiagram || !this.observedDiagram.model) {
      return;
    }

    // https://forum.nwoods.com/t/code-breaks-after-angular-16-upgrade/16440/3
    this.state = produce(this.state, (draft: any) => {
      // set skipsDiagramUpdate: true since GoJS already has this update
      // this way, we don't log an unneeded transaction in the Diagram's undoManager history
      draft.skipsDiagramUpdate = true;
      draft.diagramNodeData = DataSyncService.syncNodeData(
        changes,
        draft.diagramNodeData,
        appComp.observedDiagram.model,
      );
    });

    if (changes.removedNodeKeys) {
      const nodesToRemove = [];
      for (let nodeKey of changes.removedNodeKeys) {
        nodesToRemove.push(nodeKey);
      }
      if (nodesToRemove.length > 0) {
        this.objectApiService
          .deleteAllObjects(this.room.id, nodesToRemove)
          .subscribe({
            next: (_) => {},
            error: (_) => {
              this.messageService.error(
                'Failed to delete nodes, please refresh.',
              );
            },
          });
      }
    }

    if (changes.insertedNodeKeys) {
      const nodesToInsert = [];
      for (let nodeKey of changes.insertedNodeKeys) {
        const node = changes.modifiedNodeData?.find(
          (n) => n['key'] === nodeKey,
        );
        if (!node) continue;
        nodesToInsert.push({
          key: node['key'],
          text: node['text'],
          loc: node['loc'],
          dir: node['dir'] || 'right',
          parent: node['parent'] || null, // null means it's a root node
          font: node['font'] || '16px sans-serif',
        });
      }
      if (nodesToInsert.length > 0) {
        this.objectApiService
          .createAllObjects(this.room.id, nodesToInsert)
          .subscribe({
            next: (_) => {},
            error: (_) => {
              this.messageService.error(
                'Failed to insert nodes, please refresh.',
              );
            },
          });
      }
    }

    if (changes.modifiedNodeData) {
      const nodesToUpdate = [];

      for (let node of changes.modifiedNodeData) {
        if (changes.insertedNodeKeys?.includes(node['key'])) {
          // If the node is newly added, we don't need to update it
          continue;
        }
        // check if we can find it from this.state.diagramNodeData
        if (
          this.state.diagramNodeData.find((n: any) => n.key === node['key'])
        ) {
          nodesToUpdate.push({
            key: node['key'],
            roomId: this.room.id,
            text: node['text'],
            loc: node['loc'] || '0 0',
            dir: node['dir'] || 'right',
            parent: node['parent'] || 0,
            font: node['font'] || '16px sans-serif',
          });
        }
      }
      if (nodesToUpdate.length > 0) {
        this.objectApiService
          .updateAllObjects(this.room.id, nodesToUpdate)
          .subscribe({
            next: (_) => {},
            error: (_) => {
              this.messageService.error(
                'Failed to update nodes, please refresh.',
              );
            },
          });
      }
    }

    this.updateUndoRedoState();
  };

  setupSocketListeners() {
    this.socketService.removeAllListeners();
    // Websocket of creating new object/objects
    this.socketService.listen(
      `object-${this.room.id}-create`,
      (response: ObjectWithUserId) => {
        // if the nodes are all already in diagramNodeData, we don't need to update the diagram
        // if not, we need to update the diagram
        const nodes = response.nodes;
        const existingKeys = new Set(
          this.state.diagramNodeData.map((node: any) => node.key),
        );
        let needUpdate = false;

        for (let node of nodes) {
          // if the key is not in diagramNodeData, we need to update the diagram
          if (!existingKeys.has(node.key)) {
            needUpdate = true;
            break;
          }
        }

        if (!needUpdate) {
          return;
        }

        // need to update the diagram
        const diagramNodeData = response.nodes.map((obj: any) => ({
          key: obj.key,
          text: obj.text || 'empty node',
          loc: obj.loc,
          dir: obj.dir,
          parent: obj.parent || 0,
          font: obj.font || '16px sans-serif',
        }));

        this.populatingData = true;

        this.myDiagramComponent?.diagram.startTransaction('Object update');
        this.state = produce(this.state, (draft: any) => {
          draft.diagramNodeData.push(...diagramNodeData);
          draft.skipsDiagramUpdate = false;
        });
        this.myDiagramComponent?.diagram.commitTransaction('Object update');

        this.cdr.detectChanges();
        this.populatingData = false;
      },
    );
    // When other user update objects, we will update the diagram
    this.socketService.listen(
      `object-${this.room.id}-update`,
      (response: ObjectWithUserId) => {
        // check if the updated nodes are already in diagramNodeData
        // if all in diagramNodeData, we don't need to update the diagram
        // if not, we need to update the diagram
        const nodes = response.nodes;

        // Create a Set of keys from diagramNodeData for quick lookup
        const diagramNodeKeys = new Set(
          this.state.diagramNodeData.map((node: any) => node.key),
        );

        // Create a Map from diagramNodeData for detailed comparison
        const nodeMap = new Map(
          this.state.diagramNodeData.map((node: any) => [node.key, node]),
        );

        // Check if all nodes are in diagramNodeData
        let needUpdate = false;
        for (let node of nodes) {
          if (!diagramNodeKeys.has(node.key)) {
            needUpdate = true;
            break;
          }
          const foundNode = nodeMap.get(node.key);
          if (
            foundNode.text !== node.text ||
            foundNode.loc !== node.loc ||
            foundNode.dir !== node.dir ||
            foundNode.font !== node.font ||
            foundNode.parent !== node.parent
          ) {
            needUpdate = true;
            break;
          }
        }

        if (!needUpdate) {
          return;
        }

        // need to update the diagram
        this.populatingData = true;
        this.state = produce(this.state, (draft: any) => {
          draft.diagramNodeData = draft.diagramNodeData.map((node: any) => {
            const updatedNode = response.nodes.find(
              (n: any) => n.key === node.key,
            );
            return updatedNode || node;
          });
          draft.skipsDiagramUpdate = false;
        });
        this.cdr.detectChanges();
        this.populatingData = false;
      },
    );

    // When other user delete objects, we will delete the diagram
    this.socketService.listen(
      `object-${this.room.id}-delete`,
      (response: ObjectIdWithUserId) => {
        // if the nodes are all already not in diagramNodeData, we don't need to update the diagram
        // if not, we need to update the diagram
        const keys = response.keys;
        const existingKeys = new Set(
          this.state.diagramNodeData.map((node: any) => node.key),
        );
        let needUpdate = false;
        for (let key of keys) {
          // if the key is in diagramNodeData, we need to update the diagram
          if (existingKeys.has(key)) {
            needUpdate = true;
            break;
          }
        }
        if (!needUpdate) {
          return;
        }

        // update the diagram
        this.populatingData = true;
        this.state = produce(this.state, (draft: any) => {
          const keysToDelete = new Set(response.keys);
          draft.diagramNodeData = draft.diagramNodeData.filter(
            (node: any) => !keysToDelete.has(node.key),
          );
          draft.skipsDiagramUpdate = false;
        });

        this.cdr.detectChanges();
        this.populatingData = false;
      },
    );
    // When room description is updated, we update on room
    this.socketService.listen(
      `room-updated-${this.room.id}`,
      (response: Room) => {
        this.room = {
          ...this.room,
          ...response,
        };
        this.roomApiService.enterRoom(this.room);
      },
    );

    // When room is deleted, we navigate to home
    this.socketService.listen(`room-deleted`, (emitObject: any) => {
      if (emitObject.id === this.room.id) {
        // Owner has remove this room
        this.messageService.warning(
          `This room ${this.room.name} has been deleted by it's owner.`,
        );
        this.emitExitRoom();
      }
    });

    // webhook-delivered socket io
    this.socketService.listen('webhook-delivered', (webhook: any) => {
      // validate the userId
      const { roomName, userEmail, friendName, friendEmail } = webhook.webhook;
      if (userEmail !== this.user.email) {
        return;
      }
      this.notificationService.success(
        'Webhook delivered',
        `User: ${this.user.name}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been sent.`,
        {
          nzDuration: 30000,
        },
      );
    });
    this.socketService.listen('webhook-clicked', (webhook: any) => {
      const { roomName, userEmail, friendName, friendEmail } = webhook.webhook;
      if (userEmail !== this.user.email) {
        return;
      }
      this.notificationService.info(
        'Webhook clicked',
        `User: ${this.user.name}, your invitation of Room (${roomName}) to your friend ${friendName} (Email: ${friendEmail}) has been clicked.`,
        {
          nzDuration: 30000,
        },
      );
    });
  }

  onCollapseChange(): void {
    this.isCollapsed = !this.isCollapsed;
    this.apiService.setIsCollapsed(this.isCollapsed);
  }

  private isActionDisabled(event: any): boolean {
    if (event.target.closest('li').classList.contains('disabled')) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    return false;
  }

  /***** Helper functions for the control panel *****/
  // We choose not to use this feature of text bigger or smaller
  // onMakeTextBigger(event: any) {
  //   if (this.isActionDisabled(event)) return;
  //   if (!this.selectedNodeData) return;
  //   this.myDiagramComponent?.diagram.startTransaction('Increase Text Size');
  //   this.selectedNodeData.forEach((key: any) => {
  //     const node = this.myDiagramComponent?.diagram.findNodeForKey(key);
  //     if (node) {
  //       let tb = node.findObject('TEXT');
  //       if (tb) {
  //         tb.scale *= TextSizeIncrease;
  //       }
  //     }
  //   });
  //   this.myDiagramComponent?.diagram.commitTransaction('Increase Text Size');
  // }

  // onMakeTextSmaller(event: any): void {
  //   if (this.isActionDisabled(event)) return;
  //   if (!this.selectedNodeData) return;
  //   this.myDiagramComponent?.diagram.startTransaction('Decrease Text Size');
  //   this.selectedNodeData.forEach((key: any) => {
  //     const node = this.myDiagramComponent?.diagram.findNodeForKey(key);
  //     if (node) {
  //       let tb = node.findObject('TEXT');
  //       if (tb) {
  //         tb.scale *= TextSizeDecrease;
  //       }
  //     }
  //   });
  //   this.myDiagramComponent?.diagram.commitTransaction('Increase Text Size');
  // }

  onAddNode(event: any): void {
    if (this.isActionDisabled(event)) return;
    let toData: NodeData = {
      text: 'new idea',
      loc: '',
      dir: 'right',
      font: '16px sans-serif',
    };
    let p = { x: 0, y: 0 };
    const range = 200; // Define the range for randomness
    const randomNumber1 = Math.random();
    const randomNumber2 = Math.random();

    p.x = (randomNumber1 * 2 - 1) * range; // Randomize x-axis between -200 and 200
    p.y = (randomNumber2 * 2 - 1) * range; // Randomize y-axis between -200 and 200

    toData.loc = `${p.x} ${p.y}`;
    const diagram = this.myDiagramComponent?.diagram;
    if (!diagram) return;

    diagram.startTransaction('Add State');
    let model = diagram.model;
    model.addNodeData(toData);
    diagram.commitTransaction('Add State');

    // select the new Node
    let newnode = diagram.findNodeForData(toData);
    diagram.select(newnode);

    // if the new node is off-screen, scroll the diagram to show the new node
    if (newnode) {
      diagram.scrollToRect(newnode.actualBounds);
    }

    // below set current node to edit
    if (diagram.currentTool instanceof go.TextEditingTool) {
      diagram.currentTool.acceptText(go.TextEditingTool.LostFocus);
    }

    // expand any "macros"
    // diagram.commandHandler.ungroupSelection();

    // start editing the first node that was dropped after ungrouping
    let tb: any = diagram.selection.first()?.findObject('TEXT');
    if (tb) diagram.commandHandler.editTextBlock(tb);
  }

  onCopyNodes(event: any): void {
    if (this.isActionDisabled(event)) return;
    if (!this.selectedNodeData) return;
    this.copyAction();
  }

  copyAction(): void {
    this.myDiagramComponent?.diagram.commandHandler.copySelection();
    this.updatePasteState();
  }

  onCutNodes(event: any): void {
    if (this.isActionDisabled(event)) return;
    if (!this.selectedNodeData) return;
    this.cutAction();
  }

  cutAction(): void {
    this.myDiagramComponent?.diagram.commandHandler.cutSelection();
    this.updatePasteState();
  }

  updatePasteState() {
    const canPaste =
      this.myDiagramComponent?.diagram.commandHandler.canPasteSelection();
    this.menuState.pasteAction = !canPaste;
    this.cdr.detectChanges();
  }

  onPasteNodes(event: any): void {
    if (this.isActionDisabled(event)) return;
    this.myDiagramComponent?.diagram.commandHandler.pasteSelection();
  }

  onDeleteNodes(event: any): void {
    if (this.isActionDisabled(event)) return;
    if (!this.selectedNodeData) return;
    this.myDiagramComponent?.diagram.commandHandler.deleteSelection();
  }

  onToggleTextBold(event: any): void {
    if (this.isActionDisabled(event)) return;
    if (!this.selectedNodeData) return;

    // Step 1: Determine if any text is not bold
    let allBold = true;
    this.selectedNodeData.forEach((key: any) => {
      const node = this.myDiagramComponent?.diagram.findNodeForKey(key);
      let tb: any = node?.findObject('TEXT');
      if (tb && tb.font.indexOf('bold') < 0) {
        allBold = false;
      }
    });

    this.myDiagramComponent?.diagram.startTransaction('Toggle Text Bold');
    // Step 2: Apply bold or unbold based on the check
    this.selectedNodeData.forEach((key: any) => {
      const node = this.myDiagramComponent?.diagram.findNodeForKey(key);
      if (node) {
        let tb: any = node.findObject('TEXT');
        if (tb) {
          if (allBold) {
            // If all are bold, make them unbold
            tb.font = tb.font.replace('bold ', '');
          } else {
            // If any is not bold, make all bold
            if (tb.font.indexOf('bold') < 0) {
              tb.font = 'bold ' + tb.font;
            }
          }
        }
      }
    });

    this.myDiagramComponent?.diagram.commitTransaction('Toggle Text Bold');
  }

  onLayoutBoard(event: any): void {
    if (this.isActionDisabled(event)) return;
    this.layoutAll(this.myDiagramComponent?.diagram);
  }

  onResetBoard(event: any): void {
    if (this.isActionDisabled(event)) return;
    this.layoutAll(this.myDiagramComponent?.diagram);
  }

  onClearBoard(event?: any): void {
    if (this.isActionDisabled(event)) return;
    this.modalService.confirm({
      nzTitle: 'Are you sure to clear the board?',
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => {
        this.clearBoard();
      },
    });
  }

  clearBoard() {
    this.myDiagramComponent?.diagram.startTransaction('Clear Board');
    // Remove all nodes
    this.state = produce(this.state, (draft: any) => {
      draft.diagramNodeData = [];
      draft.skipsDiagramUpdate = false;
    });
    this.cdr.detectChanges();
    this.myDiagramComponent?.diagram.commitTransaction('Clear Board');
  }

  updateUndoRedoState() {
    const canUndo = this.myDiagramComponent?.diagram.commandHandler.canUndo();
    this.menuState.undoAction = !canUndo;

    const canRedo = this.myDiagramComponent?.diagram.commandHandler.canRedo();
    this.menuState.redoAction = !canRedo;

    this.cdr.detectChanges();
  }

  onUndoAction(event: any): void {
    if (this.isActionDisabled(event)) return;
    this.undoAction();
  }

  undoAction(): void {
    this.myDiagramComponent?.diagram.commandHandler.canUndo() &&
      this.myDiagramComponent?.diagram.commandHandler.undo();
    this.updateUndoRedoState();
  }

  onRedoAction(event: any): void {
    if (this.isActionDisabled(event)) return;
    this.redoAction();
  }

  redoAction(): void {
    this.myDiagramComponent?.diagram.commandHandler.canRedo() &&
      this.myDiagramComponent?.diagram.commandHandler.redo();
    this.updateUndoRedoState();
  }

  onGenerateImage(): void {
    this.modalService.confirm({
      nzTitle: 'Generate an AI image for the current board?',
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => {
        this.generateImage();
      },
    });
  }

  onImport(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        // No need clear, direct overwrite
        const data = JSON.parse(content);
        this.myDiagramComponent?.diagram.startTransaction('Import JSON');
        this.state = produce(this.state, (draft: any) => {
          draft.diagramNodeData = data;
          draft.skipsDiagramUpdate = false;
        });
        this.myDiagramComponent?.diagram.commitTransaction('Import JSON');
        this.cdr.detectChanges();
      };
      reader.readAsText(file);
    }
    this.fileInput.nativeElement.value = '';
  }

  onExport(): void {
    const blob = new Blob([JSON.stringify(this.state['diagramNodeData'])], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.room.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onToggleScrollMode(event: any): void {
    if (this.isActionDisabled(event)) return;
    if (this.myDiagramComponent) {
      const oldMode = this.myDiagramComponent.diagram.scrollMode;
      if (oldMode === go.ScrollMode.Document) {
        this.myDiagramComponent.diagram.scrollMode = go.ScrollMode.Infinite;
        this.apiService.setScrollMode(true);
        this.messageService.info('Infinite scroll mode enabled');
      } else {
        this.myDiagramComponent.diagram.scrollMode = go.ScrollMode.Document;
        this.apiService.setScrollMode(false);
        this.messageService.info('Document scroll mode enabled');
      }
    }
  }

  onCenterNode(event: any): void {
    if (this.isActionDisabled(event)) return;
    if (!this.selectedNodeData) return;
    if (
      this.myDiagramComponent?.diagram.scrollMode === go.ScrollMode.Document
    ) {
      // because document scroll will affect the animation of resetZoom
      this.myDiagramComponent?.diagram.commandHandler.resetZoom();
      this.myDiagramComponent?.diagram.commandHandler.scrollToPart();
    } else {
      this.myDiagramComponent?.diagram.commandHandler.scrollToPart();
      this.myDiagramComponent?.diagram.commandHandler.resetZoom();
    }
  }

  onZoomToFit(event: any): void {
    if (this.isActionDisabled(event)) return;
    this.myDiagramComponent?.diagram.commandHandler.zoomToFit();
  }

  emitExitRoom() {
    this.myDiagramComponent?.diagram.clear();
    this.exitRoom.emit();
  }

  emitInstruction() {
    this.modalService.create({
      nzTitle: 'Hotkeys on MindMappers',
      nzContent: InstructionModalComponent,
      nzFooter: null,
    });
  }

  onLogoClick() {
    this.modalService.create({
      nzTitle: 'About MindMappers',
      nzContent: AboutModalComponent,
      nzFooter: null,
    });
  }
}
