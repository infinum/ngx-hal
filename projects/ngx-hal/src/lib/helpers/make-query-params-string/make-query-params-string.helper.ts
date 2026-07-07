export function makeQueryParamsString(params: object, sortAlphabetically: boolean = false): string {
	let paramKeys: Array<string> = Object.keys(params);

	if (sortAlphabetically) {
		paramKeys = paramKeys.sort();
	}

	const queryParamsString: string = paramKeys.reduce(
		(paramsString: string, queryParamKey: string) => {
			const paramValue: string | Array<string> = params[queryParamKey];
			const encodedValue: string = Array.isArray(paramValue)
				? paramValue.map((item: string) => encodeURIComponent(item)).join(',')
				: encodeURIComponent(String(paramValue));

			return `${paramsString}&${queryParamKey}=${encodedValue}`;
		},
		'',
	);

	return queryParamsString.slice(1);
}
