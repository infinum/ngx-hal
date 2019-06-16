import { TestBed } from '@angular/core/testing';
import { isArray } from './is-array.util';

describe('isArray', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should return true if array is passed', () => {
    const input: Array<any> = [1, 2, 3, undefined, false];
    expect(isArray(input)).toBe(true);
  });

  it('should return true if an empty array is passed', () => {
    const input: Array<any> = [];
    expect(isArray(input)).toBe(true);
  });

  it('should return false if string is passed', () => {
    expect(isArray('test')).toBe(false);
  });

  it('should return false if null is passed', () => {
    expect(isArray(null)).toBe(false);
  });

  it('should return false if undefined is passed', () => {
    expect(isArray(undefined)).toBe(false);
  });

  it('should return false if number is passed', () => {
    expect(isArray(2)).toBe(false);
  });

  it('should return false if object is passed', () => {
    expect(isArray({ test: 1 })).toBe(false);
  });
});
