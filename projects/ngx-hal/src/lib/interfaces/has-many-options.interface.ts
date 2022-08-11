import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface HasManyOptions {
	itemsType: string | ModelConstructor<any> | ModelConstructorFn<any>;
	includeInPayload?: boolean;
	externalName?: string;
}

export const DEFAULT_HAS_MANY_OPTIONS = {
	includeInPayload: false,
};
