import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { HalModel } from '../models/hal.model';

export class ModelOptions {
  endpoint?: string;
  halDocumentClass?: HalDocumentConstructor<HalModel>;
}

export const DEFAULT_MODEL_OPTIONS: ModelOptions = {
  // endpoint: model.constructor.toString() + 's'
};
