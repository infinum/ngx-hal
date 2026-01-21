import * as UriTemplates from 'uri-templates';

const UriTemplate = UriTemplates.default || UriTemplates;

export function populateTemplatedUrl(
	url: string,
	params?: Record<string, string | string[]>,
): string {
	const safeUrl = url || '';
	return new UriTemplate(safeUrl).fill(params);
}
