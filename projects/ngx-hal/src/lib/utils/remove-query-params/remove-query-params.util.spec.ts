import { TestBed } from '@angular/core/testing';
import { removeQueryParams } from './remove-query-params.util';

describe('removeQueryParams', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should not change the input if there is not query params', () => {
    const input = 'http://www.test.com';
    const output: string = removeQueryParams(input);
    expect(output).toBe(input);
  });

  it('should remove everything after a question mark', () => {
    const input = 'http://www.test.com?first_param=1';
    const output: string = removeQueryParams(input);
    expect(output).toBe('http://www.test.com');
  });

  it('should remove all query params', () => {
    const input = 'http://www.test.com?first_param=1&second=2';
    const output: string = removeQueryParams(input);
    expect(output).toBe('http://www.test.com');
  });
});
