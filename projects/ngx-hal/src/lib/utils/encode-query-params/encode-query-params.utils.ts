export function encodeQueryParams(rawParams: object): object {
  const encodedParams: object = {};

  Object.keys(rawParams).reduce((params: object, paramKey: string) => {
    params[paramKey] = encodeURIComponent(rawParams[paramKey]);
    return params;
  }, encodedParams);

  return encodedParams;
}
