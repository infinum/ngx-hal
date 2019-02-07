import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NetworkConfig, DEFAULT_NETWORK_CONFIG } from '../../interfaces/network-config.interface';

@Injectable()
export class DatastoreService {
  public network: NetworkConfig = DEFAULT_NETWORK_CONFIG;

  constructor(protected http: HttpClient) {
    console.log('v4');
  }

  private buildUrl(): string {
    return this.network.baseUrl;
  }
}
