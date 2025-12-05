# Sistema de Anamnese Odontológica

Sistema completo para coleta de anamnese odontológica desenvolvido para Dra. Jaqueline Nobre Moratore.

## 🚀 Funcionalidades

- ✅ Formulário de anamnese completo em 5 seções
- ✅ Design moderno e responsivo (cores rosa/branco)
- ✅ Validação em tempo real dos campos
- ✅ Assinatura digital do paciente
- ✅ Geração automática de PDF
- ✅ Salva PDF no Google Drive com nome personalizado
- ✅ Atualiza planilha Google Sheets com os dados
- ✅ Envio automático de email para o paciente
- ✅ Botão de download do PDF no site
- ✅ Retorno à página inicial após envio

## 🛠️ Tecnologias Utilizadas

- HTML5, CSS3, JavaScript (ES6+)
- Google Apps Script (Back-end)
- Google Drive API (Armazenamento)
- Google Sheets API (Registro)
- Gmail API (Envio de emails)
- jsPDF + html2canvas (Geração de PDF)
- Signature Pad (Assinatura digital)

## 📁 Estrutura de Arquivos
anamnese-odontologica/
├── index.html # Estrutura principal
├── style.css # Estilos CSS
├── script.js # Lógica JavaScript
└── README.md # Esta documentação


## 🔧 Configuração do Projeto

### 1. Configuração no GitHub

1. Crie um repositório no GitHub
2. Faça upload dos 3 arquivos (index.html, style.css, script.js)
3. Ative o GitHub Pages:
   - Settings > Pages
   - Source: Branch main
   - Folder: / (root)
   - Salve

### 2. Configuração do Google Apps Script

#### Passo 1: Criar o Script
1. Acesse https://script.google.com
2. Clique em "Novo Projeto"
3. Cole o código do arquivo `appscript.js`
4. Salve como "Anamnese Odontológica"

#### Passo 2: Configurar Variáveis
No arquivo do Google Apps Script, atualize:
```javascript
const DRIVE_FOLDER_ID = 'COLE_O_ID_DA_PASTA_AQUI';
const SPREADSHEET_ID = 'COLE_O_ID_DA_PLANILHA_AQUI';
