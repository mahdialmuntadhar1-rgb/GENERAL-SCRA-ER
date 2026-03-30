import { CanonicalBusinessRecord, ProviderConfig, SourceSelectorOptions } from '../../../types';

export interface SearchInput {
  city: string;
  category: string;
  subcategory?: string;
  district?: string;
  maxResults: number;
}

export interface ProviderConnector {
  config: ProviderConfig;
  searchBusinesses(input: SearchInput): Promise<Partial<CanonicalBusinessRecord>[]>;
  enrichBusiness(record: CanonicalBusinessRecord): Promise<CanonicalBusinessRecord>;
  validateRecord(record: CanonicalBusinessRecord, options: SourceSelectorOptions): Promise<CanonicalBusinessRecord>;
  mapToCanonicalSchema(record: Partial<CanonicalBusinessRecord>): CanonicalBusinessRecord;
}
