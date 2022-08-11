import { HttpParams } from '@angular/common/http';

export function makeHttpParams(params: object, httpParamsOptions?: object): HttpParams {
	let httpParams: HttpParams = new HttpParams(httpParamsOptions);

	Object.keys(params).forEach((paramKey: string) => {
		httpParams = httpParams.append(paramKey, params[paramKey]);
	});

	return httpParams;
}
