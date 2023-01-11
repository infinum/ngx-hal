import * as UriTemplates from 'uri-templates';

const UriTemplate = UriTemplates.default || UriTemplates;

export function populateTemplatedUrl(url: string, params?: object): string {
	return new UriTemplate(url).fill(params);
}
