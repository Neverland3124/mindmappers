import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRoomModalComponent } from './create-room-modal.component';

describe('CreateRoomModalComponent', () => {
  let component: CreateRoomModalComponent;
  let fixture: ComponentFixture<CreateRoomModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRoomModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRoomModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
