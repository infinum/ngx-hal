export function makeQueryParamsString(params: object, sortAlphabetically: boolean = false): string {
  let paramKeys: Array<string> = Object.keys(params);

  if (sortAlphabetically) {
    paramKeys = paramKeys.sort();
  }

  const queryParamsString: string = paramKeys.reduce((paramsString: string, queryParamKey: string) => {
    const encodedQueryParamValue: string = encodeURIComponent(params[queryParamKey]);
    console.log('encoded', encodedQueryParamValue);
    return `${paramsString}&${queryParamKey}=${encodedQueryParamValue}`;
  }, '');

  return queryParamsString.slice(1);
}
