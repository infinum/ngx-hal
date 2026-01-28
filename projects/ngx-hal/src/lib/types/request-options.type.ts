import { HttpHeaders, HttpParams } from '@angular/common/http';

export type PlainHeaders = {
	[header: string]: string | string[];
};

export type RequestOptions = {
	headers?: HttpHeaders | PlainHeaders;
	observe?: string;
	params?:
		| HttpParams
		| {
				[param: string]: string | string[];
		  }
		| object;
	routeParams?: {
		[param: string]: string | string[];
	};
	reportProgress?: boolean;
	responseType?;
	withCredentials?: boolean;
};
