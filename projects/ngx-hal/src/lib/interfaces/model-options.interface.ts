import { Pagination } from '../classes/pagination';
import { HalModel } from '../models/hal.model';
import { HalDocumentConstructor } from '../types/hal-document-constructor.type';
import { NetworkConfig } from './network-config.interface';

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
