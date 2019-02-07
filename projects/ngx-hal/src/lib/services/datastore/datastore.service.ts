import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NetworkConfig, DEFAULT_NETWORK_CONFIG } from '../../interfaces/network-config.interface';

@Injectable()
export class DatastoreService {
  public network: NetworkConfig = DEFAULT_NETWORK_CONFIG;

  constructor(public http: HttpClient) {
    console.log('v4');
  }

  public buildUrl(): string {
    return this.network.baseUrl;
  }
}
