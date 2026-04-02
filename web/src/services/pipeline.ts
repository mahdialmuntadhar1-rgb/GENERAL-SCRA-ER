// ============================================================
// Data Pipeline Service
// Orchestrates: raw import → normalize → match → merge/insert
// ============================================================

import { supabase } from '@/lib/supabase';
import { normalizeBusiness, type RawBusinessInput, type NormalizedBusiness } from './normalize';
import { findBestMatch, mergeRecords, type MatchResult, type MatchableRecord } from './matcher';

// --- BATCH ID GENERATION ---
function generateBatchId(source: string): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${source}_${ts}_${Math.random().toString(36).slice(2, 6)}`;
}

// --- STEP 1: Import raw data ---
export async function importRawBatch(
  businesses: RawBusinessInput[],
  source: string = 'osm',
  onProgress?: (step: string, done: number, total: number) => void
): Promise<{ batchId: string; imported: number; errors: string[] }> {
  const batchId = generateBatchId(source);
  const errors: string[] = [];
  let imported = 0;

  // Insert in chunks of 50
  const CHUNK = 50;
  for (let i = 0; i < businesses.length; i += CHUNK) {
    const chunk = businesses.slice(i, i + CHUNK).map((b) => ({
      batch_id: batchId,
      source,
      source_id: b.source || source,
      source_confidence: b.source_confidence || 50,
      business_name: b.business_name,
      business_name_en: b.business_name_en,
      phone: b.phone,
      whatsapp: b.whatsapp,
      email: b.email,
      website: b.website,
      address: b.address,
      city: b.city,
      governorate: b.governorate,
      category: b.category,
      subcategory: b.subcategory,
      latitude: b.latitude,
      longitude: b.longitude,
      facebook: b.facebook,
      instagram: b.instagram,
      maps_url: b.maps_url,
      raw_data: b.raw_data || null,
    }));

    const { error } = await supabase.from('businesses_import_raw').insert(chunk);

    if (error) {
      errors.push(`Chunk ${i}-${i + chunk.length}: ${error.message}`);
    } else {
      imported += chunk.length;
    }

    onProgress?.('Importing raw data', Math.min(i + CHUNK, businesses.length), businesses.length);
  }

  return { batchId, imported, errors };
}

// --- STEP 2: Normalize (clean & stage) ---
export async function normalizeBatch(
  batchId: string,
  onProgress?: (step: string, done: number, total: number) => void
): Promise<{ staged: number; rejected: number; errors: string[] }> {
  const errors: string[] = [];

  // Fetch raw records for this batch
  const { data: rawRecords, error: fetchErr } = await supabase
    .from('businesses_import_raw')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at');

  if (fetchErr || !rawRecords) {
    return { staged: 0, rejected: 0, errors: [fetchErr?.message || 'No raw records found'] };
  }

  let staged = 0;
  let rejected = 0;

  const CHUNK = 50;
  for (let i = 0; i < rawRecords.length; i += CHUNK) {
    const chunk = rawRecords.slice(i, i + CHUNK);
    const stagingRows: Record<string, unknown>[] = [];

    for (const raw of chunk) {
      const normalized = normalizeBusiness({
        business_name: raw.business_name,
        business_name_en: raw.business_name_en,
        phone: raw.phone,
        whatsapp: raw.whatsapp,
        email: raw.email,
        website: raw.website,
        address: raw.address,
        city: raw.city,
        governorate: raw.governorate,
        category: raw.category,
        subcategory: raw.subcategory,
        latitude: raw.latitude,
        longitude: raw.longitude,
        facebook: raw.facebook,
        instagram: raw.instagram,
        maps_url: raw.maps_url,
        source: raw.source,
        source_confidence: raw.source_confidence,
        raw_data: raw.raw_data,
      });

      if (!normalized) {
        rejected++;
        continue;
      }

      stagingRows.push({
        raw_id: raw.id,
        batch_id: batchId,
        ...normalized,
        match_status: 'pending',
      });
    }

    if (stagingRows.length > 0) {
      const { error } = await supabase.from('businesses_staging').insert(stagingRows);
      if (error) {
        errors.push(`Staging chunk ${i}: ${error.message}`);
      } else {
        staged += stagingRows.length;
      }
    }

    onProgress?.('Normalizing data', Math.min(i + CHUNK, rawRecords.length), rawRecords.length);
  }

  return { staged, rejected, errors };
}

// --- STEP 3: Match against production ---
export async function matchBatch(
  batchId: string,
  onProgress?: (step: string, done: number, total: number) => void
): Promise<{ results: Record<string, number>; errors: string[] }> {
  const errors: string[] = [];
  const results: Record<string, number> = { new: 0, update: 0, duplicate: 0, review: 0, reject: 0 };

  // Fetch staged records for this batch
  const { data: stagedRecords, error: fetchErr } = await supabase
    .from('businesses_staging')
    .select('*')
    .eq('batch_id', batchId)
    .eq('match_status', 'pending')
    .order('created_at');

  if (fetchErr || !stagedRecords) {
    return { results, errors: [fetchErr?.message || 'No staged records found'] };
  }

  // Fetch ALL production records for matching
  // For large databases, you'd want to fetch by governorate or use database-level matching
  const { data: existingRecords, error: existErr } = await supabase
    .from('iraqi_businesses')
    .select('id, name, normalized_name, phone, normalized_phone, website, normalized_website, facebook, normalized_facebook, instagram, normalized_instagram, city, governorate, category, latitude, longitude, dedupe_key, completeness_score, maps_url')
    .eq('is_active', true);

  if (existErr) {
    errors.push(`Fetching existing: ${existErr.message}`);
  }

  const existing: MatchableRecord[] = (existingRecords || []).map((r) => ({
    id: r.id,
    normalized_phone: r.normalized_phone,
    normalized_website: r.normalized_website,
    normalized_instagram: r.normalized_instagram,
    normalized_facebook: r.normalized_facebook,
    normalized_name: r.normalized_name,
    name: r.name,
    city: r.city,
    governorate: r.governorate,
    category: r.category,
    latitude: r.latitude,
    longitude: r.longitude,
    dedupe_key: r.dedupe_key,
    completeness_score: r.completeness_score,
    maps_url: r.maps_url,
    phone: r.phone,
  }));

  // Match each staged record
  for (let i = 0; i < stagedRecords.length; i++) {
    const staged = stagedRecords[i];

    const matchInput: MatchableRecord = {
      normalized_phone: staged.normalized_phone,
      normalized_website: staged.normalized_website,
      normalized_instagram: staged.normalized_instagram,
      normalized_facebook: staged.normalized_facebook,
      normalized_name: staged.normalized_name,
      business_name: staged.business_name,
      city: staged.city,
      governorate: staged.governorate,
      category: staged.category,
      latitude: staged.latitude,
      longitude: staged.longitude,
      dedupe_key: staged.dedupe_key,
      completeness_score: staged.completeness_score,
      maps_url: staged.maps_url,
      phone: staged.phone,
    };

    const match: MatchResult = findBestMatch(matchInput, existing);
    results[match.action] = (results[match.action] || 0) + 1;

    // Update staging record with match result
    const updateData: Record<string, unknown> = {
      match_status: match.action,
      match_confidence: match.confidence,
      match_reason: match.reason,
      processed_at: new Date().toISOString(),
    };
    if (match.matchedId) {
      updateData.matched_business_id = match.matchedId;
    }

    const { error: upErr } = await supabase
      .from('businesses_staging')
      .update(updateData)
      .eq('id', staged.id);

    if (upErr) {
      errors.push(`Update staging ${staged.id}: ${upErr.message}`);
    }

    // If review needed, add to review queue
    if (match.action === 'review' && match.matchedId) {
      // Fetch existing record snapshot
      const existingRec = existingRecords?.find((r) => r.id === match.matchedId);

      await supabase.from('businesses_review_queue').insert({
        staging_id: staged.id,
        existing_business_id: match.matchedId,
        new_data: staged,
        existing_data: existingRec || null,
        match_type: match.strength,
        match_confidence: match.confidence,
        match_reason: match.reason,
        conflicting_fields: match.conflictingFields || [],
      });
    }

    onProgress?.('Matching businesses', i + 1, stagedRecords.length);
  }

  return { results, errors };
}

// --- STEP 4: Apply approved changes ---
export async function applyMatches(
  batchId: string,
  onProgress?: (step: string, done: number, total: number) => void
): Promise<{ inserted: number; updated: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Get all staged records that need action
  const { data: toInsert } = await supabase
    .from('businesses_staging')
    .select('*')
    .eq('batch_id', batchId)
    .eq('match_status', 'new');

  const { data: toUpdate } = await supabase
    .from('businesses_staging')
    .select('*')
    .eq('batch_id', batchId)
    .eq('match_status', 'update');

  const total = (toInsert?.length || 0) + (toUpdate?.length || 0);
  let processed = 0;

  // --- INSERT NEW RECORDS ---
  if (toInsert && toInsert.length > 0) {
    const CHUNK = 50;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK).map((s) => stagingToProduction(s));

      const { data, error } = await supabase
        .from('iraqi_businesses')
        .insert(chunk)
        .select('id');

      if (error) {
        errors.push(`Insert chunk ${i}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }

      processed += chunk.length;
      onProgress?.('Inserting new businesses', processed, total);
    }
  }

  // --- UPDATE EXISTING RECORDS ---
  if (toUpdate && toUpdate.length > 0) {
    for (const staged of toUpdate) {
      if (!staged.matched_business_id) {
        skipped++;
        continue;
      }

      // Fetch current production record
      const { data: existingArr } = await supabase
        .from('iraqi_businesses')
        .select('*')
        .eq('id', staged.matched_business_id)
        .single();

      if (!existingArr) {
        skipped++;
        continue;
      }

      // Field-level merge
      const { merged, updatedFields } = mergeRecords(
        existingArr as Record<string, unknown>,
        stagingToProductionObj(staged),
        staged.source_confidence || 50
      );

      if (updatedFields.length > 0) {
        // Only update if there are actual changes
        const updatePayload: Record<string, unknown> = {};
        for (const field of updatedFields) {
          updatePayload[field] = merged[field];
        }
        updatePayload.updated_at = new Date().toISOString();
        updatePayload.last_seen_at = new Date().toISOString();
        updatePayload.completeness_score = merged.completeness_score;

        const { error } = await supabase
          .from('iraqi_businesses')
          .update(updatePayload)
          .eq('id', staged.matched_business_id);

        if (error) {
          errors.push(`Update ${staged.matched_business_id}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        skipped++;
      }

      processed++;
      onProgress?.('Updating businesses', processed, total);
    }
  }

  return { inserted, updated, skipped, errors };
}

// --- FULL PIPELINE: run all 4 steps ---
export async function runFullPipeline(
  businesses: RawBusinessInput[],
  source: string = 'osm',
  onProgress?: (step: string, done: number, total: number) => void
): Promise<PipelineResult> {
  const startTime = Date.now();
  const allErrors: string[] = [];

  // Step 1: Import raw
  onProgress?.('Step 1: Importing raw data...', 0, businesses.length);
  const { batchId, imported, errors: rawErrors } = await importRawBatch(businesses, source, onProgress);
  allErrors.push(...rawErrors);

  // Step 2: Normalize
  onProgress?.('Step 2: Normalizing...', 0, imported);
  const { staged, rejected, errors: normErrors } = await normalizeBatch(batchId, onProgress);
  allErrors.push(...normErrors);

  // Step 3: Match
  onProgress?.('Step 3: Matching against existing...', 0, staged);
  const { results: matchResults, errors: matchErrors } = await matchBatch(batchId, onProgress);
  allErrors.push(...matchErrors);

  // Step 4: Apply
  onProgress?.('Step 4: Applying changes...', 0, (matchResults.new || 0) + (matchResults.update || 0));
  const { inserted, updated, skipped, errors: applyErrors } = await applyMatches(batchId, onProgress);
  allErrors.push(...applyErrors);

  return {
    batchId,
    totalInput: businesses.length,
    imported,
    staged,
    rejected,
    matchResults,
    inserted,
    updated,
    skipped,
    reviewPending: matchResults.review || 0,
    errors: allErrors,
    durationMs: Date.now() - startTime,
  };
}

export interface PipelineResult {
  batchId: string;
  totalInput: number;
  imported: number;
  staged: number;
  rejected: number;
  matchResults: Record<string, number>;
  inserted: number;
  updated: number;
  skipped: number;
  reviewPending: number;
  errors: string[];
  durationMs: number;
}

// --- LOCAL-ONLY PIPELINE (no Supabase tables needed) ---
// For users who haven't set up the new tables yet
// Runs normalization + matching in memory, then pushes to production

export async function runLocalPipeline(
  businesses: RawBusinessInput[],
  onProgress?: (step: string, done: number, total: number) => void
): Promise<PipelineResult> {
  const startTime = Date.now();
  const allErrors: string[] = [];
  const batchId = generateBatchId('local');

  // Step 1: Normalize in memory
  onProgress?.('Normalizing...', 0, businesses.length);
  const normalized: NormalizedBusiness[] = [];
  let rejected = 0;

  for (let i = 0; i < businesses.length; i++) {
    const result = normalizeBusiness(businesses[i]);
    if (result) {
      normalized.push(result);
    } else {
      rejected++;
    }
    onProgress?.('Normalizing', i + 1, businesses.length);
  }

  // Step 2: Fetch existing production records for matching
  onProgress?.('Fetching existing records...', 0, 1);
  const { data: existingRecords } = await supabase
    .from('iraqi_businesses')
    .select('id, name, normalized_name, phone, normalized_phone, website, normalized_website, facebook, normalized_facebook, instagram, normalized_instagram, city, governorate, category, latitude, longitude, dedupe_key, completeness_score, maps_url, source_confidence')
    .eq('is_active', true);

  const existing: MatchableRecord[] = (existingRecords || []).map((r) => ({
    id: r.id,
    normalized_phone: r.normalized_phone,
    normalized_website: r.normalized_website,
    normalized_instagram: r.normalized_instagram,
    normalized_facebook: r.normalized_facebook,
    normalized_name: r.normalized_name,
    name: r.name,
    city: r.city,
    governorate: r.governorate,
    category: r.category,
    latitude: r.latitude,
    longitude: r.longitude,
    dedupe_key: r.dedupe_key,
    completeness_score: r.completeness_score,
    maps_url: r.maps_url,
    phone: r.phone,
  }));

  // Step 3: Match + classify
  const matchResults: Record<string, number> = { new: 0, update: 0, duplicate: 0, review: 0, reject: 0 };
  const toInsert: NormalizedBusiness[] = [];
  const toUpdate: Array<{ normalized: NormalizedBusiness; matchedId: string }> = [];

  for (let i = 0; i < normalized.length; i++) {
    const n = normalized[i];
    const matchInput: MatchableRecord = {
      normalized_phone: n.normalized_phone,
      normalized_website: n.normalized_website,
      normalized_instagram: n.normalized_instagram,
      normalized_facebook: n.normalized_facebook,
      normalized_name: n.normalized_name,
      business_name: n.business_name,
      city: n.city,
      governorate: n.governorate,
      category: n.category,
      latitude: n.latitude,
      longitude: n.longitude,
      dedupe_key: n.dedupe_key,
      completeness_score: n.completeness_score,
    };

    const match = findBestMatch(matchInput, existing);
    matchResults[match.action] = (matchResults[match.action] || 0) + 1;

    if (match.action === 'new') {
      toInsert.push(n);
    } else if (match.action === 'update' && match.matchedId) {
      toUpdate.push({ normalized: n, matchedId: match.matchedId });
    }
    // duplicates and reviews are skipped in local mode

    onProgress?.('Matching', i + 1, normalized.length);
  }

  // Step 4: Apply to production
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const total = toInsert.length + toUpdate.length;
  let processed = 0;

  // Insert new
  const CHUNK = 50;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK).map((n) => normalizedToProduction(n));
    const { data, error } = await supabase
      .from('iraqi_businesses')
      .insert(chunk)
      .select('id');

    if (error) {
      allErrors.push(`Insert: ${error.message}`);
    } else {
      inserted += data?.length || 0;
    }
    processed += chunk.length;
    onProgress?.('Inserting', processed, total);
  }

  // Update existing
  for (const { normalized: n, matchedId } of toUpdate) {
    const { data: existRec } = await supabase
      .from('iraqi_businesses')
      .select('*')
      .eq('id', matchedId)
      .single();

    if (!existRec) { skipped++; continue; }

    const { merged, updatedFields } = mergeRecords(
      existRec as Record<string, unknown>,
      normalizedToProduction(n) as Record<string, unknown>,
      n.source_confidence
    );

    if (updatedFields.length > 0) {
      const payload: Record<string, unknown> = {};
      for (const f of updatedFields) { payload[f] = merged[f]; }
      payload.updated_at = new Date().toISOString();
      payload.completeness_score = merged.completeness_score;

      const { error } = await supabase
        .from('iraqi_businesses')
        .update(payload)
        .eq('id', matchedId);

      if (error) allErrors.push(`Update: ${error.message}`);
      else updated++;
    } else {
      skipped++;
    }
    processed++;
    onProgress?.('Updating', processed, total);
  }

  return {
    batchId,
    totalInput: businesses.length,
    imported: businesses.length,
    staged: normalized.length,
    rejected,
    matchResults,
    inserted,
    updated,
    skipped,
    reviewPending: matchResults.review || 0,
    errors: allErrors,
    durationMs: Date.now() - startTime,
  };
}

// --- HELPERS: Convert staging/normalized to production format ---

function stagingToProduction(staged: Record<string, unknown>) {
  return {
    name: staged.business_name,
    name_en: staged.business_name_en,
    normalized_name: staged.normalized_name,
    phone: staged.phone,
    normalized_phone: staged.normalized_phone,
    website: staged.website,
    normalized_website: staged.normalized_website,
    email: staged.email,
    address: staged.address,
    normalized_address: staged.normalized_address,
    city: staged.city,
    governorate: staged.governorate,
    country: staged.country || 'Iraq',
    latitude: staged.latitude,
    longitude: staged.longitude,
    category: staged.category,
    subcategory: staged.subcategory,
    facebook: staged.facebook,
    normalized_facebook: staged.normalized_facebook,
    instagram: staged.instagram,
    normalized_instagram: staged.normalized_instagram,
    whatsapp: staged.whatsapp,
    maps_url: staged.maps_url,
    dedupe_key: staged.dedupe_key,
    completeness_score: staged.completeness_score,
    source: staged.source,
    source_confidence: staged.source_confidence,
    data_quality: (staged.completeness_score as number) >= 50 ? 'real' : 'partial',
    verified: false,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    raw_data: staged.raw_data,
  };
}

function stagingToProductionObj(staged: Record<string, unknown>): Record<string, unknown> {
  return stagingToProduction(staged);
}

function normalizedToProduction(n: NormalizedBusiness) {
  return {
    name: n.business_name,
    name_en: n.business_name_en,
    normalized_name: n.normalized_name,
    phone: n.phone,
    normalized_phone: n.normalized_phone,
    website: n.website,
    normalized_website: n.normalized_website,
    email: n.email,
    address: n.address,
    normalized_address: n.normalized_address,
    city: n.city,
    governorate: n.governorate,
    country: n.country,
    latitude: n.latitude,
    longitude: n.longitude,
    category: n.category,
    subcategory: n.subcategory,
    facebook: n.facebook,
    normalized_facebook: n.normalized_facebook,
    instagram: n.instagram,
    normalized_instagram: n.normalized_instagram,
    dedupe_key: n.dedupe_key,
    completeness_score: n.completeness_score,
    source: n.source,
    source_confidence: n.source_confidence,
    data_quality: n.completeness_score >= 50 ? 'real' : 'partial',
    verified: false,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    raw_data: n.raw_data,
  };
}
