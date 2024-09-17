import { HalModel } from '../models/hal.model';
import { HalDocument } from '../classes/hal-document';
import { Pagination } from '../classes/pagination';

export type HalDocumentConstructor<T extends HalModel<P>, P extends Pagination> = {
	new (...args): HalDocument<T, P>;
};
