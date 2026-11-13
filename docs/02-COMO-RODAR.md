# 2. Como baixar, instalar e abrir o app

> **Para quem é este documento:** para quem quer ver o app funcionando no computador (num celular de mentira,
> o **emulador**) ou no próprio celular. Siga os passos na ordem.
>
> Antes: [1. O projeto](01-O-PROJETO.md) · Depois: [3. Conceitos de código](03-CONCEITOS-DE-CODIGO.md)

---

## 2.1. O que vamos fazer (resumo)

Para o app funcionar, **duas coisas** precisam estar rodando ao mesmo tempo:

1. **A API** (o "garçom"), no seu computador.
2. **O app**, num celular de verdade ou num **emulador** (um celular Android que roda dentro do computador).

O banco de dados (Supabase) já está na internet, então não precisa ligar nada dele.

```text
Passo 1  Instalar os programas          (só na primeira vez)
Passo 2  Baixar o projeto               (só na primeira vez)
Passo 3  Configurar a API (.env)        (só na primeira vez)
Passo 4  Ligar a API                    (toda vez)
Passo 5  Abrir o emulador               (toda vez)
Passo 6  Ligar o app                    (toda vez)
```

> **Terminal:** muitos passos usam o **terminal**, uma janela onde você digita comandos em vez de clicar.
> No Windows, abra o menu Iniciar e procure **"PowerShell"** ou **"Terminal"**. Os comandos aparecem
> assim neste documento:
> ```powershell
> node --version
> ```
> Digite (ou cole) o comando e aperte **Enter**.

---

## 2.2. Passo 1: instalar os programas

| Programa | Para quê | Onde baixar |
|---|---|---|
| **Node.js** (versão 20 ou mais nova; usamos a 24) | Roda a API e as ferramentas do app | [nodejs.org](https://nodejs.org) → botão "LTS" |
| **Android Studio** | Traz o **emulador** Android | [developer.android.com/studio](https://developer.android.com/studio) |
| **VS Code** (opcional) | Para ler e editar o código com cores e organização | [code.visualstudio.com](https://code.visualstudio.com) |
| **Git** (opcional) | Para baixar o projeto pelo terminal e enviar mudanças | [git-scm.com](https://git-scm.com) |

Depois de instalar o Node.js, **feche e abra o terminal** e confira:

```powershell
node --version
npm --version
```

Se aparecerem números (por exemplo `v24.1.0`), deu certo.

> **O que é o `npm`?** Ele vem junto com o Node.js. É a "loja" de bibliotecas: baixa os pedaços de código
> prontos que o projeto usa. Mais em [Conceitos de código](03-CONCEITOS-DE-CODIGO.md#36-pacotes-npm-e-packagejson).

---

## 2.3. Passo 2: baixar o projeto

O projeto está no GitHub, na branch **`branch-estruturada-kelven`** do repositório
[TyagoAlves/Clinica-PSI-Expo-version](https://github.com/TyagoAlves/Clinica-PSI-Expo-version/tree/branch-estruturada-kelven).

### Jeito 1: sem Git (mais fácil)

1. Abra o link acima no navegador.
2. Confira se no botão de branch (canto esquerdo, acima dos arquivos) aparece `branch-estruturada-kelven`.
3. Clique no botão verde **`<> Code`** → **Download ZIP**.
4. Extraia o ZIP numa pasta **fora do OneDrive**, por exemplo `C:\dev\`.
   (O OneDrive tenta sincronizar milhares de arquivos pequenos e deixa tudo lento.)

### Jeito 2: com Git

```powershell
cd C:\dev
git clone --branch branch-estruturada-kelven https://github.com/TyagoAlves/Clinica-PSI-Expo-version.git clinica-psi
cd clinica-psi
```

> **`cd`** quer dizer "change directory": entra numa pasta. Todos os próximos comandos supõem que você
> está dentro da pasta do projeto.

---

## 2.4. Passo 3: configurar a API (arquivo `.env`)

A API precisa de duas informações secretas, que **não estão no GitHub** de propósito:

- **`DATABASE_URL`**: o endereço do banco de dados, com a senha.
- **`DATA_ENCRYPTION_KEY`**: a chave que embaralha (criptografa) os dados sensíveis dos pacientes.

Elas ficam num arquivo chamado **`.env`** dentro da pasta `api/`. Para criar:

1. Na pasta `api/`, faça uma cópia do arquivo **`.env.example`** e renomeie a cópia para **`.env`**.
2. Abra o `.env` no Bloco de Notas ou no VS Code.
3. Preencha:
   - `DATABASE_URL=` → **peça a quem criou o projeto no Supabase**. Se for usar o seu próprio Supabase,
     veja [Banco de dados → criar o seu](04-BANCO-DE-DADOS.md#48-como-criar-um-banco-no-supabase-do-zero).
   - `DATA_ENCRYPTION_KEY=` → **peça a mesma chave ao dono do Supabase**.

> ⚠️ **A chave precisa ser a mesma para todo mundo que usa o mesmo banco.** Os dados foram embaralhados
> com ela. Com outra chave, a API não consegue "desembaralhar" e dá erro.
> Só gere uma chave nova (`npm run gen:key`) se for usar um banco **novo e vazio**.

> 🔒 **Nunca** mande o `.env` para o GitHub nem cole o conteúdo dele em grupos. O arquivo `.gitignore`
> já impede o Git de enviar o `.env` por engano.

---

## 2.5. Passo 4: ligar a API

Abra um terminal **só para a API** e deixe-o aberto:

```powershell
cd api
npm install
npm run dev
```

- `npm install` baixa as bibliotecas (só precisa na primeira vez ou quando o `package.json` mudar).
  Cria uma pasta `node_modules` grande. É normal.
- `npm run dev` liga a API. Deve aparecer algo como:

```text
[api] clinica-api ouvindo em http://127.0.0.1:3333 ... banco PostgreSQL aws-1-us-east-1.pooler.supabase.com:5432
```

**Teste:** abra no navegador `http://127.0.0.1:3333/health`. Deve aparecer `{"status":"ok",...}`.

Para desligar a API: clique no terminal e aperte **Ctrl + C**.

---

## 2.6. Passo 5: abrir o emulador

O **emulador** é um celular Android de mentira que roda numa janela do computador.

### Primeira vez: criar o celular virtual

1. Abra o **Android Studio**.
2. Na tela inicial, clique em **More Actions → Virtual Device Manager** (ou **Device Manager**).
3. Clique em **Create device** (ou no **+**).
4. Escolha um modelo, por exemplo **Pixel 7**, e clique em **Next**.
5. Escolha uma versão do Android (usamos **API 35 / Android 15**). Se aparecer um ícone de download ao lado,
   clique para baixar. Clique em **Next** e depois **Finish**.

### Toda vez: ligar o emulador

- **Pelo Android Studio:** no Device Manager, clique no **▶** ao lado do celular criado.
- **Pelo nosso script** (só funciona se o celular virtual se chamar `ClinicaPsi_API35`, como no PC onde
  o projeto foi montado):
  ```powershell
  powershell -ExecutionPolicy Bypass -File tools\emulador.ps1
  ```

Espere o Android terminar de ligar (aparece a tela inicial do celular).

---

## 2.7. Passo 6: ligar o app

Abra **outro terminal** (o da API continua aberto) e rode:

```powershell
cd app
npm install
npx expo start
```

Vai aparecer um **QR code** e um menu. Com o emulador ligado, aperte a tecla **`a`** (de Android).

O que acontece:
1. O Expo instala sozinho o app **Expo Go** no emulador (só na primeira vez).
2. O Expo Go abre e carrega o Clínica Psi.
3. Aparece a tela de **Login**. Clique em **Cadastrar-se** para criar uma conta, ou entre com uma que já exista.

**Atalhos úteis no terminal do Expo:**

| Tecla | O que faz |
|---|---|
| `a` | Abre o app no emulador Android |
| `r` | Recarrega o app (use quando algo travar) |
| `j` | Abre a ferramenta de investigar erros (debugger) |
| `Ctrl + C` | Desliga o Expo |

> **O que é o Expo e o Expo Go?** O **Expo** é a ferramenta que "empacota" o nosso código e manda para o
> celular. O **Expo Go** é um app que fica no celular e sabe abrir esse pacote. Assim dá para testar o app
> sem publicar na Play Store. E, quando salvamos uma mudança no código, o app atualiza sozinho em 1 ou 2
> segundos (isso se chama **Fast Refresh**).

### Se o emulador não abrir o app

Às vezes o emulador não "enxerga" o computador pela rede. Rode estes dois comandos e tente de novo:

```powershell
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081 host.exp.exponent
```

(`adb` é a ferramenta do Android que conversa com o emulador. Ela vem com o Android Studio.)

---

## 2.8. Usar no celular de verdade (opcional)

É possível, mas exige mais configuração, porque o celular precisa achar a API que roda no seu computador.

1. O celular e o computador precisam estar **na mesma rede Wi-Fi**.
2. Descubra o **IP do computador**: no terminal, rode `ipconfig` e procure "Endereço IPv4"
   (algo como `192.168.0.15`).
3. No arquivo `api/.env`, troque `HOST=127.0.0.1` por `HOST=0.0.0.0` e religue a API.
   O Windows vai perguntar se libera o acesso na rede: clique em **Permitir**.
4. Na pasta `app/`, crie um arquivo `.env` com uma linha:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.0.15:3333
   ```
   (use o IP que você achou no passo 2).
5. Instale o **Expo Go** no celular (Play Store ou App Store).
6. Rode `npx expo start` na pasta `app/` e **leia o QR code** com o Expo Go (no Android) ou com a câmera (no iPhone).

> ⚠️ O Expo Go das lojas só abre projetos da versão mais recente do Expo. O nosso usa o **Expo SDK 52**.
> Se o Expo Go do celular disser que a versão é incompatível, use o emulador: nele, o `expo start`
> instala a versão certa do Expo Go sozinho.

---

## 2.9. Problemas comuns

| O que aparece | O que fazer |
|---|---|
| `node` não é reconhecido | O Node.js não foi instalado ou o terminal estava aberto antes. Feche e abra o terminal |
| "Sem conexão com o servidor" no app | A API não está ligada. Veja o terminal da API (passo 4) |
| `Porta 3333 já está em uso` | A API já está ligada em outro terminal. Use aquele ou feche-o |
| Erro sobre `DATABASE_URL` ou `DATA_ENCRYPTION_KEY` | O arquivo `api/.env` não existe ou está incompleto (passo 3) |
| Erro ao abrir dados de pacientes ("decifrar") | A `DATA_ENCRYPTION_KEY` é diferente da usada para gravar. Peça a chave certa |
| O app ficou "congelado" ou com tela vermelha | No terminal do Expo, aperte `r` |
| O app não abre no navegador (`w`) | É esperado: o login usa uma área segura que só existe no celular |

---

## 2.10. Conferir se o código está certo (para quem programa)

```powershell
cd api
npm run typecheck
npm test

cd ..\app
npm run typecheck
```

- `typecheck` confere se não há erros de "tipo" (por exemplo, usar um texto onde deveria ser um número).
- `npm test` roda os **40 testes automáticos** da API. Eles usam um banco de mentira, então não mexem no Supabase.
