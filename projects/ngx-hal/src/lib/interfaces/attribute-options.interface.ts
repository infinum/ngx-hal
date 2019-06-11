export interface AttributeOptions {
  useClass?: boolean | { new(...args): any };
  transformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (raw: any) => any;
  externalName?: string;
}

export const DEFAULT_ATTRIBUTE_OPTIONS = {
  useClass: false
};
