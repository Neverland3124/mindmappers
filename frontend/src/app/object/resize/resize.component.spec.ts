import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResizeComponent } from './resize.component';

describe('ResizeComponent', () => {
  let component: ResizeComponent;
  let fixture: ComponentFixture<ResizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
