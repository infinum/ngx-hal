import { HalModel } from '../models/hal.model';

export type ModelConstructor<T extends HalModel> = { new(...args): T };
export type ModelConstructorFn<T extends HalModel> = (rawPropertyValue: any) => ModelConstructor<T>;
