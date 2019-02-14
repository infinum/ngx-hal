export interface NetworkConfig {
  baseUrl: string;
  endpoint?: string;
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  baseUrl: '/',
  endpoint: ''
};
