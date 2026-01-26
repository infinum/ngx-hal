export interface CustomOptions<T> {
	buildUrlFunction?: (model: T, urlFromModel: string) => string;
	transformPayloadBeforeSave?: (payload: Record<string, unknown>) => unknown;
	specificFields?: Array<string>;
}
