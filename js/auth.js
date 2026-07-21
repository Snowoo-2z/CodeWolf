// CodeWolf Real Supabase Authentication & Session Management
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client using config
const config = window.CODEWOLF_CONFIG || { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

window.CodeWolfAuth = {
  async loginWithGitHub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
    if (error) {
      console.error('GitHub Auth Error:', error.message);
      alert('Authentication error: ' + error.message);
    }
  },

  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('codewolf_username');
    localStorage.removeItem('codewolf_ai_name');
    window.location.href = '/';
  },

  async getUserSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session.user;
  },

  async requireAuth() {
    const user = await this.getUserSession();
    if (!user) {
      window.location.href = '/signin';
    }
    return user;
  }
};
