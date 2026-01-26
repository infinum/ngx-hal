import * as UriTemplates from 'uri-templates';

const UriTemplate = UriTemplates.default || UriTemplates;

export function populateTemplatedUrl(
	url: string,
	params?: Record<string, string | string[]>,
): string {
	const safeUrl = url || '';
	const stringParams: Record<string, string> = {};

	if (params) {
		Object.keys(params).forEach((key: string) => {
			const value = params[key];
			stringParams[key] = Array.isArray(value) ? value.join(',') : String(value);
		});
	}

	return new UriTemplate(safeUrl).fill(stringParams);
}
