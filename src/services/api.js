import { supabase } from '../config/supabase';
import { sendVolunteerConfirmationEmail, sendAdminNotificationEmail, sendStatusUpdateEmail } from './email';

// =============================================================================
// VOLUNTEER REQUEST SUBMISSION
// =============================================================================
export async function submitVolunteerRequest(formData) {
  if (!supabase) {
    throw new Error('Database connection not configured. Please set up Supabase credentials.');
  }

  try {
    // Insert the volunteer request into the database
    const { data, error } = await supabase
      .from('volunteer_requests')
      .insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          preferred_date: formData.preferredDate,
          group_size: parseInt(formData.groupSize),
          organization: formData.organization || null,
          notes: formData.notes || null,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email to volunteer
    await sendVolunteerConfirmationEmail(formData);

    // Send notification email to admin with approval links
    await sendAdminNotificationEmail(formData, data.id);

    return data;
  } catch (error) {
    console.error('Error submitting volunteer request:', error);
    throw new Error('Failed to submit volunteer request. Please try again.');
  }
}

// =============================================================================
// UPDATE REQUEST STATUS
// =============================================================================
export async function updateRequestStatus(requestId, status) {
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  if (!['approved', 'denied'].includes(status)) {
    throw new Error('Invalid status. Must be "approved" or "denied".');
  }

  try {
    // Get the current request details
    const { data: request, error: fetchError } = await supabase
      .from('volunteer_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Update the status
    const { data, error } = await supabase
      .from('volunteer_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // Send status update email to volunteer (with admin CC'd)
    await sendStatusUpdateEmail(request, status);

    return data;
  } catch (error) {
    console.error('Error updating request status:', error);
    throw new Error('Failed to update request status.');
  }
}

// =============================================================================
// GET REQUEST BY ID
// =============================================================================
export async function getRequestById(requestId) {
  if (!supabase) {
    throw new Error('Database connection not configured.');
  }

  try {
    const { data, error } = await supabase
      .from('volunteer_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching request:', error);
    throw new Error('Failed to fetch request details.');
  }
}
