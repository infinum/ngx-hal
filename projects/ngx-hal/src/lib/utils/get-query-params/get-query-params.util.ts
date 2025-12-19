export function getQueryParams(url: string): object {
	const queryParams: object = {};
	const parser: HTMLAnchorElement = document.createElement('a');
	parser.href = url;

	const query: string = parser.search.substring(1);

	if (!query) {
		return {};
	}

	const params: Array<string> = query.split('&');

	params.forEach((param: string) => {
		const [key, value] = param.split('=');
		const paramValue = value || '';

		if (queryParams[key]) {
			queryParams[key] = [decodeURIComponentWithErrorHandling(paramValue)].concat(queryParams[key]);
		} else {
			const items: Array<string> = paramValue.split(',');
			if (items.length === 1) {
				queryParams[key] = decodeURIComponentWithErrorHandling(paramValue);
			} else {
				queryParams[key] = items.map((urlParam: string) =>
					decodeURIComponentWithErrorHandling(urlParam),
				);
			}
		}
	});

	return queryParams;
}

export function decodeURIComponentWithErrorHandling(value: string): string {
	if (!value) {
		return value;
	}
	try {
		return decodeURIComponent(value);
	} catch (e) {
		console.error(e);
		return value;
	}
}
