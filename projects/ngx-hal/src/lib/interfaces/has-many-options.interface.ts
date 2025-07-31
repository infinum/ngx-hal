import { Pagination } from '../classes/pagination';
import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface HasManyOptions<P extends Pagination> {
	itemsType: string | ModelConstructor<any, P> | ModelConstructorFn<any, P>;
	includeInPayload?: boolean;
	externalName?: string;
}

export const DEFAULT_HAS_MANY_OPTIONS = {
	includeInPayload: false,
};
