import { HttpParams } from '@angular/common/http';

export function makeHttpParams(
	params: Record<string, string | string[]>,
	httpParamsOptions?: Record<string, unknown>,
): HttpParams {
	let httpParams: HttpParams = new HttpParams(httpParamsOptions);

	Object.keys(params).forEach((paramKey: string) => {
		const paramValue = params[paramKey];

		if (Array.isArray(paramValue)) {
			httpParams = httpParams.append(paramKey, paramValue.join(','));
		} else {
			httpParams = httpParams.append(paramKey, paramValue);
		}
	});

	return httpParams;
}
