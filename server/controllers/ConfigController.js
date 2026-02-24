const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../assets/BancoDados/config.json');

const ConfigController = {
    // GET /api/admin/config
    getConfig: (req, res) => {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const data = fs.readFileSync(CONFIG_PATH, 'utf8');
                res.json(JSON.parse(data));
            } else {
                res.json({}); // Return empty if not set
            }
        } catch (error) {
            console.error('Error reading config:', error);
            res.status(500).json({ error: 'Failed to read config' });
        }
    },

    // POST /api/admin/config
    saveConfig: (req, res) => {
        try {
            const config = req.body;
            // Ensure directory exists
            const dir = path.dirname(CONFIG_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            console.log('✅ Config saved to server:', CONFIG_PATH);
            res.json({ success: true });
        } catch (error) {
            console.error('Error saving config:', error);
            res.status(500).json({ error: 'Failed to save config' });
        }
    }
};

module.exports = ConfigController;
