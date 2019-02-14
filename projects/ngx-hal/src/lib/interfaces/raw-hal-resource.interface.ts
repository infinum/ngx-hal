import { LINKS_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME } from '../constants/hal.constant';
import { RawHalLinks } from './raw-hal-links.interface';

export interface RawHalResource {
  [attributeName: string]: any;
  [LINKS_PROPERTY_NAME]?: RawHalLinks;
  [EMBEDDED_PROPERTY_NAME]?: object;
}
