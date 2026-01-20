import { HalDocument } from '../classes/hal-document';
import { Pagination } from '../classes/pagination';
import { HalModel } from '../models/hal.model';

export type HalDocumentConstructor<T extends HalModel<P>, P extends Pagination> = {
	new (...args: Array<any>): HalDocument<T, P>;
};
