import { RequestOptions } from '../types/request-options.type';

export interface NetworkConfig {
  baseUrl?: string;
  endpoint?: string;
  globalRequestOptions?: RequestOptions;
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  baseUrl: '/',
  endpoint: '',
  globalRequestOptions: {}
};
