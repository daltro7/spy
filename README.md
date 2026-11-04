# 🎯 Meta Ad Miner Pro

Plataforma estática de mineração e validação de ofertas da **Biblioteca de Anúncios do Meta (Meta Ad Library)**, projetada especialmente para ser hospedada gratuitamente no **GitHub Pages** ou executada localmente para seu uso pessoal.

---

## 🚀 Principais Funcionalidades

- **🔥 Filtro de Ofertas Validadas (+10 dias no ar):** Identifique anúncios que estão rodando há semanas ininterruptamente (o principal sinal de ofertas lucrativas e validadas).
- **🔎 Filtro por Link e Domínio:** Filtre ofertas por domínios específicos (ex: `kiwify`, `hotmart`, `shopify`, `cartpanda`, etc.).
- **⚡ Status Flexível:** Filtre por apenas anúncios Ativos (`ACTIVE`), Inativos (`INACTIVE`) ou Ambos (`ALL`).
- **📊 Métricas em Tempo Real:** Total de anúncios minerados, anúncios validados (+10d), tempo médio de veiculação e anúncio mais antigo (campeão de escala).
- **💾 Swipe File Local:** Salve anúncios campeões diretamente no seu navegador com 1 clique para montar sua esteira de referências.
- **📥 Exportação de Dados:** Exporte os resultados para planilha **CSV (Excel)** ou arquivo **JSON** estruturado.
- **🛡️ 100% Seguro & Privado:** O seu Token de Acesso da Meta fica armazenado exclusivamente no `localStorage` do seu navegador. Nenhum dado é compartilhado com terceiros.
- **✨ Modo Demonstração Embutido:** Teste toda a interface, filtros e recursos instantaneamente antes mesmo de configurar sua chave da Meta.

---

## 📦 Como Publicar no GitHub Pages (Passo a Passo)

Como a aplicação é 100% estática (HTML, CSS e JavaScript), o processo de publicação no GitHub leva menos de 2 minutos:

### Passo 1: Criar o Repositório no GitHub
1. Acesse [github.com](https://github.com) e crie um novo repositório (pode ser **Público** ou **Privado**).
2. Dê um nome, por exemplo: `meta-ad-miner`.

### Passo 2: Subir os Arquivos
Envie para a raiz do repositório os arquivos da pasta:
* `index.html`
* `app.js`
* `style.css`
* `README.md`

*(Você pode subir diretamente arrastando os arquivos na interface web do GitHub ou via terminal com `git push`).*

### Passo 3: Ativar o GitHub Pages
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment** &rarr; **Source**, selecione `Deploy from a branch`.
4. Escolha a branch `main` (ou `master`) e a pasta `/ (root)`.
5. Clique em **Save**.
6. Aguarde cerca de 1 minuto: o GitHub fornecerá o link da sua plataforma online (ex: `https://seu-usuario.github.io/meta-ad-miner/`).

---

## 🔑 Como Obter o Token de Acesso da Meta (Grátis)

A Meta disponibiliza a API da Biblioteca de Anúncios gratuitamente para desenvolvedores:

1. Acesse o portal [developers.facebook.com](https://developers.facebook.com) e faça login com seu Facebook.
2. Vá em **Meus Apps** &rarr; **Criar App**.
3. Escolha o tipo **Outro** ou **Empresa** e dê um nome qualquer (ex: `Minerador Pessoal`).
4. Após criar, acesse o **Explorador da Graph API**:
   👉 [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer/)
5. No campo **Aplicativo da Meta**, selecione o app que você acabou de criar.
6. Clique no botão azul **Generate Access Token**.
7. Copie o token gerado (começa com `EAAB...`).
8. Abra o seu **AdMiner Pro**, clique no botão **Configurar Token** no topo da página e cole-o!

---

## 🌐 Como Rodar Localmente no seu Computador

Se preferir rodar no seu próprio computador sem precisar de internet ou GitHub Pages:

Basta dar um duplo clique no arquivo `index.html` para abrir diretamente no seu navegador Google Chrome, Edge, Brave ou Firefox!

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & Vanilla JavaScript Moderno (ES6+)**
- **Tailwind CSS** (via CDN)
- **Lucide Icons**
- **Meta Graph API v21.0** (`ads_archive`)
