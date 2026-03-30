import { ExportQuery } from '../../types';
import { supabase } from '../supabase';

function toCsv(rows: any[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','));
  return [headers.join(','), ...lines].join('\n');
}

function toPseudoXlsxBase64(rows: any[]): string {
  // Dependency-free fallback: base64 encoded CSV payload for xlsx channel.
  return Buffer.from(toCsv(rows), 'utf-8').toString('base64');
}

export async function exportBusinesses(query: ExportQuery): Promise<{ contentType: string; body: string }> {
  let dbQuery = supabase.from('businesses').select('*');

  if (query.city) dbQuery = dbQuery.eq('city', query.city);
  if (query.category) dbQuery = dbQuery.eq('category', query.category);
  if (query.status) dbQuery = dbQuery.eq('status', query.status);
  if (query.source_name) dbQuery = dbQuery.eq('source_name', query.source_name);
  if (query.source_type) dbQuery = dbQuery.eq('source_type', query.source_type);
  if (query.verifiedOnly) dbQuery = dbQuery.in('status', ['Verified', 'Export Ready']);
  if (query.exportReadyOnly) dbQuery = dbQuery.eq('status', 'Export Ready');
  if (!query.includeRejected) dbQuery = dbQuery.neq('status', 'Rejected');

  const { data, error } = await dbQuery.order('updated_at', { ascending: false });
  if (error) throw error;

  const rows = data || [];

  if (query.format === 'json') {
    return {
      contentType: 'application/json',
      body: JSON.stringify(rows, null, 2)
    };
  }

  if (query.format === 'xlsx') {
    return {
      contentType: 'application/octet-stream',
      body: toPseudoXlsxBase64(rows)
    };
  }

  return {
    contentType: 'text/csv',
    body: toCsv(rows)
  };
}

export async function exportDataQualityReports() {
  const [{ data: duplicates }, { data: incomplete }, { data: rejected }] = await Promise.all([
    supabase.from('businesses').select('*').gte('duplicate_risk_score', 70),
    supabase.from('businesses').select('*').lt('completeness_score', 50),
    supabase.from('businesses').select('*').in('status', ['Rejected', 'Outside Central Coverage'])
  ]);

  return {
    duplicates: duplicates || [],
    incomplete: incomplete || [],
    rejected: rejected || []
  };
}
