import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { HalModel } from '../models/hal.model';
import { NetworkConfig } from './network-config.interface';
import { Pagination } from '../classes/pagination';

export class ModelOptions<P extends Pagination> {
	type: string;
	endpoint?: string;
	halDocumentClass?: HalDocumentConstructor<HalModel<P>, P>;
	networkConfig?: NetworkConfig;
}

export const DEFAULT_MODEL_OPTIONS: ModelOptions<any> = {
	type: '',
};

export const DEFAULT_MODEL_TYPE = '__DEFAULT_MODEL_TYPE__';
