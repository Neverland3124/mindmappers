import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingDivComponent } from './floating-div.component';

describe('FloatingDivComponent', () => {
  let component: FloatingDivComponent;
  let fixture: ComponentFixture<FloatingDivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingDivComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingDivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
