import { HttpResponse } from '@angular/common/http';

export function getResponseHeader(response: HttpResponse<any>, headerName: string): any {
  const headers: object = response ? (response.headers || {}) : {};
  return headers[headerName];
}
