import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteModalComponent } from './modal.component';

describe('InviteModalComponent', () => {
  let component: InviteModalComponent;
  let fixture: ComponentFixture<InviteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
