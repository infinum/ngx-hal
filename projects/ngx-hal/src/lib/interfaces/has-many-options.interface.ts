import { ModelConstructor } from '../types/model-constructor.type';

export interface HasManyOptions {
  itemsType: ModelConstructor<any>;
  includeInPayload?: boolean;
  externalName?: string;
}

export const DEFAULT_HAS_MANY_OPTIONS = {
  includeInPayload: false
};
