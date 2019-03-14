export interface AttributeOptions {
  useClass?: boolean;
  transformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (rawAttribute: any) => void; // TODO implement
}

export const DEFAULT_ATTRIBUTE_OPTIONS = {
  useClass: false
};
