import { Business } from "../../types";
import { DiscoveryAdapter } from "./base";

export class OvertureAdapter implements DiscoveryAdapter {
  id = 'overture' as const;
  name = 'Overture Maps';

  async discover(city: string, category: string): Promise<Partial<Business>[]> {
    // Overture Maps requires bulk dataset downloads (AWS S3/DuckDB) — not suitable as a
    // live API adapter. Returns empty until a proper data pipeline is implemented.
    console.warn(`[OvertureAdapter] Not implemented. Skipping ${category} in ${city}.`);
    return [];
  }
}
