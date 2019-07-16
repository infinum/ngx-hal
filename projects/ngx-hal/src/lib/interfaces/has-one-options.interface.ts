export interface HasOneOptions {
  externalName?: string;
  includeInPayload?: boolean;
  propertyClass?: any;
}

export const DEFAULT_HAS_ONE_OPTIONS = {
  includeInPayload: false
};
