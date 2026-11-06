// Admin login lockout. The leading underscore keeps this file from becoming a
// Vercel function (the plan allows 12).
//
// Failed attempts are kept in Supabase (admin_login_attempts, service role
// only), not in memory, because Vercel runs many short-lived instances and an
// in-memory counter resets with each one. Two limits, each over 15 minutes:
// 5 failures from one IP lock that IP; 50 failures from anywhere lock the
// login for everyone, which stops guessing spread across many machines.

export const LIMITS = { perIp: 5, everyone: 50, minutes: 15 };

export async function loginLocked(supabase, ip, now = Date.now()) {
  if (!supabase) return { locked: false };
  const since = new Date(now - LIMITS.minutes * 60_000).toISOString();
  const fails = q => q.select('id', { count: 'exact', head: true }).eq('succeeded', false).gte('at', since);
  const [mine, all] = await Promise.all([
    fails(supabase.from('admin_login_attempts')).eq('ip', ip),
    fails(supabase.from('admin_login_attempts')),
  ]);
  if (mine.error || all.error) return { locked: false, unchecked: true };
  if ((mine.count || 0) >= LIMITS.perIp) return { locked: true, scope: 'ip' };
  if ((all.count || 0) >= LIMITS.everyone) return { locked: true, scope: 'everyone' };
  return { locked: false };
}

export async function recordLogin(supabase, ip, succeeded, now = Date.now()) {
  if (!supabase) return;
  await supabase.from('admin_login_attempts').insert({ ip, succeeded });
  // Keep the table small: nothing older than a week is needed.
  if (Math.random() < 0.1) await supabase.from('admin_login_attempts').delete().lt('at', new Date(now - 7 * 864e5).toISOString());
}
