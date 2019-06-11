export interface HasOneOptions {
  externalName?: string;
  includeInPayload?: boolean;
}

export const DEFAULT_HAS_ONE_OPTIONS = {
  includeInPayload: false
};
