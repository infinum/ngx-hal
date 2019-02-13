import { LINKS_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME } from '../constants/hal.constant';

export interface RawHalResource {
  [attributeName: string]: any;
  [LINKS_PROPERTY_NAME]?: object;
  [EMBEDDED_PROPERTY_NAME]?: object;
}
