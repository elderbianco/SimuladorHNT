import json
import os
import argparse
import sys

# GLOBAL CONFIGURATION PATH
CONFIG_DIR = os.path.join(os.path.expanduser('~'), '.antigravity')
if not os.path.exists(CONFIG_DIR):
    os.makedirs(CONFIG_DIR)
CONFIG_PATH = os.path.join(CONFIG_DIR, 'orchestrator_config.json')

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_config(config):
    with open(CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description='Manage Orchestrator Configuration')
    parser.add_argument('--action', choices=['set', 'get', 'enable-eco', 'disable-eco'], required=True)
    parser.add_argument('--model', help='Model identifier to set')
    
    args = parser.parse_args()
    config = load_config()

    if args.action == 'enable-eco':
        config['eco_mode'] = True
        config['model'] = 'openrouter/deepseek/deepseek-r1:free' # Adjusted for OpenCode CLI common pattern
        save_config(config)
        print(f"✅ Eco Mode ENABLED via OpenCode CLI. Model set to: {config['model']}")

    elif args.action == 'disable-eco':
        config['eco_mode'] = False
        # Remove model or set to default if you have one
        if 'model' in config:
            del config['model']
        save_config(config)
        print("❌ Eco Mode DISABLED. Reverted to default Orchestrator model.")

    elif args.action == 'set':
        if not args.model:
            print("Error: --model argument required for set action")
            sys.exit(1)
        config['eco_mode'] = False # Custom model overrides eco mode
        config['model'] = args.model
        save_config(config)
        print(f"✅ Model set to: {config['model']}")

    elif args.action == 'get':
        if config.get('eco_mode'):
             print(f"ECO MODE ACTIVE. Model: {config.get('model', 'Unknown')}")
        elif config.get('model'):
             print(f"CUSTOM MODEL ACTIVE. Model: {config.get('model')}")
        else:
             print("DEFAULT MODE. No specific external model configured.")

if __name__ == "__main__":
    main()
