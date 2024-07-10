import { TestBed } from '@angular/core/testing';

import { ObjectApiService } from './object-api.service';

describe('ObjectApiService', () => {
  let service: ObjectApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
