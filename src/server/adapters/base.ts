import { Business, DiscoverySource } from '../../types';

export interface DiscoveryAdapter {
  id: DiscoverySource;
  name: string;
  discover(city: string, category: string): Promise<Partial<Business>[]>;
}
