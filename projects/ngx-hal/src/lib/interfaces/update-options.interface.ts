export interface UpdateOptions<T> {
  buildUrlFunction?: (model: T, urlFromModel: string) => string;
  specificFields?: Array<string>;
}
