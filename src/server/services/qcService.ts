import { BusinessStatus } from '../../types';
import { supabase } from '../supabase';

export async function updateBusinessStatus(input: {
  businessId: string;
  nextStatus: BusinessStatus;
  reviewedBy: string;
  note?: string;
}) {
  const { data: previous, error: fetchError } = await supabase
    .from('businesses')
    .select('status')
    .eq('id', input.businessId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      status: input.nextStatus,
      reviewed_by: input.reviewedBy,
      verification_notes: input.note,
      updated_at: new Date().toISOString()
    })
    .eq('id', input.businessId);

  if (updateError) throw updateError;

  const { error: auditError } = await supabase.from('business_audit_history').insert({
    business_id: input.businessId,
    changed_by: input.reviewedBy,
    previous_status: previous.status,
    next_status: input.nextStatus,
    note: input.note
  });

  if (auditError) throw auditError;

  return { success: true };
}
