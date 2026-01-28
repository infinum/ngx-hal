import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Pagination } from '../../classes/pagination';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../../services/datastore/datastore.service';
import { isHalModelInstance } from './is-hal-model-instance.helper';

class InheritsHal extends HalModel<Pagination> {}
class DoesNotInherit {}

describe('isHalModelInstance', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			imports: [],
			providers: [
				DatastoreService,
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			],
		}),
	);

	it('should return true for an instance of a class which extends HalModel', () => {
		const datastoreService: DatastoreService<Pagination> = TestBed.inject(DatastoreService);
		const instance: InheritsHal = new InheritsHal({}, datastoreService);
		expect(isHalModelInstance(instance)).toBe(true);
	});

	it('should return false for an instance of a class which does not extend HalModel', () => {
		const instance: DoesNotInherit = new DoesNotInherit();
		expect(isHalModelInstance(instance)).toBe(false);
	});

	it('should return false for a string', () => {
		expect(isHalModelInstance('notHal')).toBe(false);
	});

	it('should return false for an object', () => {
		expect(isHalModelInstance({})).toBe(false);
	});

	it('should return false for a number', () => {
		expect(isHalModelInstance(1)).toBe(false);
	});
});
