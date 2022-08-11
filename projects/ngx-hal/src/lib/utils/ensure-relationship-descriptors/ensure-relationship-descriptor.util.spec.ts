import { ensureRelationshipRequestDescriptors } from './ensure-relationship-descriptors.util';

describe('ensureRelationshipRequestDescriptors', () => {
	it('should an empty array if an empty array is passed in', () => {
		const result = ensureRelationshipRequestDescriptors([]);
		expect(result).toEqual([]);
	});

	it('should return an array with single element is one element is passed in', () => {
		const result = ensureRelationshipRequestDescriptors(['user']);
		const expectedResult = [{ name: 'user' }];
		expect(result).toEqual(expectedResult);
	});

	it('should return a new array with the same elements if relationship descriptors are passed in', () => {
		const result = ensureRelationshipRequestDescriptors([
			{ name: 'user' },
			{ name: 'toys', options: { params: { a: 'c' } } },
		]);
		const expectedResult = [{ name: 'user' }, { name: 'toys', options: { params: { a: 'c' } } }];
		expect(result).toEqual(expectedResult);
	});

	it('should enrich only the elements which do not meet relationship request descriptor needs', () => {
		const result = ensureRelationshipRequestDescriptors([
			{ name: 'user' },
			'animal',
			{ name: 'toys', options: { params: { a: 'c' } } },
		]);
		const expectedResult = [
			{ name: 'user' },
			{ name: 'animal' },
			{ name: 'toys', options: { params: { a: 'c' } } },
		];
		expect(result).toEqual(expectedResult);
	});
});
