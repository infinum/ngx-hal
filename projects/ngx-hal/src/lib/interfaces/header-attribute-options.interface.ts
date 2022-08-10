import { ModelConstructor, ModelConstructorFn } from '../types/model-constructor.type';

export interface HeaderAttributeOptions {
  useClass?: boolean | ModelConstructor<any> | ModelConstructorFn<any>;
  transformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (raw: any) => any;
  externalName?: string;
}

export const DEFAULT_HEADER_ATTRIBUTE_OPTIONS = {
  useClass: false
};
