import { Business, DiscoveryRequest, DiscoveryResult } from '../types';
import { supabase } from './supabase';
import { runSourceExecution } from './pipeline/services/executionService';
import { mapUploadRows, generateImportExportReport } from './pipeline/services/importExportService';
import { mergeRecords } from './pipeline/services/mergeService';
import { applyQCWorkflow } from './pipeline/services/qcService';

function toLegacyBusiness(record: any): Business {
  return {
    name: record.business_name,
    local_name: undefined,
    category: record.category,
    city: record.city,
    governorate: undefined,
    address: record.address_text,
    phone: record.phone_primary,
    website: record.website_url,
    facebook_url: record.facebook_url,
    instagram_url: record.instagram_url,
    source: record.provider_id,
    source_url: record.source_url,
    confidence_score: record.verification_score,
  };
}

export async function runDiscovery(req: DiscoveryRequest): Promise<DiscoveryResult> {
  const { records: sourceRecords, errors, selectedProviders } = await runSourceExecution(req);
  const uploaded = mapUploadRows(req.uploads, req.options.city, req.options.category);
  const records = applyQCWorkflow(mergeRecords([...sourceRecords, ...uploaded]));

  let insertedCount = 0;
  let skippedCount = 0;

  for (const record of records) {
    if (record.status === 'Rejected') {
      skippedCount++;
      continue;
    }

    const candidate = toLegacyBusiness(record);

    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .or(`name.eq."${candidate.name}",phone.eq."${candidate.phone || ''}"`)
      .eq('city', candidate.city)
      .maybeSingle();

    if (existing) {
      skippedCount++;
      continue;
    }

    const { error } = await supabase
      .from('businesses')
      .insert(candidate);

    if (error) {
      errors.push(`Insert error for ${candidate.name}: ${error.message}`);
      skippedCount++;
    } else {
      insertedCount++;
    }
  }

  const importExportReport = generateImportExportReport(records, selectedProviders);

  return {
    summary: `Discovery completed for ${req.options.category} in ${req.options.city}.`,
    insertedCount,
    skippedCount,
    errors,
    records,
    importExportReport,
  };
}
