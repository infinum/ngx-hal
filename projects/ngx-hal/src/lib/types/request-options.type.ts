import { HttpHeaders, HttpParams } from '@angular/common/http';

export type PlainHeaders = {
	[header: string]: string | string[];
};

export type RequestOptions = {
	headers?: HttpHeaders | PlainHeaders;
	observe?;
	params?:
		| HttpParams
		| {
				[param: string]: string | string[];
		  }
		| object;
	reportProgress?: boolean;
	responseType?;
	withCredentials?: boolean;
};
