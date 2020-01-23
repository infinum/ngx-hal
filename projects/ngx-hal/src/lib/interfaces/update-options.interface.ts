export interface UpdateOptions<T> {
  buildUrlFunction?: (model: T, urlFromModel: string) => string;
  transformPayloadBeforeSave?: (payload: object) => object;
  specificFields?: Array<string>;
}
