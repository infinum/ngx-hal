export interface HeaderAttributeOptions {
  useClass?: boolean | { new(...args): any };
  transformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (raw: any) => any;
  externalName?: string;
}

export const DEFAULT_HEADER_ATTRIBUTE_OPTIONS = {
  useClass: false
};
