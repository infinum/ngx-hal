import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface AttributeOptions {
  useClass?: boolean | ModelConstructor<any> | ModelConstructorFn<any>;
  transformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (raw: any) => any;
  externalName?: string;
  excludeFromPayload?: boolean;
}

export const DEFAULT_ATTRIBUTE_OPTIONS = {
  excludeFromPayload: false,
  useClass: false,
};
