import { TestBed } from '@angular/core/testing';

import { ModelService } from './model.service';

xdescribe('ModelService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ModelService<any> = TestBed.get(ModelService);
    expect(service).toBeTruthy();
  });
});
