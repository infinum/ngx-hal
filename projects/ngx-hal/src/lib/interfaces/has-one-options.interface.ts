import { Pagination } from '../classes/pagination';
import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface HasOneOptions<P extends Pagination> {
	externalName?: string;
	includeInPayload?: boolean;
	propertyClass: string | ModelConstructor<any, P> | ModelConstructorFn<any, P>;
}

export const DEFAULT_HAS_ONE_OPTIONS = {
	includeInPayload: false,
};
