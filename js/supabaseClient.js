// CodeWolf Supabase Client for Leaderboard & Cloud Sync
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.CODEWOLF_CONFIG || { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

// Sync XP and fetch Leaderboard from Supabase
export async function syncUserXpToSupabase(username, xp, level) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').upsert({
      id: user.id,
      username: username || user.email.split('@')[0],
      xp: xp,
      level: level,
      updated_at: new Date()
    });
  } catch (err) {
    console.warn("Supabase sync warning:", err);
  }
}

export async function fetchGlobalLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, xp, level')
      .order('xp', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      // Fallback mock leaderboard if table doesn't exist yet
      return [
        { username: "🐺 WolfMaster_99", level: "Master", xp: 3420 },
        { username: "⚡ CyberCoder", level: "Expert", xp: 2890 },
        { username: "🚀 CodeNinja", level: "Advanced", xp: 2450 }
      ];
    }
    return data;
  } catch (err) {
    return [
      { username: "🐺 WolfMaster_99", level: "Master", xp: 3420 },
      { username: "⚡ CyberCoder", level: "Expert", xp: 2890 },
      { username: "🚀 CodeNinja", level: "Advanced", xp: 2450 }
    ];
  }
}
