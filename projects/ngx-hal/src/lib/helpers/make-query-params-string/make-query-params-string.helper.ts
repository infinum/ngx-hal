export function makeQueryParamsString(
	params: Record<string, string | string[]>,
	sortAlphabetically: boolean = false,
): string {
	let paramKeys: Array<string> = Object.keys(params);

	if (sortAlphabetically) {
		paramKeys = paramKeys.sort();
	}

	const queryParamsString: string = paramKeys.reduce(
		(paramsString: string, queryParamKey: string) => {
			const value = params[queryParamKey];
			const stringValue = Array.isArray(value) ? value.join(',') : String(value);

			return `${paramsString}&${queryParamKey}=${stringValue}`;
		},
		'',
	);

	return queryParamsString.slice(1);
}
