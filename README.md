# Site de Anamnese Odontológica — Dra. Jaqueline Nobre Moratore

Site estático para preenchimento de ficha de anamnese antes da consulta, com assinatura digital,
geração automática de PDF, envio por e-mail personalizado e armazenamento no Google Drive.

## Estrutura do projeto

```
dentista-site/
├── index.html          → Página principal (formulário)
├── styles.css           → Estilo visual (branco + rosa, animações)
├── script.js             → Lógica do formulário, validação, assinatura e envio
├── config.js             → URL do Google Apps Script (backend)
├── AppsScript-Code.gs    → Código do backend (Google Apps Script)
├── pdf-template.html     → Template usado pelo Apps Script para gerar o PDF
└── README.md
```

## Passo a passo de implantação

### 1. GitHub Pages (frontend)
1. Crie um repositório no GitHub, ex: `anamnese-jaqueline`.
2. Faça upload de `index.html`, `styles.css`, `script.js` e `config.js`.
3. Vá em **Settings > Pages** → Branch: `main` → Salvar.
4. Seu site ficará disponível em `https://seuusuario.github.io/anamnese-jaqueline/`.

### 2. Google Drive (armazenamento dos PDFs)
1. Crie uma pasta no Google Drive, ex: "Fichas de Anamnese - Pacientes".
2. Copie o ID da pasta (está na URL, após `/folders/`).
3. Cole esse ID na constante `FOLDER_ID` do arquivo `AppsScript-Code.gs`.

### 3. Google Apps Script (backend)
1. Acesse [script.google.com](https://script.google.com) e crie um novo projeto.
2. Renomeie o arquivo padrão `Code.gs` e cole o conteúdo de `AppsScript-Code.gs`.
3. Crie um novo arquivo HTML chamado exatamente `pdf-template` (Arquivo > Novo > HTML) e cole o conteúdo de `pdf-template.html`.
4. Ajuste `FOLDER_ID` com o ID copiado no passo anterior.
5. Clique em **Implantar > Nova implantação**:
   - Tipo: **Aplicativo da Web**
   - Executar como: **Eu (sua conta Google)**
   - Quem pode acessar: **Qualquer pessoa**
6. Autorize as permissões solicitadas (Gmail e Drive).
7. Copie a **URL do Web App** gerada.

### 4. Conectar frontend e backend
1. Abra `config.js` no seu repositório GitHub.
2. Substitua `SUA_URL_DO_APPS_SCRIPT_AQUI` pela URL copiada no passo anterior.
3. Faça commit e aguarde a atualização do GitHub Pages (leva ~1 min).

## Fluxo de funcionamento

1. Paciente acessa o site e preenche a ficha em 4 etapas.
2. Ao confirmar e assinar, os dados são enviados ao Google Apps Script via `fetch` (POST JSON).
3. O Apps Script gera um PDF formatado com identidade visual da clínica.
4. O PDF é salvo automaticamente na pasta predefinida do Google Drive, nomeado como
   `Nome do Paciente - DD-MM-AAAA.pdf`.
5. Um e-mail personalizado é enviado ao paciente com o PDF em anexo.
6. A Dra. Jaqueline recebe uma notificação por e-mail com o link do arquivo no Drive.

## Alterações feitas nesta revisão

- **Nova pergunta**: "Qual sua música ou banda favorita?" adicionada na seção de Perfil Comportamental.
- **Lógica invertida na "Primeira visita ao dentista"**: agora, se o paciente responder **Não**
  (ou seja, já foi ao dentista antes), aparecem as perguntas sobre histórico de visitas anteriores
  (último tratamento, abandono de tratamento, anestesia prévia, frequência de visitas). Se responder
  **Sim** (primeira vez), essas perguntas ficam ocultas e são limpas automaticamente, pois não fazem sentido.
- **Corrigido bug da assinatura não aparecer no PDF**: o template usava a tag `<?= ?>` do Apps Script,
  que aplica escape HTML automaticamente. Isso corrompia a string base64 da imagem (data URI),
  trocando caracteres como `+` e `&` por entidades HTML e quebrando a imagem no PDF. A correção
  troca essa tag por `<?!= ?>`, que imprime o valor sem escape, preservando a imagem intacta.
- **Corrigido bug dos emojis quebrados (�) no e-mail do paciente**: o corpo do e-mail usava
  caracteres emoji unicode diretamente no código (🦷 💗 📞 ✉ 🌸), que alguns clientes de e-mail e
  codificações intermediárias não processam corretamente, gerando caracteres corrompidos.
  A correção substitui todos os emojis e acentos por entidades HTML numéricas (ex: `&#128155;`
  para 💗, `&aacute;` para á), garantindo exibição correta em qualquer cliente de e-mail (Gmail,
  Outlook, iOS Mail, etc.).

## Boas práticas aplicadas

- Formulário em etapas (multi-step) com barra de progresso.
- Campos e blocos condicionais que só aparecem quando fazem sentido para a resposta dada.
- Validação client-side antes de avançar cada etapa e antes do envio final.
- Assinatura digital via canvas, compatível com mouse e toque.
- Separação de responsabilidades: `config.js` isola a URL do backend.
- Design responsivo com grid adaptável para mobile.
- Uso de entidades HTML em vez de unicode bruto no e-mail, garantindo compatibilidade universal.
- Uso de impressão sem escape (`<?!= ?>`) apenas onde estritamente necessário (imagem base64),
  mantendo escape padrão em todo o restante do template para evitar injeção de HTML.

## Expansões futuras sugeridas

- Adicionar autenticação simples (ex: senha da clínica) para uma área administrativa de fichas.
- Criar um dashboard em Google Sheets vinculado, registrando cada envio automaticamente.
- Adicionar reCAPTCHA para evitar envios automatizados/spam.
- Migrar para um domínio próprio usando GitHub Pages + DNS customizado.

## Suporte
Qualquer erro no envio aparecerá na tela do formulário com uma mensagem descritiva, e o Apps
Script pode ser depurado em **Execuções** dentro do próprio editor do Google Apps Script.
