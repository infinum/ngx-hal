import { RequestOptions } from '../types/request-options.type';

export interface RequestsOptions {
  mainRequest: RequestOptions;
  subsequentRequests?: {
    [K: string]: string
  } | RequestOptions;
}
