import { HttpHeaders, HttpParams } from '@angular/common/http';

export type RequestOptions = {
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
  observe?;
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  reportProgress?: boolean;
  responseType?;
  withCredentials?: boolean;
};
