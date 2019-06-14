export interface AttributeOptions {
  useClass?: boolean | { new(...args): any };
  transformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (raw: any) => any;
  externalName?: string;
  excludeFromPayload?: boolean;
}

export const DEFAULT_ATTRIBUTE_OPTIONS = {
  excludeFromPayload: false,
  useClass: false
};
