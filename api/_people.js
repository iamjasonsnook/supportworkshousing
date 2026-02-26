/**
 * Shared helper: find or create a person in the `people` table.
 *
 * Used by stripe-webhook, connection-nights, and supply-drives endpoints
 * to ensure every contact has a canonical record in `people`.
 */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object} opts
 * @param {string}  opts.email  — required, used as lookup key
 * @param {string} [opts.name]  — full name, split into first/last
 * @param {string} [opts.phone]
 * @param {string} [opts.address]
 * @param {string} [opts.city]
 * @param {string} [opts.state]
 * @param {string} [opts.zip]
 * @param {string} [opts.organization]
 * @param {string} [opts.role] — role to ensure is present (e.g. 'donor', 'volunteer')
 * @returns {Promise<{id: string, roles: string[]} | null>}
 */
export async function findOrCreatePerson(supabase, opts) {
  const { email, name, phone, address, city, state, zip, organization, role } = opts;

  if (!email) return null;

  // Look up existing person by primary_email
  const { data: existing, error: lookupError } = await supabase
    .from('people')
    .select('id, roles')
    .eq('primary_email', email.toLowerCase().trim())
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error('people lookup error:', lookupError.message);
    return null;
  }

  if (existing) {
    // Ensure the requested role is present
    if (role && !existing.roles.includes(role)) {
      const updatedRoles = [...existing.roles, role];
      await supabase
        .from('people')
        .update({ roles: updatedRoles })
        .eq('id', existing.id);
      existing.roles = updatedRoles;
    }
    return existing;
  }

  // Parse name into first/last
  const nameParts = (name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

  const personType = organization ? 'Organization' : 'Individual';
  const roles = role ? [role] : [];

  const insertData = {
    first_name: firstName,
    last_name: lastName,
    primary_email: email.toLowerCase().trim(),
    primary_phone: phone || null,
    address_street: address || null,
    address_city: city || null,
    address_state: state || null,
    address_postal_code: zip || null,
    organization_name: organization || null,
    type: personType,
    roles,
  };

  const { data: created, error: insertError } = await supabase
    .from('people')
    .insert(insertData)
    .select('id, roles')
    .single();

  if (insertError) {
    console.error('people insert error:', insertError.message);
    return null;
  }

  return created;
}
