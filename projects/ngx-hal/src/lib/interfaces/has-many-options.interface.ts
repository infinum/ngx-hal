import { ModelConstructor } from '../types/model-constructor.type';

export interface HasManyOptions {
  itemsType: ModelConstructor<any>;
}

export const DEFAULT_HAS_MANY_OPTIONS = {};
