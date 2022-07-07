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

    if (queryParams[key]) {
      queryParams[key] = [decodeURIComponentWithErrorHandling(value)].concat(queryParams[key]);
    } else {
      const items: Array<string> = value.split(',');
      if (items.length === 1) {
        queryParams[key] = decodeURIComponentWithErrorHandling(value);
      } else {
        queryParams[key] = items.map((urlParam: string) => decodeURIComponentWithErrorHandling(urlParam));
      }
    }
  });

  return queryParams;
}

export function decodeURIComponentWithErrorHandling(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    console.error(e);
    return value;
  }
}
