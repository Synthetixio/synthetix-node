import { ConfigSchema } from './config';
import config from '../config.json';

ConfigSchema.parse(config);
