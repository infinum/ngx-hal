import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { getResponseHeader } from './get-response-header.util';

describe('getResponseHeader', () => {
	const headers: HttpHeaders = new HttpHeaders({
		'Header-One': 'Header-One-Value',
		'Header-Two': 'Header-Two-Value',
	});
	const response: HttpResponse<null> = new HttpResponse({ headers });

	beforeEach(() => TestBed.configureTestingModule({}));

	it('should get a single header', () => {
		expect(getResponseHeader(response, 'Header-One')).toBe(headers.get('Header-One'));
	});

	it('should get a header if it is requested with wrong case', () => {
		expect(getResponseHeader(response, 'hEader-One')).toBe(headers.get('Header-One'));
	});

	it('should return null for a missing header', () => {
		expect(getResponseHeader(response, 'Does-Not-Exist')).toBe(null);
	});
});
