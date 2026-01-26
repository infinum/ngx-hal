import { HttpHeaders, HttpParams } from '@angular/common/http';

export type PlainHeaders = {
	[header: string]: string | string[];
};

export type RequestOptions = {
	headers?: HttpHeaders | PlainHeaders;
	observe?: string;
	params?: HttpParams | Record<string, unknown>;
	routeParams?: Record<string, unknown>;
	reportProgress?: boolean;
	responseType?;
	withCredentials?: boolean;
};
