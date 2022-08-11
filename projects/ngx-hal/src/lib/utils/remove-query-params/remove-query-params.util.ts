export function removeQueryParams(uri: string): string {
	const splittedUri: Array<string> = hasOnlyTemplatedQueryParameters(uri)
		? uri.split('{?')
		: uri.split('?');

	if (splittedUri.length > 1) {
		splittedUri.pop();
	}

	return splittedUri.join('');
}

function hasOnlyTemplatedQueryParameters(uri: string): boolean {
	return uri.indexOf('{?') !== -1;
}
