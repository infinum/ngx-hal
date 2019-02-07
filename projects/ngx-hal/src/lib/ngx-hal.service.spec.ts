import { TestBed } from '@angular/core/testing';

import { NgxHalService } from './ngx-hal.service';

describe('NgxHalService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxHalService = TestBed.get(NgxHalService);
    expect(service).toBeTruthy();
  });
});
