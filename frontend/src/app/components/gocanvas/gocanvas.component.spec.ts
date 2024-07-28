import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoCanvasComponent } from './gocanvas.component';

describe('GoCanvasComponent', () => {
  let component: GoCanvasComponent;
  let fixture: ComponentFixture<GoCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoCanvasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GoCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
