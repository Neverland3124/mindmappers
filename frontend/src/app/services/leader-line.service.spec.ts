import { TestBed } from '@angular/core/testing';

import { LeaderLineService } from './leader-line.service';

describe('LeaderLineService', () => {
  let service: LeaderLineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaderLineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
