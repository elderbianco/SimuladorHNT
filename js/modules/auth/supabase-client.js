// Initialize Supabase Client
const SUPABASE_URL = 'https://sflllqfytzpwgnaksvkj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LaBMdoSK9HGEjLBbeKxXiA_vy2EnlxY'; // Publishable key is safe for frontend

// supabase is injected globally via CDN script in HTML before this is loaded
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const auth = {
    async signIn(email, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await window.supabaseClient.auth.signOut();
        return { error };
    },

    async getSession() {
        const { data, error } = await window.supabaseClient.auth.getSession();
        return { session: data?.session, error };
    },

    async getToken() {
        const { data } = await window.supabaseClient.auth.getSession();
        return data?.session?.access_token || null;
    }
};

window.authApi = auth;
