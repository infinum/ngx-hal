import { Pagination } from '../classes/pagination';
import { HalModel } from '../models/hal.model';

export type ModelConstructor<T extends HalModel<P>, P extends Pagination> = { new (...args): T };
export type ModelConstructorFn<T extends HalModel<P>, P extends Pagination> = (
	rawPropertyValue: any,
) => ModelConstructor<T, P>;
