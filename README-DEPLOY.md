# 🎻 Arco & Alma — Guia Completo de Deploy

## Arquitetura

```
Usuário (browser/celular)
        │
        ▼
   Vercel (index.html)          ← frontend estático
        │
        ├─── Supabase Auth      ← login email/senha
        ├─── Supabase DB        ← progresso salvo na nuvem
        └─── Supabase Edge Fn   ← chama OpenAI Vision (seguro)
                    │
                    ▼
               OpenAI GPT-4o    ← lê partituras
```

---

## PASSO 1 — Configurar o Supabase

### 1.1 Criar as tabelas

1. Abra seu projeto no [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** → **New query**
3. Cole o conteúdo do arquivo `supabase/migrations/001_schema.sql`
4. Clique **Run**

### 1.2 Configurar autenticação por email

1. Vá em **Authentication → Providers**
2. Confirme que **Email** está habilitado
3. Em **Authentication → Email Templates**, personalize se quiser
4. Em **Authentication → URL Configuration**, adicione a URL da sua Vercel:
   ```
   Site URL: https://arco-alma.vercel.app
   Redirect URLs: https://arco-alma.vercel.app
   ```
   *(ajuste com seu domínio real após o deploy)*

### 1.3 Pegar suas credenciais

1. Vá em **Settings → API**
2. Copie:
   - **Project URL** → ex: `https://xyzxyz.supabase.co`
   - **anon public key** → começa com `eyJ...`

---

## PASSO 2 — Configurar a Edge Function

### 2.1 Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Login e link com seu projeto

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

> O `project-ref` está na URL do seu projeto: `https://supabase.com/dashboard/project/SEU_PROJECT_REF`

### 2.3 Adicionar a chave da OpenAI como secret

```bash
supabase secrets set OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

> ⚠️ **A chave nunca vai para o frontend** — fica segura no servidor da Supabase.

### 2.4 Fazer deploy da Edge Function

```bash
supabase functions deploy analyze-score
```

Você verá algo como:
```
✓ Deploying function analyze-score...
✓ Done. Function deployed at:
  https://xyzxyz.supabase.co/functions/v1/analyze-score
```

---

## PASSO 3 — Configurar o index.html

Abra o `index.html` e localize este bloco perto do início:

```javascript
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'sua_anon_key_aqui';
```

Substitua com suas credenciais reais:

```javascript
const SUPABASE_URL = 'https://xyzxyz.supabase.co';        // sua Project URL
const SUPABASE_ANON_KEY = 'eyJhbGc...sua_anon_key...';    // sua anon key
```

Salve o arquivo.

---

## PASSO 4 — Deploy na Vercel

### 4.1 Criar repositório no GitHub

```bash
git init
git add .
git commit -m "feat: Arco & Alma — app completo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/arco-alma.git
git push -u origin main
```

### 4.2 Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique **Import Git Repository**
3. Selecione o repositório `arco-alma`
4. Configurações:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** *(deixe vazio)*
   - **Output Directory:** `./`
5. Clique **Deploy**

Em ~1 minuto seu app estará em:
```
https://arco-alma-XXXX.vercel.app
```

### 4.3 Atualizar URL no Supabase

Após ter a URL da Vercel, volte ao Supabase:
1. **Authentication → URL Configuration**
2. Atualize **Site URL** e **Redirect URLs** com sua URL real

---

## PASSO 5 — Testar

1. Abra o app no navegador
2. Crie uma conta com email e senha
3. Navegue pelas seções — o progresso deve salvar automaticamente
4. Abra no celular — o mesmo login funciona, progresso sincronizado

---

## Adicionar Livros III e IV do Dotzauer

Quando tiver os PDFs:
1. Me mande os arquivos
2. Incorporo da mesma forma que os Livros I e II
3. Faça `git push` e a Vercel atualiza automaticamente

---

## Estrutura de Arquivos

```
arco-alma/
├── index.html                              ← app completo (9 MB com PDFs)
├── vercel.json                             ← config Vercel
├── README-DEPLOY.md                        ← este guia
├── supabase/
│   ├── functions/
│   │   └── analyze-score/
│   │       └── index.ts                   ← Edge Function OpenAI Vision
│   └── migrations/
│       └── 001_schema.sql                 ← tabelas do banco
```

---

## Dúvidas Comuns

**P: O app pesa 9 MB — isso é um problema?**
R: Para a Vercel é tudo bem (limite de 100 MB por arquivo no deploy). O usuário baixa o HTML uma vez e fica em cache. Os Livros III e IV vão aumentar para ~18 MB no total.

**P: Minha chave OpenAI fica exposta?**
R: Não. Ela fica armazenada como secret na Supabase e só é usada dentro da Edge Function no servidor. O frontend nunca a vê.

**P: Quanto custa rodar?**
R: Supabase Free tier cobre até 50.000 usuários autenticados e 500 MB de banco — mais que suficiente para uso pessoal. Vercel Free é ilimitado para projetos pessoais. OpenAI cobra por uso (~$0.001 por análise de partitura com GPT-4o).

**P: E se eu esquecer a senha?**
R: Supabase tem recuperação por email nativo. Configure em Authentication → Email Templates.
