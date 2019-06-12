import { HttpResponse, HttpHeaders } from '@angular/common/http';

export function getResponseHeader(response: HttpResponse<any>, headerName: string): any {
  const emptyHeaders: HttpHeaders = new HttpHeaders();
  const headers: HttpHeaders = response ? (response.headers || emptyHeaders) : emptyHeaders;
  return headers.get(headerName);
}
