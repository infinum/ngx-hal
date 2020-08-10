import { Logger as LoggerEnum } from '../enums/logger.enum';

export class Logger {
  constructor(private logLevel: LoggerEnum = LoggerEnum.NONE) {}

  log(...args) {
    if (this.logLevel === LoggerEnum.ALL) {
      console.log(args);
    }
  }

  warn(...args) {
    if (this.logLevel === LoggerEnum.WARNINGS || this.logLevel === LoggerEnum.ALL) {
      console.warn(args);
    }
  }
}
