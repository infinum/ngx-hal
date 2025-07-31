import { TestBed } from '@angular/core/testing';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../../services/datastore/datastore.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SimpleHalModel } from '../../models/simple-hal.model';
import { isSimpleHalModelInstance } from './is-simple-hal-model-instance.helper';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

class InheritsHal extends HalModel {}
class InheritsSimpleHal extends SimpleHalModel {}
class DoesNotInherit {}

describe('isSimpleHalModelInstance', () => {
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

	it('should return true for an instance of a class which extends SimpleHalModel', () => {
		const instance: InheritsSimpleHal = new InheritsSimpleHal();
		expect(isSimpleHalModelInstance(instance)).toBe(true);
	});

	it('should return false for an instance of a class which extends HalModel', () => {
		const datastoreService: DatastoreService = TestBed.inject(DatastoreService);
		const instance: InheritsHal = new InheritsHal({}, datastoreService);
		expect(isSimpleHalModelInstance(instance)).toBe(false);
	});

	it('should return false for an instance of a class which does not extend SimpleHalModel', () => {
		const instance: DoesNotInherit = new DoesNotInherit();
		expect(isSimpleHalModelInstance(instance)).toBe(false);
	});

	it('should return false for a string', () => {
		expect(isSimpleHalModelInstance('notHal')).toBe(false);
	});

	it('should return false for an object', () => {
		expect(isSimpleHalModelInstance({})).toBe(false);
	});

	it('should return false for a number', () => {
		expect(isSimpleHalModelInstance(1)).toBe(false);
	});
});
