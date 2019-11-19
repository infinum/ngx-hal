export function makeQueryParamsString(params: object, sortAlphabetically: boolean = false): string {
  let paramKeys: Array<string> = Object.keys(params);

  if (sortAlphabetically) {
    paramKeys = paramKeys.sort();
  }

  const queryParamsString: string = paramKeys.reduce((paramsString: string, queryParamKey: string) => {
    return `${paramsString}&${queryParamKey}=${params[queryParamKey]}`;
  }, '');

  return queryParamsString.slice(1);
}
