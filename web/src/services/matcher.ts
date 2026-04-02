// ============================================================
// Smart Matching & Merge Engine
// Compares staged businesses against production to classify:
//   - new (insert)
//   - update (merge fields)
//   - duplicate (skip)
//   - review (uncertain, needs human)
//   - reject (low quality)
// ============================================================

export type MatchStrength = 'strong' | 'medium' | 'weak' | 'none';
export type MatchAction = 'new' | 'update' | 'duplicate' | 'review' | 'reject';

export interface MatchResult {
  action: MatchAction;
  strength: MatchStrength;
  confidence: number;       // 0-100
  reason: string;
  matchedId?: string;       // existing business UUID
  conflictingFields?: string[];
}

export interface MatchableRecord {
  id?: string;
  normalized_phone?: string | null;
  normalized_website?: string | null;
  normalized_instagram?: string | null;
  normalized_facebook?: string | null;
  normalized_name?: string | null;
  normalized_address?: string | null;
  city?: string | null;
  governorate?: string | null;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  dedupe_key?: string | null;
  completeness_score?: number;
  maps_url?: string | null;
  business_name?: string | null;
  name?: string | null;
  phone?: string | null;
}

// --- MAIN MATCHING FUNCTION ---
// Compare a new record against all existing records

export function findBestMatch(
  newRecord: MatchableRecord,
  existingRecords: MatchableRecord[]
): MatchResult {
  if (existingRecords.length === 0) {
    return { action: 'new', strength: 'none', confidence: 100, reason: 'No existing records to match against' };
  }

  let bestMatch: MatchResult = { action: 'new', strength: 'none', confidence: 100, reason: 'No match found' };
  let bestScore = 0;

  for (const existing of existingRecords) {
    const result = compareRecords(newRecord, existing);
    
    if (result.confidence > bestScore) {
      bestScore = result.confidence;
      bestMatch = result;
    }
  }

  return bestMatch;
}

// --- COMPARE TWO RECORDS ---

function compareRecords(newRec: MatchableRecord, existing: MatchableRecord): MatchResult {
  const checks = {
    phoneMatch: false,
    websiteMatch: false,
    instagramMatch: false,
    facebookMatch: false,
    mapsMatch: false,
    nameMatch: false,
    nameSimilar: false,
    cityMatch: false,
    categoryMatch: false,
    coordsClose: false,
    dedupeKeyMatch: false,
  };

  // --- Strong signals ---
  
  // Phone match (strongest signal for Iraqi businesses)
  if (newRec.normalized_phone && existing.normalized_phone) {
    checks.phoneMatch = newRec.normalized_phone === existing.normalized_phone;
  }

  // Website match
  if (newRec.normalized_website && existing.normalized_website) {
    checks.websiteMatch = newRec.normalized_website === existing.normalized_website;
  }

  // Instagram match
  if (newRec.normalized_instagram && existing.normalized_instagram) {
    checks.instagramMatch = newRec.normalized_instagram === existing.normalized_instagram;
  }

  // Facebook match
  if (newRec.normalized_facebook && existing.normalized_facebook) {
    checks.facebookMatch = newRec.normalized_facebook === existing.normalized_facebook;
  }

  // Maps URL match
  if (newRec.maps_url && existing.maps_url) {
    checks.mapsMatch = newRec.maps_url === existing.maps_url;
  }

  // Dedupe key match
  if (newRec.dedupe_key && existing.dedupe_key) {
    checks.dedupeKeyMatch = newRec.dedupe_key === existing.dedupe_key;
  }

  // --- Medium signals ---
  
  // Name match
  const newName = newRec.normalized_name || newRec.business_name?.toLowerCase() || newRec.name?.toLowerCase();
  const existName = existing.normalized_name || existing.business_name?.toLowerCase() || existing.name?.toLowerCase();
  
  if (newName && existName) {
    checks.nameMatch = newName === existName;
    if (!checks.nameMatch) {
      checks.nameSimilar = nameSimilarity(newName, existName) > 0.7;
    }
  }

  // City match
  if (newRec.city && existing.city) {
    checks.cityMatch = newRec.city.toLowerCase().trim() === existing.city.toLowerCase().trim();
  }

  // Category match
  if (newRec.category && existing.category) {
    checks.categoryMatch = newRec.category.toLowerCase() === existing.category.toLowerCase();
  }

  // Coordinates proximity (within ~200m)
  if (newRec.latitude && newRec.longitude && existing.latitude && existing.longitude) {
    const dist = haversineDistance(
      newRec.latitude, newRec.longitude,
      existing.latitude, existing.longitude
    );
    checks.coordsClose = dist < 0.2; // 200 meters
  }

  // --- CLASSIFY ---

  // STRONG MATCH: phone, website, or social media match
  if (checks.phoneMatch || checks.websiteMatch || checks.instagramMatch || checks.facebookMatch || checks.mapsMatch) {
    const conflicts = findConflicts(newRec, existing);
    
    if (conflicts.length === 0 || (conflicts.length <= 2 && checks.phoneMatch)) {
      // Clean match — update or duplicate
      const newScore = newRec.completeness_score || 0;
      const existScore = existing.completeness_score || 0;
      
      if (newScore > existScore) {
        return {
          action: 'update',
          strength: 'strong',
          confidence: 95,
          reason: `Strong match: ${checks.phoneMatch ? 'phone' : checks.websiteMatch ? 'website' : 'social'} match. New data is more complete.`,
          matchedId: existing.id,
          conflictingFields: conflicts,
        };
      }
      
      return {
        action: 'duplicate',
        strength: 'strong',
        confidence: 95,
        reason: `Strong match: ${checks.phoneMatch ? 'phone' : checks.websiteMatch ? 'website' : 'social'} match. Existing data is equal or better.`,
        matchedId: existing.id,
      };
    }
    
    // Strong match but significant conflicts → review
    return {
      action: 'review',
      strength: 'strong',
      confidence: 80,
      reason: `Strong match by ${checks.phoneMatch ? 'phone' : 'digital ID'} but ${conflicts.length} conflicting fields`,
      matchedId: existing.id,
      conflictingFields: conflicts,
    };
  }

  // MEDIUM MATCH: same name + same city (+ extras)
  if ((checks.nameMatch || checks.nameSimilar) && checks.cityMatch) {
    let mediumConfidence = 50;
    const reasons: string[] = ['name+city match'];
    
    if (checks.categoryMatch) { mediumConfidence += 15; reasons.push('category'); }
    if (checks.coordsClose) { mediumConfidence += 20; reasons.push('coords close'); }
    if (checks.nameMatch) { mediumConfidence += 10; } // exact vs similar
    
    if (mediumConfidence >= 75) {
      return {
        action: 'review',
        strength: 'medium',
        confidence: mediumConfidence,
        reason: `Medium match: ${reasons.join(', ')}`,
        matchedId: existing.id,
        conflictingFields: findConflicts(newRec, existing),
      };
    }
  }

  // WEAK MATCH: dedupe key
  if (checks.dedupeKeyMatch) {
    return {
      action: 'review',
      strength: 'weak',
      confidence: 40,
      reason: 'Dedupe key match (name+city composite)',
      matchedId: existing.id,
      conflictingFields: findConflicts(newRec, existing),
    };
  }

  // NO MATCH
  return { action: 'new', strength: 'none', confidence: 0, reason: 'No match' };
}

// --- FIELD-LEVEL MERGE ---
// Never overwrite good data with bad data

export interface MergeResult {
  merged: Record<string, unknown>;
  updatedFields: string[];
  keptFields: string[];
  conflicts: string[];
}

const MERGEABLE_FIELDS = [
  'name', 'name_en', 'phone', 'normalized_phone', 'whatsapp',
  'email', 'website', 'normalized_website', 'address', 'normalized_address',
  'city', 'governorate', 'category', 'subcategory',
  'latitude', 'longitude',
  'facebook', 'normalized_facebook', 'instagram', 'normalized_instagram',
  'maps_url', 'dedupe_key',
] as const;

export function mergeRecords(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  incomingConfidence: number = 50
): MergeResult {
  const merged: Record<string, unknown> = { ...existing };
  const updatedFields: string[] = [];
  const keptFields: string[] = [];
  const conflicts: string[] = [];

  const existingConfidence = (existing.source_confidence as number) || 50;

  for (const field of MERGEABLE_FIELDS) {
    const oldVal = existing[field];
    const newVal = incoming[field];
    
    const oldEmpty = isEmptyValue(oldVal);
    const newEmpty = isEmptyValue(newVal);

    if (oldEmpty && newEmpty) {
      // Both empty — nothing to do
      continue;
    }
    
    if (oldEmpty && !newEmpty) {
      // Old is empty, new has value → fill it
      merged[field] = newVal;
      updatedFields.push(field);
      continue;
    }
    
    if (!oldEmpty && newEmpty) {
      // Old has value, new is empty → keep old
      keptFields.push(field);
      continue;
    }
    
    // Both have values
    if (String(oldVal).toLowerCase().trim() === String(newVal).toLowerCase().trim()) {
      // Same value — no conflict
      continue;
    }
    
    // Different values — decide which to keep
    if (field === 'address' || field === 'normalized_address') {
      // Prefer longer/more detailed address
      if (String(newVal).length > String(oldVal).length * 1.3) {
        merged[field] = newVal;
        updatedFields.push(field);
      } else {
        keptFields.push(field);
      }
    } else if (incomingConfidence > existingConfidence + 20) {
      // New source is significantly more trustworthy
      merged[field] = newVal;
      updatedFields.push(field);
    } else {
      // Conflict — record it but keep old value
      conflicts.push(field);
      keptFields.push(field);
    }
  }

  // Update metadata
  merged.updated_at = new Date().toISOString();
  merged.last_seen_at = new Date().toISOString();
  
  // Recalculate completeness
  const score = calculateMergedCompleteness(merged);
  merged.completeness_score = score;

  return { merged, updatedFields, keptFields, conflicts };
}

// --- HELPERS ---

function isEmptyValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  return false;
}

function calculateMergedCompleteness(rec: Record<string, unknown>): number {
  let score = 0;
  if (rec.name || rec.business_name) score += 10;
  if (rec.phone || rec.normalized_phone) score += 20;
  if (rec.whatsapp) score += 10;
  if (rec.address) score += 15;
  if (rec.city) score += 5;
  if (rec.governorate) score += 5;
  if (rec.category) score += 5;
  if (rec.latitude && rec.longitude) score += 10;
  if (rec.website) score += 5;
  if (rec.email) score += 5;
  if (rec.facebook || rec.instagram) score += Math.min(10, (rec.facebook ? 5 : 0) + (rec.instagram ? 5 : 0));
  return Math.min(score, 100);
}

function nameSimilarity(a: string, b: string): number {
  // Simple Jaccard similarity on word tokens
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 1));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 1));
  
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- FIND CONFLICTS between two records ---

function findConflicts(a: MatchableRecord, b: MatchableRecord): string[] {
  const conflicts: string[] = [];
  
  const checkField = (field: string, valA: unknown, valB: unknown) => {
    if (isEmptyValue(valA) || isEmptyValue(valB)) return;
    if (String(valA).toLowerCase().trim() !== String(valB).toLowerCase().trim()) {
      conflicts.push(field);
    }
  };

  const nameA = a.normalized_name || a.business_name || a.name;
  const nameB = b.normalized_name || b.business_name || b.name;
  checkField('name', nameA, nameB);
  checkField('phone', a.normalized_phone || a.phone, b.normalized_phone || b.phone);
  checkField('city', a.city, b.city);
  checkField('category', a.category, b.category);
  checkField('governorate', a.governorate, b.governorate);

  return conflicts;
}
