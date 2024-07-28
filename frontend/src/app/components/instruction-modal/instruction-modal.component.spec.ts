import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructionModalComponent } from './instruction-modal.component';

describe('InstructionModalComponent', () => {
  let component: InstructionModalComponent;
  let fixture: ComponentFixture<InstructionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
