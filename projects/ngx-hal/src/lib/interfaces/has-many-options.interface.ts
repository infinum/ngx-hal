import { ModelConstructor } from '../types/model-constructor.type';

export interface HasManyOptions {
  itemsType: ModelConstructor<any>;
  includeInPayload?: boolean;
}

export const DEFAULT_HAS_MANY_OPTIONS = {
  includeInPayload: false
};
