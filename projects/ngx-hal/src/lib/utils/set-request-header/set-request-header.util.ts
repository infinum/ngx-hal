import { HttpHeaders } from '@angular/common/http';
import { PlainHeaders } from '../../types/request-options.type';

export function setRequestHeader<HttpHeaders>(
  initialHeaders: HttpHeaders,
  headerName: string,
  headerValue: string | Array<string>
): HttpHeaders;
export function setRequestHeader<PlainHeaders>(
  initialHeaders: PlainHeaders,
  headerName: string,
  headerValue: string | Array<string>
): PlainHeaders;
export function setRequestHeader(
  initialHeaders: HttpHeaders | PlainHeaders,
  headerName: string,
  headerValue: string | Array<string>
): HttpHeaders | PlainHeaders {
  if (initialHeaders instanceof HttpHeaders) {
    return setHttpRequestHeader(initialHeaders, headerName, headerValue);
  }

  return setObjectRequestHeader(initialHeaders, headerName, headerValue);
}

function setHttpRequestHeader(
  initialHeaders: HttpHeaders,
  headerName: string,
  headerValue: string | Array<string>
): HttpHeaders {
  if (headerValue !== undefined && headerValue !== null) {
    return initialHeaders.append(headerName, headerValue);
  }

  return initialHeaders;
}

function setObjectRequestHeader(
  initialHeaders: PlainHeaders,
  headerName: string,
  headerValue: string | Array<string>
): PlainHeaders {
  const headers: PlainHeaders = {};

  Object.assign(headers, initialHeaders);

  if (headerValue !== undefined && headerValue !== null) {
    headers[headerName] = headerValue;
  }

  return headers;
}
