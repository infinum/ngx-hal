import { TestBed } from '@angular/core/testing';
import { isString } from './is-string.util';

describe('isString', () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it('should return true if a string is passed', () => {
		expect(isString('some string')).toBeTrue();
	});

	it('should return true if an empty string is passed', () => {
		expect(isString('')).toBeTrue();
	});

	it('should return true if an empty string is passed', () => {
		expect(isString(new String())).toBeTrue();
	});

	it('should return false if a number is passed', () => {
		expect(isString(3)).toBeFalse();
	});

	it('should return false if an object is passed', () => {
		expect(isString({})).toBeFalse();
	});
});
