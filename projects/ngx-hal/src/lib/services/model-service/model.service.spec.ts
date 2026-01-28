import { TestBed } from '@angular/core/testing';
import { Pagination } from '../../classes/pagination';
import { ModelService } from './model.service';

xdescribe('ModelService', () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it('should be created', () => {
		const service: ModelService<any, Pagination> = TestBed.inject(ModelService);
		expect(service).toBeTruthy();
	});
});
