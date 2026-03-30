import { CoverageType } from '../../types';
import { CITY_CENTER_ALLOWLIST, SUBURB_KEYWORDS } from '../config/cityCenterZones';
import { cleanupText } from './normalize';

export function evaluateCoverage(city?: string, district?: string): {
  coverageType: CoverageType;
  cityCenterZone?: string;
  suburbRiskScore: number;
  reason: string;
} {
  const normalizedCity = cleanupText(city);
  const normalizedDistrict = cleanupText(district);

  if (!normalizedCity || !normalizedDistrict) {
    return {
      coverageType: 'Uncertain',
      suburbRiskScore: 65,
      reason: 'Missing city/district precision'
    };
  }

  const allowlist = CITY_CENTER_ALLOWLIST[normalizedCity] || [];
  const districtLower = normalizedDistrict.toLowerCase();

  if (allowlist.some((zone) => zone.toLowerCase() === districtLower)) {
    return {
      coverageType: 'Central City',
      cityCenterZone: normalizedDistrict,
      suburbRiskScore: 5,
      reason: 'District is in city center allowlist'
    };
  }

  if (SUBURB_KEYWORDS.some((keyword) => districtLower.includes(keyword))) {
    return {
      coverageType: 'Outside Central Coverage',
      suburbRiskScore: 95,
      reason: 'District indicates suburb/outskirts'
    };
  }

  return {
    coverageType: 'Uncertain',
    suburbRiskScore: 70,
    reason: 'District not in central allowlist and not clearly suburb'
  };
}
