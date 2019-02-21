import { HalModel } from '../models/hal.model';
import { HalDocument } from '../classes/hal-document';

export type HalDocumentConstructor<T extends HalModel> = {new(...args): HalDocument<T> };
