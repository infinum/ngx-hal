export function removeQueryParams(uri: string): string {
  const splittedUri: Array<string> = uri.split('?');

  if (splittedUri.length > 1) {
    splittedUri.pop();
  }

  return splittedUri.join('');
}
