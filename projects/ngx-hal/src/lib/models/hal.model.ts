import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';

export abstract class HalModel {
  private config: ModelOptions = DEFAULT_MODEL_OPTIONS;

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }
}
