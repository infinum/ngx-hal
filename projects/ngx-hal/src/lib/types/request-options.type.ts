import { HttpHeaders, HttpParams } from '@angular/common/http';

export type PlainHeaders = {
	[header: string]: string | string[];
};

export type RequestOptions = {
	headers?: HttpHeaders | PlainHeaders;
	observe?: string;
	params?: HttpParams | Record<string, string | string[]>;
	routeParams?: Record<string, string | string[]>;
	reportProgress?: boolean;
	responseType?;
	withCredentials?: boolean;
};
