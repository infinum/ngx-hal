import { Pagination } from '../classes/pagination';
import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface HeaderAttributeOptions<P extends Pagination> {
	useClass?: boolean | ModelConstructor<any, P> | ModelConstructorFn<any, P>;
	transformResponseValue?: (rawAttribute: any) => any;
	transformBeforeSave?: (raw: any) => any;
	externalName?: string;
}

export const DEFAULT_HEADER_ATTRIBUTE_OPTIONS = {
	useClass: false,
};
