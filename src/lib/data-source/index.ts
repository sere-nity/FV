import { DataSource } from './types';
import { MockSource } from './mock';
import { FanvueSource } from './fanvue';

export type { DataSource, ChatMessage, FanProfile } from './types';
export { MockSource } from './mock';
export { FanvueSource } from './fanvue';

/**
 * Get the configured data source based on environment variable
 */
export function getDataSource(): DataSource {
  const source = process.env.DATA_SOURCE || 'mock';

  switch (source) {
    case 'mock':
      return new MockSource();
    case 'fanvue':
      return new FanvueSource();
    default:
      console.warn(`Unknown DATA_SOURCE: ${source}, falling back to mock`);
      return new MockSource();
  }
}
