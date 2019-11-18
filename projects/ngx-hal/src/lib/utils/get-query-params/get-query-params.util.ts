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
    queryParams[key] = decodeURIComponent(value);
  });

  return queryParams;
}
