// CodeWolf Authentication & Session Management
// Compatible with Supabase client integration & Vercel environment variables

const CodeWolfAuth = {
  isLoggedIn() {
    return localStorage.getItem('codewolf_logged_in') === 'true';
  },

  login(userData) {
    localStorage.setItem('codewolf_logged_in', 'true');
    if (userData.username) localStorage.setItem('codewolf_username', userData.username);
    if (userData.aiName) localStorage.setItem('codewolf_ai_name', userData.aiName);
  },

  logout() {
    localStorage.removeItem('codewolf_logged_in');
    localStorage.removeItem('codewolf_username');
    localStorage.removeItem('codewolf_ai_name');
    window.location.href = '/';
  },

  getUser() {
    return {
      username: localStorage.getItem('codewolf_username') || 'Developer',
      aiName: localStorage.getItem('codewolf_ai_name') || 'Assistant'
    };
  }
};
