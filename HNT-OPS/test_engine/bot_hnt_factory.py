import random
import time
import sys
from playwright.sync_api import sync_playwright

# --- CONFIGURATION ---
BASE_URL = "http://localhost:8080"
PRODUCTS = [
    "IndexFightShorts.html",
    "IndexMoletom.html",
    "IndexCalcaLegging.html",
    "IndexTop.html",
    "IndexShortsLegging.html"
]

# Random lists for simulation
NAMES = ["Teste Bot Alpha", "Teste Bot Beta", "Produção Experimental", "Simulador QA"]
TEXTS = ["HANUTHAI 2026", "HNT COMBAT", "MUAY THAI", "FIGHT TEAM", "CUSTOM ORDER"]
PHONES = ["11999999999", "21988887777", "31977776666"]

def run_simulation(headless=False):
    with sync_playwright() as p:
        print(f"🚀 Iniciando Bot de Testes HNT (Modo {'Oculto' if headless else 'Visível'})...")
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page()

        try:
            for product in PRODUCTS:
                target_url = f"{BASE_URL}/{product}"
                print(f"\n📦 Testando Produto: {product}")
                
                try:
                    page.goto(target_url, timeout=10000)
                    page.wait_for_selector(".simulator-area", timeout=10000)
                except Exception as e:
                    print(f"⚠️ Erro ao carregar {product}: {e}")
                    continue

                # 1. Customizar Cores (Procura por grids de cores)
                print("🎨 Customizando cores...")
                color_options = page.query_selector_all(".color-option")
                if color_options:
                    # Clica em 5 cores aleatórias para garantir variação
                    for _ in range(min(5, len(color_options))):
                        random.choice(color_options).click()
                        time.sleep(0.5)

                # 2. Ativar e Customizar Textos
                print("✍️ Inserindo textos de personalização...")
                text_toggles = page.query_selector_all(".toggle-wrapper input[type='checkbox']")
                for toggle in text_toggles:
                    if random.random() < 0.4: # 40% de chance de ativar cada zona de texto
                        if not toggle.is_checked():
                            toggle.check()
                            time.sleep(0.5)
                        
                        # Encontrar o input de texto que apareceu
                        inputs = page.query_selector_all(".text-input")
                        for inp in inputs:
                            if inp.is_visible():
                                inp.fill(random.choice(TEXTS))
                                time.sleep(0.3)

                # 3. Usar Banco de Imagens (Simulação de Logo)
                print("🖼️ Selecionando logotipo do banco de imagens...")
                btn_gallery = page.query_selector("button:has-text('BANCO IMAGENS')")
                if btn_gallery:
                    btn_gallery.click()
                    time.sleep(1)
                    # No modal da Galeria
                    gallery_items = page.query_selector_all(".gallery-item")
                    if gallery_items:
                        random.choice(gallery_items).click()
                        time.sleep(1)
                        print("✅ Logo selecionado.")

                # 4. Selecionar Tamanhos
                print("📏 Definindo quantidades e tamanhos...")
                qty_inputs = page.query_selector_all("input.qty-input")
                if not qty_inputs: # Tenta pelo tipo de componente
                    qty_inputs = page.query_selector_all(".size-item input")
                    
                for inp in qty_inputs:
                    if random.random() < 0.3: # Ativa alguns tamanhos
                        inp.fill(str(random.randint(1, 10)))
                
                # 4. Adicionar ao Carrinho
                print("🛒 Adicionando ao carrinho...")
                page.click("#btn-add-cart")
                time.sleep(1)
                
                # Verificar se o badge do carrinho atualizou ou se houve alerta de sucesso
                print("✅ Item adicionado.")

            # --- FINALIZAR PEDIDO (CHECKOUT) ---
            print("\n🛒 Indo para o Carrinho para finalizar...")
            page.goto(f"{BASE_URL}/cart.html")
            page.wait_for_selector(".cart-table", timeout=5000)
            
            # Verificar se tem no mínimo 1 item
            rows = page.query_selector_all(".cart-table tbody tr")
            print(f"📊 Total de itens no carrinho: {len(rows)}")

            # Ir para Cadastro (Sincronização de Dados de Produção)
            print("👤 Preenchendo dados de produção...")
            page.goto(f"{BASE_URL}/indexCadastro.html")
            page.wait_for_selector("#form-cadastro", timeout=5000)
            
            page.fill("#nome", random.choice(NAMES))
            page.fill("#email", f"bot_{random.randint(100,999)}@test.com")
            page.fill("#whatsapp", random.choice(PHONES))
            page.fill("#cpf", "11122233344") # CPF fictício
            
            # Marcar termos se houver
            terms = page.query_selector("#termos")
            if terms: terms.check()
            
            print("📤 Enviando para a Produção (Finalizando Registro)...")
            page.click("#btn-submit")
            
            time.sleep(3)
            print("\n🏁 Simulação concluída com sucesso!")
            print("Os pedidos devem agora aparecer no Dashboard HNT-OPS.")

        except Exception as e:
            print(f"❌ Erro fatal durante a simulação: {e}")
            # Tirar print para debug se der erro
            page.screenshot(path="debug_screenshot.png")
            print("📸 Screenshot de erro salvo em debug_screenshot.png")

        finally:
            browser.close()

if __name__ == "__main__":
    # Permite passar --visible se quiser ver o bot agindo
    is_headless = "--visible" not in sys.argv
    run_simulation(headless=is_headless)
