import { CanonicalBusinessRecord } from '../../../types';

export function applyQCWorkflow(records: CanonicalBusinessRecord[]): CanonicalBusinessRecord[] {
  return records.map(record => {
    if (record.status === 'Rejected' || record.status === 'Outside Central Coverage') return record;

    if (record.completeness_score < 0.5) {
      return { ...record, status: 'Needs Cleaning' };
    }

    if (record.verification_score < 0.65) {
      return { ...record, status: 'Needs Verification' };
    }

    if (record.publish_readiness_score >= 0.75) {
      return { ...record, status: 'Export Ready' };
    }

    return { ...record, status: 'Verified' };
  });
}
