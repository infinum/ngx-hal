import { getQueryParams } from './get-query-params.util';

describe('getQueryParams', () => {
	it('should return an empty object in empty string is passed in', () => {
		const result = getQueryParams('');
		expect(result).toEqual({});
	});

	it('should return an empty object if there is no query params in the provided URL', () => {
		const result = getQueryParams('test.com');
		expect(result).toEqual({});
	});

	it('should return an object with single parameter if one parameter is passed through URL', () => {
		const result = getQueryParams('test.com?firstParameter=animal');
		expect(result).toEqual({
			firstParameter: 'animal',
		});
	});

	it('should return an object with two parameters if two parameters are passed through URL', () => {
		const result = getQueryParams('test.com?firstParameter=animal&secondParam=toy');
		expect(result).toEqual({
			firstParameter: 'animal',
			secondParam: 'toy',
		});
	});

	it('should return string values for numbers extracted from the URL', () => {
		const result = getQueryParams('test.com?firstParameter=1');
		expect(result).toEqual({
			firstParameter: '1',
		});
	});

	it('should properly decode query parameter', () => {
		const result = getQueryParams('test.com?firstParameter=%2Fanimal%2Ffarm');
		expect(result).toEqual({
			firstParameter: '/animal/farm',
		});
	});

	it('should fallback to the original value of a query parameter if decoding is not possible', () => {
		spyOn(console, 'error').and.stub();
		const result = getQueryParams('test.com?firstParameter=%E0%A4%A');
		expect(result).toEqual({
			firstParameter: '%E0%A4%A',
		});
	});

	it('should return array values for the parameters with more than one value passed as a string divided with commas', () => {
		const parameterName = 'firstParameter';
		const result = getQueryParams(`test.com?${parameterName}=animal,toy,plane`);
		expect(Object.keys(result).length).toBe(1);
		expect(result[parameterName].sort()).toEqual(['animal', 'toy', 'plane'].sort());
	});

	it('should return array values for the parameters with more than one value passed as multiple occurances of the same parameter', () => {
		const parameterName = 'firstParameter';
		const result = getQueryParams(
			`test.com?${parameterName}=animal&firstParameter=toy&firstParameter=plane`,
		);
		expect(Object.keys(result).length).toBe(1);
		expect(result[parameterName].sort()).toEqual(['animal', 'toy', 'plane'].sort());
	});

	it('should properly decode an array query parameter passed as a string divided with commas', () => {
		const parameterName = 'firstParameter';
		const result = getQueryParams(`test.com?${parameterName}=animal%2F,toy,plane`);
		expect(Object.keys(result).length).toBe(1);
		expect(result[parameterName].sort()).toEqual(['animal/', 'toy', 'plane'].sort());
	});

	it('should properly decode an array query parameter passed as multiple occurances of the same parameter', () => {
		const parameterName = 'firstParameter';
		const result = getQueryParams(
			`test.com?firstParameter=animal&${parameterName}=toy%2F&firstParameter=plane`,
		);
		expect(Object.keys(result).length).toBe(1);
		expect(result[parameterName].sort()).toEqual(['animal', 'toy/', 'plane'].sort());
	});
});
