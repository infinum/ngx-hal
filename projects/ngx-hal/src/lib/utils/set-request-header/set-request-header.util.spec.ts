import { HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PlainHeaders } from '../../types/request-options.type';
import { setRequestHeader } from './set-request-header.util';

describe('setRequestHeader', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should set a new header out of an object', () => {
    const initialHeaders = { oldHeader: 'oldHeader' };
    const newHeaders: PlainHeaders = setRequestHeader(initialHeaders, 'newHeader', 'something');

    expect(newHeaders.newHeader).toBeDefined();
    expect(newHeaders.oldHeader).toBeDefined();
  });

  it('should not modify an existing headers object when adding a new header', () => {
    const initialHeaders = { oldHeader: 'oldHeader' };
    setRequestHeader(initialHeaders, 'newHeader', 'something');

    expect(initialHeaders.oldHeader).toBeDefined();
    expect(initialHeaders['newHeaders']).not.toBeDefined();
  });

  it('should set a new header out of a HttpHeader', () => {
    const initialHeaders = new HttpHeaders({ oldHeader: 'oldHeader' });
    const newHeaders: HttpHeaders = setRequestHeader(initialHeaders, 'newHeader', 'something');

    expect(newHeaders.get('newHeader')).toBeDefined();
    expect(newHeaders.get('oldHeader')).toBeDefined();
  });
});
