# Guia de Uso: Git & GitHub (SimuladorHNT) 🚀

Este documento explica como manter seu projeto atualizado e seguro usando o GitHub.

## 1. O que é o quê?

* **Git:** É a ferramenta que instalamos no seu computador. Ela funciona como uma "máquina do tempo" para o seu código, salvando versões de tudo o que você faz.
* **GitHub:** É o site (a nuvem) onde seu código fica guardado. Ele serve como um backup seguro e permite que outras pessoas (ou eu) vejam e ajudem no projeto.

---

## 2. O Ciclo de Trabalho (Os 3 Comandos Mágicos)

Toda vez que você terminar uma alteração no código e quiser salvar no GitHub, abra o terminal na pasta do projeto e use estes comandos nesta ordem:

### Passo 1: Preparar os arquivos

```bash
git add .
```

* **O que faz:** Avisa ao Git que você quer incluir todas as alterações recentes no próximo "pacote" de salvamento.

### Passo 2: Criar o ponto de salvamento (Commit)

```bash
git commit -m "Explique aqui o que você mudou"
```

* **O que faz:** Tira uma "foto" oficial do seu código naquele momento.
* **Exemplo:** `git commit -m "Corrigi a cor do botão de compra"`

### Passo 3: Enviar para a nuvem

```bash
git push
```

* **O que faz:** Pega todos os seus salvamentos locais e envia para o site do GitHub.

---

## 3. Comandos Úteis de Consulta

* **Saber o que mudou:**

    ```bash
    git status
    ```

    (Mostra quais arquivos você alterou mas ainda não salvou).

* **Ver o histórico de alterações:**

    ```bash
    git log --oneline
    ```

    (Lista os últimos salvamentos que foram feitos).

---

## 4. Dicas Importantes

1. **Faça Commits pequenos:** É melhor salvar 5 vezes pequenas mudanças do que 1 vez só uma mudança gigante. Isso facilita encontrar erros.
2. **Sempre dê um `push` ao final do dia:** Assim você garante que seu trabalho está seguro na internet.
3. **Local do Projeto:** Lembre-se que sua pasta oficial agora é: `C:\Users\Nitro v15\Documents\GitHub\SimuladorHNT`.

---
*Este documento foi criado para ajudar na gestão do projeto SimuladorHNT.*

<!-- Teste do Script Automático - 20:17 -->
