import { TestBed } from '@angular/core/testing';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../../services/datastore/datastore.service';
import { isHalModelInstance } from './is-hal-model-instance.helper';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class InheritsHal extends HalModel {}
class DoesNotInherit {}

describe('isHalModelInstance', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [DatastoreService],
		}),
	);

	it('should return true for an instance of a class which extends HalModel', () => {
		const datastoreService: DatastoreService = TestBed.inject(DatastoreService);
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
