// ===== CONFIGURAÇÕES GERAIS =====
// URL da Web App do Google Apps Script (substitua pela sua)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwPvHfQMB57uB5uQEzZlCf0CPZ-UI5OhK9awGpzwgkkMpM_w13gJ5XhF0hcjjH7wmF/exec';

// Objeto que armazena todas as respostas do formulário
let formData = {};

// Instância do pad de assinatura
let signaturePad = null;

// ===== LISTA DE PERGUNTAS =====
// As perguntas são organizadas em grupos para facilitar a manutenção.
// Cada pergunta pode ter propriedades como 'type', 'required', 'conditional', etc.
const questions = {
    // Dados Pessoais (já definidos no HTML)
    pessoais: [
        { id: 'nome', label: 'Nome Completo', type: 'text', required: true },
        { id: 'nascimento', label: 'Data de Nascimento', type: 'date', required: true },
        { id: 'genero', label: 'Gênero', type: 'select', options: ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'], required: true },
        { id: 'telefone', label: 'Telefone/WhatsApp', type: 'tel', required: true },
        { id: 'email', label: 'E‑mail', type: 'email', required: true },
        { id: 'endereco', label: 'Endereço Completo', type: 'textarea', required: true },
        { id: 'profissao', label: 'Profissão', type: 'text', required: false },
        { id: 'rg', label: 'RG', type: 'text', required: false },
        { id: 'cpf', label: 'CPF', type: 'text', required: true },
        { id: 'autorizaImagem', label: 'Autoriza o uso de imagem?', type: 'select', options: ['Sim', 'Não'], required: true }
    ],

    // Histórico Médico (perguntas condicionais)
    historico: [
        { id: 'prefMusical', label: 'Tem preferência musical?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualMusica', label: 'Qual?', type: 'text', required: true } } },
        { id: 'tratamentoMedico', label: 'Está em algum tratamento médico?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualTratamento', label: 'Qual?', type: 'text', required: true } } },
        { id: 'tomaMedicacao', label: 'Toma alguma medicação?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualMedicacao', label: 'Qual?', type: 'text', required: true } } },
        { id: 'submeteuCirurgia', label: 'Já se submeteu a alguma cirurgia?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualCirurgia', label: 'Qual?', type: 'text', required: true } } },
        { id: 'submeteuAnestesia', label: 'Já se submeteu a anestesia odontológica?', type: 'radio', options: ['Sim', 'Não'], required: true },
        { id: 'alergiaMedicacao', label: 'Possui alergia a alguma medicação ou anestesia?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualAlergiaMed', label: 'Qual?', type: 'text', required: true } } },
        { id: 'alergiaAlimento', label: 'Possui alergia a algum alimento?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualAlergiaAli', label: 'Qual?', type: 'text', required: true } } },
        { id: 'alteracaoCardiologica', label: 'Possui alguma alteração cardiológica?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualCardio', label: 'Qual?', type: 'text', required: true } } },
        { id: 'diabetico', label: 'É diabético?', type: 'radio', options: ['Sim', 'Não'], required: true },
        { id: 'convulsoes', label: 'Tem convulsões ou epilepsia?', type: 'radio', options: ['Sim', 'Não'], required: true },
        { id: 'disfuncaoRenal', label: 'Tem alguma disfunção renal?', type: 'radio', options: ['Sim', 'Não'], required: true },
        { id: 'problemaCoagulacao', label: 'Tem problema de coagulação sanguínea?', type: 'radio', options: ['Sim', 'Não'], required: true },
        { id: 'gravidaLactante', label: 'Grávida ou lactante?', type: 'select', options: ['Sim', 'Não', 'Não se aplica'], required: true },
        { id: 'problemaHormonal', label: 'Possui algum problema hormonal?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualProblemaHormonal', label: 'Qual?', type: 'text', required: true } } },
        { id: 'alergiaCosmeticos', label: 'Possui alergia a produtos ou cosméticos?', type: 'radio', options: ['Sim', 'Não'], required: true,
          conditional: { sim: { id: 'qualAlergiaCosmetico', label: 'Qual?', type: 'text', required: true } } }
    ],

    // Hábitos de Higiene Bucal
    higiene: [
        { id: 'freqEscovacao', label: 'Com qual frequência escova os dentes?', type: 'text', required: true },
        { id: 'usoFioDental', label: 'Faz uso de fio dental?', type: 'select', options: ['Sim', 'Não', 'Às vezes'], required: true },
        { id: 'cremeDental', label: 'Qual creme dental usa?', type: 'text', required: true },
        { id: 'escovaLingua', label: 'Escova regularmente a língua?', type: 'select', options: ['Sim', 'Não', 'Às vezes'], required: true },
        { id: 'marcaEscova', label: 'Qual a marca da sua escova de dentes?', type: 'text', required: true },
        { id: 'mordeObjetos', label: 'Morde objetos?', type: 'select', options: ['Sim', 'Não', 'Às vezes'], required: true },
        { id: 'rangeDentes', label: 'Range os dentes?', type: 'select', options: ['Sim', 'Não', 'Não sei'], required: true },
        { id: 'roiUnhas', label: 'Rói as unhas?', type: 'select', options: ['Sim', 'Não', 'Às vezes'], required: true }
    ]
};

// ===== INICIALIZAÇÃO DA PÁGINA =====
document.addEventListener('DOMContentLoaded', function() {
    // 1. Renderiza as perguntas dinâmicas (histórico médico e hábitos)
    renderQuestionGroup('historicoMedico', questions.historico);
    renderQuestionGroup('habitosHigiene', questions.higiene);

    // 2. Inicializa o pad de assinatura
    const canvas = document.getElementById('signatureCanvas');
    if (canvas) {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
    }

    // 3. Ajusta o canvas para alta resolução (DPI)
    resizeSignatureCanvas();

    // 4. Adiciona os event listeners
    setupEventListeners();
});

// ===== FUNÇÃO PARA RENDERIZAR UM GRUPO DE PERGUNTAS =====
function renderQuestionGroup(containerId, questionArray) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Limpa o conteúdo anterior

    questionArray.forEach(q => {
        const div = document.createElement('div');
        div.className = 'form-group full-width';
        div.id = `group-${q.id}`;

        // Cria o label
        const label = document.createElement('label');
        label.htmlFor = q.id;
        label.textContent = q.label;
        if (q.required) label.setAttribute('required', '');
        div.appendChild(label);

        // Cria o input/select/textarea conforme o tipo
        let input;
        if (q.type === 'select' || q.type === 'radio') {
            if (q.type === 'select') {
                input = document.createElement('select');
                input.id = q.id;
                input.name = q.id;
                if (q.required) input.required = true;
                // Adiciona a opção padrão
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Selecione';
                input.appendChild(defaultOption);
                // Adiciona as opções
                q.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    input.appendChild(option);
                });
            } else if (q.type === 'radio') {
                // Para rádio, cria um container com os botões
                const radioContainer = document.createElement('div');
                radioContainer.className = 'radio-group';
                q.options.forEach(opt => {
                    const radioWrapper = document.createElement('div');
                    radioWrapper.style.display = 'inline-block';
                    radioWrapper.style.marginRight = '15px';

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.id = `${q.id}_${opt}`;
                    radio.name = q.id;
                    radio.value = opt;
                    if (q.required) radio.required = true;

                    const radioLabel = document.createElement('label');
                    radioLabel.htmlFor = `${q.id}_${opt}`;
                    radioLabel.textContent = opt;
                    radioLabel.style.marginLeft = '5px';

                    radioWrapper.appendChild(radio);
                    radioWrapper.appendChild(radioLabel);
                    radioContainer.appendChild(radioWrapper);
                });
                div.appendChild(radioContainer);
                input = radioContainer; // apenas para referência
            }
        } else {
            // Inputs de texto, data, e‑mail, etc.
            input = document.createElement(q.type === 'textarea' ? 'textarea' : 'input');
            input.id = q.id;
            input.name = q.id;
            input.type = q.type;
            if (q.required) input.required = true;
            if (q.type === 'textarea') input.rows = 2;
        }

        if (input && input.tagName !== 'DIV') div.appendChild(input);

        // Se a pergunta tem condicional, cria o campo condicional (inicialmente oculto)
        if (q.conditional) {
            const conditionalDiv = document.createElement('div');
            conditionalDiv.id = `conditional-${q.id}`;
            conditionalDiv.className = 'conditional-field';
            conditionalDiv.style.display = 'none';

            const conditionalLabel = document.createElement('label');
            conditionalLabel.htmlFor = q.conditional.sim.id;
            conditionalLabel.textContent = q.conditional.sim.label;
            if (q.conditional.sim.required) conditionalLabel.setAttribute('required', '');

            const conditionalInput = document.createElement('input');
            conditionalInput.type = 'text';
            conditionalInput.id = q.conditional.sim.id;
            conditionalInput.name = q.conditional.sim.id;
            if (q.conditional.sim.required) conditionalInput.required = true;

            conditionalDiv.appendChild(conditionalLabel);
            conditionalDiv.appendChild(conditionalInput);
            div.appendChild(conditionalDiv);
        }

        container.appendChild(div);
    });

    // Após renderizar, adiciona os listeners para os condicionais
    attachConditionalListeners(questionArray);
}

// ===== FUNÇÃO PARA ATRELAR LISTENERS A CAMPOS CONDICIONAIS =====
function attachConditionalListeners(questionArray) {
    questionArray.forEach(q => {
        if (q.conditional) {
            // Para rádio, observa todos os botões com o mesmo name
            const radios = document.querySelectorAll(`input[name="${q.id}"]`);
            radios.forEach(radio => {
                radio.addEventListener('change', function() {
                    const conditionalDiv = document.getElementById(`conditional-${q.id}`);
                    if (this.value === 'Sim') {
                        conditionalDiv.style.display = 'block';
                        conditionalDiv.querySelector('input').required = true;
                    } else {
                        conditionalDiv.style.display = 'none';
                        conditionalDiv.querySelector('input').required = false;
                    }
                });
            });
        }
    });
}

// ===== AJUSTE DO CANVAS DE ASSINATURA PARA ALTA DPI =====
function resizeSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    if (signaturePad) signaturePad.clear(); // Limpa após redimensionar
}

window.addEventListener('resize', resizeSignatureCanvas);

// ===== CONFIGURAÇÃO DOS EVENT LISTENERS =====
function setupEventListeners() {
    // 1. Envio do formulário principal (vai para a revisão)
    const form = document.getElementById('anamneseForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                collectFormData();
                showReviewSection();
            }
        });
    }

    // 2. Botão "Limpar Assinatura"
    const clearBtn = document.getElementById('clearSignature');
    if (clearBtn) clearBtn.addEventListener('click', () => signaturePad.clear());

    // 3. Botão "Confirmar Assinatura"
    const saveSigBtn = document.getElementById('saveSignature');
    if (saveSigBtn) {
        saveSigBtn.addEventListener('click', function() {
            if (signaturePad.isEmpty()) {
                alert('Por favor, assine no quadro antes de confirmar.');
                return;
            }
            // Salva a assinatura como Data URL no objeto formData
            formData.assinatura = signaturePad.toDataURL();
            document.getElementById('enviarFinal').disabled = false;
            alert('Assinatura confirmada! Agora você pode enviar o formulário.');
        });
    }

    // 4. Botão "Enviar Formulário e Gerar PDF"
    const enviarFinalBtn = document.getElementById('enviarFinal');
    if (enviarFinalBtn) {
        enviarFinalBtn.addEventListener('click', function() {
            if (!formData.assinatura) {
                alert('Por favor, confirme sua assinatura antes de enviar.');
                return;
            }
            sendDataToGoogleScript();
        });
    }

    // 5. Botão "Voltar para Editar"
    const voltarBtn = document.getElementById('voltarEditar');
    if (voltarBtn) voltarBtn.addEventListener('click', function() {
        document.getElementById('revisaoSection').style.display = 'none';
        document.getElementById('anamneseForm').style.display = 'block';
    });

    // 6. Botões do pop‑up
    const downloadBtn = document.getElementById('downloadPDF');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadPDF);
    const closePopupBtn = document.getElementById('closePopup');
    if (closePopupBtn) closePopupBtn.addEventListener('click', () => window.location.href = 'index.html');
}

// ===== VALIDAÇÃO DO FORMULÁRIO =====
function validateForm() {
    const requiredInputs = document.querySelectorAll('#anamneseForm [required]');
    let valid = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            valid = false;
            input.style.borderColor = 'red';
            input.addEventListener('input', function() {
                this.style.borderColor = '';
            });
        }
    });

    if (!valid) alert('Por favor, preencha todos os campos obrigatórios (marcados com *).');
    return valid;
}

// ===== COLETA DOS DADOS DO FORMULÁRIO =====
function collectFormData() {
    formData = {}; // Limpa dados anteriores

    // Coleta dos campos do formulário
    const formElements = document.getElementById('anamneseForm').elements;
    for (let el of formElements) {
        if (el.name && (el.type !== 'radio' || el.checked)) {
            formData[el.name] = el.value;
        }
    }

    // Coleta dos campos condicionais (que podem estar ocultos)
    const conditionalInputs = document.querySelectorAll('.conditional-field input');
    conditionalInputs.forEach(input => {
        if (input.value) formData[input.name] = input.value;
    });
}

// ===== EXIBIÇÃO DA SEÇÃO DE REVISÃO =====
function showReviewSection() {
    // Esconde o formulário e mostra a seção de revisão
    document.getElementById('anamneseForm').style.display = 'none';
    const revisaoSection = document.getElementById('revisaoSection');
    revisaoSection.style.display = 'block';

    // Preenche o resumo com os dados coletados
    const resumoDiv = document.getElementById('resumoRevisao');
    resumoDiv.innerHTML = '';

    for (const key in formData) {
        if (formData[key]) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${getLabel(key)}:</strong> ${formData[key]}`;
            resumoDiv.appendChild(p);
        }
    }

    // Rola a página para a seção de revisão
    revisaoSection.scrollIntoView({ behavior: 'smooth' });
}

// Função auxiliar para obter o label de um campo (simplificada)
function getLabel(fieldId) {
    const allQuestions = [...questions.pessoais, ...questions.historico, ...questions.higiene];
    const q = allQuestions.find(q => q.id === fieldId);
    return q ? q.label : fieldId;
}

// ===== ENVIO DOS DADOS PARA O GOOGLE APPS SCRIPT =====
function sendDataToGoogleScript() {
    // Mostra um indicador de carregamento
    const enviarBtn = document.getElementById('enviarFinal');
    enviarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    enviarBtn.disabled = true;

    // Adiciona a data/hora do envio
    formData.dataEnvio = new Date().toLocaleString('pt-BR');

    // Envia os dados via POST para o Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Modo 'no-cors' para evitar problemas de CORS com o Google Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        // Após o envio, gera o PDF localmente e mostra o pop‑up
        generatePDF();
        showPopup();
    })
    .catch(error => {
        console.error('Erro ao enviar dados:', error);
        alert('Houve um problema ao enviar os dados. Tente novamente.');
    })
    .finally(() => {
        // Restaura o botão
        enviarBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Formulário e Gerar PDF';
        enviarBtn.disabled = false;
    });
}

// ===== GERAÇÃO DO PDF NO CLIENTE =====
function generatePDF() {
    // Esta função gera o PDF localmente para download imediato.
    // O PDF gerado aqui NÃO é o mesmo que será salvo no Drive (isso é feito pelo Google Script).
    // Criamos um HTML temporário com os dados para converter em PDF.

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    let y = margin;

    // Título
    doc.setFontSize(20);
    doc.setTextColor(231, 84, 128); // Rosa
    doc.text('Formulário de Anamnese Odontológica', margin, y);
    y += 10;

    // Subtítulo
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Paciente: ${formData.nome} | Data: ${formData.dataEnvio}`, margin, y);
    y += 15;

    // Linha divisória
    doc.setDrawColor(231, 84, 128);
    doc.line(margin, y, 190, y);
    y += 10;

    // Dados do paciente
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const fields = [
        'Nome Completo', 'Data de Nascimento', 'Gênero', 'Telefone', 'E‑mail',
        'Endereço', 'Profissão', 'RG', 'CPF', 'Autoriza o uso de imagem?'
    ];
    fields.forEach(field => {
        if (formData[field]) {
            doc.text(`${field}: ${formData[field]}`, margin, y);
            y += 7;
        }
    });

    // Adiciona uma nova página se necessário e inclui a assinatura
    if (y > 250) {
        doc.addPage();
        y = margin;
    }

    // Insere a assinatura (se existir)
    if (formData.assinatura) {
        y += 10;
        doc.text('Assinatura do Paciente:', margin, y);
        y += 5;
        // A assinatura é uma Data URL (imagem PNG). Reduzimos sua qualidade para caber no PDF.
        doc.addImage(formData.assinatura, 'PNG', margin, y, 80, 30);
    }

    // Salva o PDF localmente com um nome baseado no nome do paciente
    const fileName = `${formData.nome.replace(/\s/g, '_')}_anamnese.pdf`;
    doc.save(fileName);

    // Armazena o PDF gerado para possível re‑download
    window.generatedPDF = doc;
}

// ===== EXIBIÇÃO DO POP‑UP DE CONFIRMAÇÃO =====
function showPopup() {
    const popup = document.getElementById('confirmPopup');
    popup.style.display = 'flex';
}

// ===== DOWNLOAD DO PDF (a partir do pop‑up) =====
function downloadPDF() {
    if (window.generatedPDF) {
        const fileName = `${formData.nome.replace(/\s/g, '_')}_anamnese.pdf`;
        window.generatedPDF.save(fileName);
    }
    // Fecha o pop‑up e redireciona para a página inicial
    document.getElementById('confirmPopup').style.display = 'none';
    setTimeout(() => window.location.href = 'index.html', 300);
}
