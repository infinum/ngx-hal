import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface HasOneOptions {
	externalName?: string;
	includeInPayload?: boolean;
	propertyClass: string | ModelConstructor<any> | ModelConstructorFn<any>;
}

export const DEFAULT_HAS_ONE_OPTIONS = {
	includeInPayload: false,
};
