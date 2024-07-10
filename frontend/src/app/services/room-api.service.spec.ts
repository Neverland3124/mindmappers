import { TestBed } from '@angular/core/testing';

import { RoomApiService } from './room-api.service';

describe('RoomApiService', () => {
  let service: RoomApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
