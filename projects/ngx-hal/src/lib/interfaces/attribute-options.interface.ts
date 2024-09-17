import { Pagination } from '../classes/pagination';
import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface AttributeOptions<P extends Pagination> {
	useClass?: string | ModelConstructor<any, P> | ModelConstructorFn<any, P>;
	transformResponseValue?: (rawAttribute: any) => any;
	transformBeforeSave?: (raw: any) => any;
	externalName?: string;
	excludeFromPayload?: boolean;
}

export const DEFAULT_ATTRIBUTE_OPTIONS = {
	excludeFromPayload: false,
	useClass: false,
};
