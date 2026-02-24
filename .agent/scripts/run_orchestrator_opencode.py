import subprocess
import sys
import json
import os
import time

# --- FREE MODEL TIERS CONFIGURATION ---
MODEL_TIERS = {
    "S": [ # State of the Art - Complex reasoning
        "openrouter/deepseek/deepseek-r1:free",
        "openrouter/meta-llama/llama-3.3-70b-instruct:free",
        "openrouter/qwen/qwen2.5-vl-72b-instruct:free",
        "openrouter/mistralai/mistral-large-2407:free"
    ],
    "A": [ # Excellent & Fast
        "openrouter/google/gemini-2.0-flash-lite-preview-02-05:free",
        "openrouter/nvidia/llama-3.1-nemotron-70b-instruct:free",
        "openrouter/mistralai/mistral-nemo:free"
    ],
    "B": [ # Lightweight & Functional
        "openrouter/mistralai/mistral-7b-instruct:free",
        "openrouter/meta-llama/llama-3.1-8b-instruct:free"
    ]
}

def load_config():
    config_dir = os.path.join(os.path.expanduser('~'), '.antigravity')
    config_path = os.path.join(config_dir, 'orchestrator_config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    return {}

def try_models(prompt, model_list):
    """Try a list of models sequentially until one succeeds."""
    for model in model_list:
        print(f"🔄 Attempting with model: {model}...")
        result = run_opencode_single(prompt, model)
        if result:
            print(f"✅ Success with: {model}")
            return result
        print(f"⚠️ Failed with {model}. Trying next...")
    return None

def run_opencode_single(prompt, model):
    try:
        # Construct command: opencode run "prompt" --model "model"
        result = subprocess.run(
            ['opencode', 'run', prompt, '--model', model],
            capture_output=True,
            text=True,
            encoding='utf-8',
            shell=True 
        )
        
        if result.returncode != 0:
            # print(f"DEBUG: Error with {model}: {result.stderr}")
            return None
            
        return result.stdout.strip()
        
    except FileNotFoundError:
        print("❌ Error: 'opencode' CLI not found in PATH.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python run_orchestrator_opencode.py <prompt>")
        sys.exit(1)
        
    prompt = sys.argv[1]
    config = load_config()
    
    # DETERMINE STRATEGY
    configured_model = config.get('model')
    response = None

    if configured_model:
        # Case 1: Specific model forced via /set-model or strict config
        # We try ONLY this model first.
        print(f"🎯 Using configured model: {configured_model}")
        response = run_opencode_single(prompt, configured_model)
        
        # Smart Fallback logic: If configured model fails AND it looks like a free model, try fallbacks
        if not response and ":free" in configured_model:
            print("⚠️ Configured free model failed. Initiating Smart Fallback (Tier S -> A)...")
            # Try Tier S then Tier A
            fallback_list = [m for m in MODEL_TIERS["S"] if m != configured_model] + MODEL_TIERS["A"]
            response = try_models(prompt, fallback_list)
    else:
        # Case 2: No specific model (Default / Auto)
        # We assume Eco Mode desire if hitting this script, starting with Tier S
        print("🚀 Starting Smart Orchestration (Tier S)...")
        response = try_models(prompt, MODEL_TIERS["S"])
        
        if not response:
             print("⚠️ Tier S models busy/failed. Dropping to Tier A...")
             response = try_models(prompt, MODEL_TIERS["A"])

    # OUTPUT
    if response:
        print("\n--- Model Response ---\n")
        print(response)
        print("\n----------------------\n")
    else:
        print("❌ All attempts failed. Please check your internet connection or OpenCode configuration.")

if __name__ == "__main__":
    main()
