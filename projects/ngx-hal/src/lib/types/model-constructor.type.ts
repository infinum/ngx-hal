import { HalModel } from '../models/hal.model';

export type ModelConstructor<T extends HalModel> = {new(...args): T };
