import { encodeQueryParams } from '../../utils/encode-query-params/encode-query-params.utils';

export function makeQueryParamsString(params: object, sortAlphabetically: boolean = false): string {
  const encodedParams: object = encodeQueryParams(params);
  let paramKeys: Array<string> = Object.keys(encodedParams);

  if (sortAlphabetically) {
    paramKeys = paramKeys.sort();
  }

  const queryParamsString: string = paramKeys.reduce((paramsString: string, queryParamKey: string) => {
    return `${paramsString}&${queryParamKey}=${encodedParams[queryParamKey]}`;
  }, '');

  return queryParamsString.slice(1);
}
