const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Config do dotenv caso ainda nÃ£o esteja carregado
dotenv.config();

// Reutilizar variÃ¡veis se o usuÃ¡rio tiver adicionado manualmente ao .env, caso contrÃ¡rio
// Podemos hardcodar como fallback para este ambiente, jÃ¡ que sÃ£o pÃºblicas para este setup 
// (Mas o ideal serÃ¡ colocÃ¡-las no .env)
const supabaseUrl = process.env.SUPABASE_URL || 'https://sflllqfytzpwgnaksvkj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_LaBMdoSK9HGEjLBbeKxXiA_vy2EnlxY';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
