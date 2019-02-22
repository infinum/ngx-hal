import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { HalModel } from '../models/hal.model';

export class ModelServiceOptions {
  halDocumentClass?: HalDocumentConstructor<HalModel>;
}
