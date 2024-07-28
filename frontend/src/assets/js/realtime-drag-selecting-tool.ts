// Code get from gojs official website with some modifications
import * as go from 'gojs';

export class RealtimeDragSelectingTool extends go.DragSelectingTool {
  private _originalSelection: go.Set<go.Part>;
  private _temporarySelection: go.Set<go.Part>;

  constructor(init?: Partial<RealtimeDragSelectingTool>) {
    super();
    this.name = 'RealtimeDragSelecting';
    this._originalSelection = new go.Set();
    this._temporarySelection = new go.Set();
    if (init) Object.assign(this, init);
  }

  override doActivate() {
    super.doActivate();
    this._originalSelection = this.diagram.selection.copy();
    this._temporarySelection.clear();
    this.diagram.raiseDiagramEvent('ChangingSelection');
  }

  override doDeactivate() {
    this.diagram.raiseDiagramEvent('ChangedSelection');
    this._originalSelection.clear();
    this._temporarySelection.clear();
    super.doDeactivate();
  }

  override doCancel() {
    const orig = this._originalSelection;
    orig.each((p) => (p.isSelected = true));
    this._temporarySelection.each((p) => {
      if (!orig.has(p)) p.isSelected = false;
    });
    super.doCancel();
  }

  override doMouseMove() {
    if (this.isActive) {
      super.doMouseMove();
      this.selectInRect(this.computeBoxBounds());
    }
  }

  override doKeyDown() {
    if (this.isActive) {
      super.doKeyDown();
      this.selectInRect(this.computeBoxBounds());
    }
  }

  override doKeyUp() {
    if (this.isActive) {
      super.doKeyUp();
      this.selectInRect(this.computeBoxBounds());
    }
  }

  override selectInRect(r: go.Rect) {
    const diagram = this.diagram;
    const orig = this._originalSelection;
    const temp = this._temporarySelection;
    const e = diagram.lastInput;
    const found = diagram.findPartsIn(r, this.isPartialInclusion);

    if (e.control || e.meta) {
      if (e.shift) {
        temp.each((p) => {
          if (!found.has(p)) p.isSelected = orig.has(p);
        });
        found.each((p) => {
          p.isSelected = false;
          temp.add(p);
        });
      } else {
        temp.each((p) => {
          if (!found.has(p)) p.isSelected = orig.has(p);
        });
        found.each((p) => {
          p.isSelected = !orig.has(p);
          temp.add(p);
        });
      }
    } else if (e.shift) {
      temp.each((p) => {
        if (!found.has(p)) p.isSelected = orig.has(p);
      });
      found.each((p) => {
        p.isSelected = true;
        temp.add(p);
      });
    } else {
      temp.each((p) => {
        if (!found.has(p)) p.isSelected = false;
      });
      orig.each((p) => {
        if (!found.has(p)) p.isSelected = false;
      });
      found.each((p) => {
        p.isSelected = true;
        temp.add(p);
      });
    }
  }
}
