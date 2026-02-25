const supabase = require('../utils/supabase');

// Mapping between config keys and their relational Supabase tables
const PRICING_TABLE_MAP = {
    'hnt_pricing_config': 'precos_shorts',
    'hnt_legging_config': 'precos_legging',
    'hnt_shorts_legging_config': 'precos_shorts_legging',
    'hnt_top_config': 'precos_top',
    'hnt_moletom_config': 'precos_moletom'
};

// Mapping between Frontend (camelCase) and DB (snake_case - Intuitive)
const FIELD_MAPS = {
    'precos_shorts': {
        basePrice: 'preco_base',
        sizeModPrice: 'adicional_tamanho',
        devFee: 'taxa_desenvolvimento',
        logoCenterPrice: 'logo_centro',
        textCenterPrice: 'texto_centro',
        logoLatPrice: 'logo_lateral',
        textLatPrice: 'texto_lateral',
        legRightMidPrice: 'perna_dir_meio',
        legRightBottomPrice: 'perna_dir_inferior',
        legLeftPrice: 'perna_esquerda',
        extraLeggingPrice: 'extra_legging',
        extraLacoPrice: 'extra_laco',
        extraCordaoPrice: 'extra_cordao',
        price10: 'preco_10_unid',
        price20: 'preco_20_unid',
        price30: 'preco_30_unid',
        artWaiver: 'disponibilidade_arte',
        whatsappNumber: 'contato_whatsapp'
    },
    'precos_legging': {
        basePrice: 'preco_base',
        sizeModPrice: 'adicional_tamanho',
        devFee: 'taxa_desenvolvimento',
        logoLatPrice: 'logo_lateral',
        textLatPrice: 'texto_lateral',
        logoLegPrice: 'logo_perna',
        textLegPrice: 'texto_perna',
        price10: 'preco_10_unid',
        price20: 'preco_20_unid',
        price30: 'preco_30_unid',
        artWaiver: 'disponibilidade_arte'
    },
    'precos_shorts_legging': {
        basePrice: 'preco_base',
        sizeModPrice: 'adicional_tamanho',
        devFee: 'taxa_desenvolvimento',
        logoLatPrice: 'logo_lateral',
        textLatPrice: 'texto_lateral',
        logoLegPrice: 'logo_perna',
        textLegPrice: 'texto_perna',
        price10: 'preco_10_unid',
        price20: 'preco_20_unid',
        price30: 'preco_30_unid',
        artWaiver: 'disponibilidade_arte'
    },
    'precos_top': {
        basePrice: 'preco_base',
        sizeModPrice: 'adicional_tamanho',
        devFee: 'taxa_desenvolvimento',
        logoFrontPrice: 'logo_frente',
        textFrontPrice: 'texto_frente',
        logoBackPrice: 'logo_costas',
        textBackPrice: 'texto_costas',
        logoHntFrontPrice: 'logo_hnt_frente',
        logoHntBackPrice: 'logo_hnt_costas',
        price10: 'preco_10_unid',
        price20: 'preco_20_unid',
        price30: 'preco_30_unid',
        artWaiver: 'disponibilidade_arte'
    },
    'precos_moletom': {
        basePrice: 'preco_base',
        sizeModPrice: 'adicional_tamanho',
        devFee: 'taxa_desenvolvimento',
        logoFrontPrice: 'logo_frente',
        textFrontPrice: 'texto_frente',
        logoBackPrice: 'logo_costas',
        textBackPrice: 'texto_costas',
        logoHoodPrice: 'logo_capuz',
        textHoodPrice: 'texto_capuz',
        logoSleevePrice: 'logo_manga',
        textSleevePrice: 'texto_manga',
        zipperUpgrade: 'up_zipper',
        pocketUpgrade: 'up_bolso',
        price10: 'preco_10_unid',
        price20: 'preco_20_unid',
        price30: 'preco_30_unid',
        artWaiver: 'disponibilidade_arte'
    }
};

const ConfigController = {
    // GET /api/admin/config/:key?
    getConfig: async (req, res) => {
        try {
            const configKey = req.params.key;
            const table = PRICING_TABLE_MAP[configKey];

            if (table) {
                // Relational lookup for pricing
                const { data, error } = await supabase.from(table).select('*').eq('id', 1).single();
                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    // Map back to camelCase for frontend
                    const map = FIELD_MAPS[table];
                    const frontendData = {};
                    Object.keys(map).forEach(feKey => {
                        frontendData[feKey] = data[map[feKey]];
                    });
                    return res.json(frontendData);
                }
            } else {
                // Generic lookup in adm_cfg for other items
                const { data, error } = await supabase.from('adm_cfg').select('valor').eq('chave', configKey).single();
                if (error && error.code !== 'PGRST116') throw error;
                if (data && data.valor) return res.json(data.valor);
            }

            res.json({}); // Return empty if not set
        } catch (error) {
            console.error(`Error reading config ${req.params.key}:`, error);
            res.status(500).json({ error: 'Failed to read config' });
        }
    },

    // POST /api/admin/config/:key?
    saveConfig: async (req, res) => {
        try {
            const configKey = req.params.key;
            const config = req.body;
            const table = PRICING_TABLE_MAP[configKey];

            if (table) {
                // Relational save for pricing
                const map = FIELD_MAPS[table];
                const dbPayload = { id: 1 }; // Always update row 1 for Excel ease
                Object.keys(map).forEach(feKey => {
                    if (config[feKey] !== undefined) {
                        dbPayload[map[feKey]] = config[feKey];
                    }
                });
                dbPayload.atualizado_em = new Date().toISOString();

                const { error } = await supabase.from(table).upsert(dbPayload, { onConflict: 'id' });
                if (error) throw error;
                console.log(`✅ Relational Pricing saved (Intuitive Names): ${table}`);
            } else {
                // Generic save in adm_cfg
                const { error } = await supabase.from('adm_cfg').upsert({
                    chave: configKey,
                    valor: config,
                    atualizado_em: new Date().toISOString()
                }, { onConflict: 'chave' });
                if (error) throw error;
                console.log(`✅ Config saved to adm_cfg: ${configKey}`);
            }

            res.json({ success: true, key: configKey });
        } catch (error) {
            console.error(`Error saving config ${req.params.key}:`, error);
            res.status(500).json({ error: 'Failed to save config' });
        }
    }
};

module.exports = ConfigController;
