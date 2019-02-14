import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NetworkConfig, DEFAULT_NETWORK_CONFIG } from '../../interfaces/network-config.interface';
import { HalModel } from '../../models/hal.model';

@Injectable()
export class DatastoreService {
  public network: NetworkConfig = DEFAULT_NETWORK_CONFIG;

  constructor(public http: HttpClient) {
    console.log('v6');
  }

  public buildUrl(model?: HalModel): string {
    const urlParts: Array<string> = [
      this.network.baseUrl,
      model ? model.endpoint : null
    ];

    return urlParts.filter((urlPart) => urlPart).join('/');
  }
}
