import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { HalModel } from '../models/hal.model';
import { NetworkConfig } from './network-config.interface';

export class ModelOptions {
  type: string;
  endpoint?: string;
  halDocumentClass?: HalDocumentConstructor<HalModel>;
  networkConfig?: NetworkConfig;
}

export const DEFAULT_MODEL_OPTIONS: ModelOptions = {
  type: ''
};
