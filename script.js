/**
 * SISTEMA DE ANAMNESE ODONTOLÓGICA - FRONT-END
 * Desenvolvido para Dra. Jaqueline Nobre Moratore
 * Funções principais: Navegação, validação, geração de PDF e comunicação com Google Apps Script
 */

// ============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ============================================

// URL do Google Apps Script (DEVE SER ATUALIZADA APÓS PUBLICAR O SCRIPT)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwViX5fFhnmUR0OFwtShNKMY2JPDSKxNuF73DPceeGTo_nj7ocDP9nx0-rYHc0X2Vd8/exec";

// Estado do formulário
let currentSection = 1;
const totalSections = 5;
let signaturePad = null;
let generatedPdfUrl = null;

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================

/**
 * Inicializa a aplicação quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Anamnese inicializando...');
    
    initFormNavigation();
    initConditionalQuestions();
    initSignaturePad();
    updateProgressBar();
    updateConsentInfo();
    
    // Adiciona máscaras aos campos
    initInputMasks();
    
    // Atualiza informações de consentimento em tempo real
    document.getElementById('nome').addEventListener('input', updateConsentInfo);
    document.getElementById('rg').addEventListener('input', updateConsentInfo);
    
    // Configura o botão de download do PDF
    setupPdfDownload();
    
    console.log('Sistema de Anamnese inicializado com sucesso!');
});

/**
 * Inicializa a navegação entre as seções do formulário
 */
function initFormNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.addEventListener('click', navigateToPrevSection);
    nextBtn.addEventListener('click', navigateToNextSection);
    
    // Configura o evento de submit do formulário
    document.getElementById('anamneseForm').addEventListener('submit', handleFormSubmit);
    
    console.log('Navegação do formulário inicializada');
}

/**
 * Inicializa as perguntas condicionais (que aparecem quando seleciona "Sim")
 */
function initConditionalQuestions() {
    // Mapeamento dos campos condicionais
    const conditionalFields = [
        { trigger: 'prefereMusica', container: 'musicaEspecificaContainer', value: 'sim' },
        { trigger: 'tratamentoMedico', container: 'tratamentoEspecificoContainer', value: 'sim' },
        { trigger: 'tomaMedicacao', container: 'medicacaoEspecificaContainer', value: 'sim' },
        { trigger: 'cirurgia', container: 'cirurgiaEspecificaContainer', value: 'sim' },
        { trigger: 'anestesiaOdontologica', container: 'reacaoAnestesiaContainer', value: 'sim' },
        { trigger: 'alergiaMedicamento', container: 'alergiaMedicamentoEspecificaContainer', value: 'sim' },
        { trigger: 'alergiaAlimento', container: 'alergiaAlimentoEspecificaContainer', value: 'sim' },
        { trigger: 'alteracaoCardiologica', container: 'alteracaoCardiologicaEspecificaContainer', value: 'sim' },
        { trigger: 'disfuncaoRenal', container: 'disfuncaoRenalEspecificaContainer', value: 'sim' },
        { trigger: 'problemaHormonal', container: 'problemaHormonalEspecificoContainer', value: 'sim' },
        { trigger: 'alergiaCosmeticos', container: 'alergiaCosmeticosEspecificaContainer', value: 'sim' }
    ];
    
    // Adiciona event listeners para cada campo condicional
    conditionalFields.forEach(field => {
        const triggerElements = document.querySelectorAll(`input[name="${field.trigger}"]`);
        const container = document.getElementById(field.container);
        
        triggerElements.forEach(element => {
            element.addEventListener('change', function() {
                if (this.value === field.value) {
                    container.classList.add('active');
                    // Marca o campo como obrigatório quando visível
                    const input = container.querySelector('input');
                    if (input) input.required = true;
                } else {
                    container.classList.remove('active');
                    // Remove a obrigatoriedade quando oculto
                    const input = container.querySelector('input');
                    if (input) {
                        input.required = false;
                        input.value = ''; // Limpa o valor quando oculto
                    }
                }
            });
        });
    });
    
    console.log('Perguntas condicionais inicializadas');
}

/**
 * Inicializa a área de assinatura digital - CORREÇÃO COMPLETA
 */
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    const clearBtn = document.getElementById('clearSignature');
    
    // Verifica se o canvas existe
    if (!canvas) {
        console.error('Canvas de assinatura não encontrado!');
        return;
    }
    
    // Obtém o contexto 2D primeiro
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Não foi possível obter o contexto 2D do canvas');
        return;
    }
    
    // Define as dimensões do canvas
    const setCanvasSize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Se já existe uma assinatura, redesenha
        if (signaturePad && !signaturePad.isEmpty()) {
            const data = signaturePad.toData();
            signaturePad.clear();
            signaturePad.fromData(data);
        }
    };
    
    // Configura o canvas inicialmente
    setCanvasSize();
    
    // Inicializa o SignaturePad com configurações otimizadas
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)', // Transparente
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 2.5,
        throttle: 5, // Reduzido para melhor responsividade
        velocityFilterWeight: 0.7,
        onEnd: () => {
            console.log('Assinatura completada');
        }
    });
    
    // Configura o botão de limpar assinatura
    clearBtn.addEventListener('click', function() {
        signaturePad.clear();
        console.log('Assinatura limpa');
    });
    
    // Redimensiona o canvas quando a janela é redimensionada
    window.addEventListener('resize', setCanvasSize);
    
    // Também redimensiona quando a seção de assinatura é mostrada
    document.getElementById('anamneseForm').addEventListener('sectionChange', function() {
        if (currentSection === 5) {
            setTimeout(setCanvasSize, 100);
        }
    });
    
    console.log('Área de assinatura inicializada corretamente');
}

/**
 * Inicializa máscaras para campos de entrada
 */
function initInputMasks() {
    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)/, '($1');
        }
        
        e.target.value = value;
    });
    
    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
        }
        
        e.target.value = value;
    });
    
    console.log('Máscaras de entrada inicializadas');
}

// ============================================
// FUNÇÕES DE NAVEGAÇÃO DO FORMULÁRIO
// ============================================

/**
 * Navega para a seção anterior do formulário
 */
function navigateToPrevSection() {
    if (currentSection > 1) {
        changeSection(currentSection - 1);
    }
}

/**
 * Navega para a próxima seção do formulário
 */
function navigateToNextSection() {
    // Valida os campos obrigatórios da seção atual antes de avançar
    if (validateCurrentSection()) {
        if (currentSection < totalSections) {
            changeSection(currentSection + 1);
        }
    }
}

/**
 * Altera a seção visível do formulário
 * @param {number} sectionNumber - Número da seção para exibir
 */
function changeSection(sectionNumber) {
    // Oculta a seção atual
    document.getElementById(`section${currentSection}`).classList.remove('active');
    
    // Exibe a nova seção
    document.getElementById(`section${sectionNumber}`).classList.add('active');
    
    // Atualiza o estado atual
    currentSection = sectionNumber;
    
    // Atualiza a barra de progresso
    updateProgressBar();
    
    // Atualiza os botões de navegação
    updateNavigationButtons();
    
    // Atualiza as informações de consentimento se estiver na seção 5
    if (sectionNumber === 5) {
        updateConsentInfo();
        // Redimensiona o canvas da assinatura quando a seção é mostrada
        setTimeout(() => {
            const canvas = document.getElementById('signatureCanvas');
            if (canvas && signaturePad) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        }, 100);
    }
    
    // Rola para o topo da seção
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    
    console.log(`Seção alterada: ${sectionNumber}`);
}

/**
 * Atualiza os botões de navegação com base na seção atual
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Seção 1: Esconde o botão anterior
    if (currentSection === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    }
    // Seção final: Mostra o botão de submit e esconde o próximo
    else if (currentSection === totalSections) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'flex';
    }
    // Seções intermediárias: Mostra ambos
    else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    }
}

/**
 * Atualiza a barra de progresso
 */
function updateProgressBar() {
    const progressPercentage = ((currentSection - 1) / (totalSections - 1)) * 100;
    const progressFill = document.getElementById('progressFill');
    const progressPercentageText = document.getElementById('progressPercentage');
    const currentStepText = document.getElementById('currentStep');
    
    progressFill.style.width = `${progressPercentage}%`;
    progressPercentageText.textContent = `${Math.round(progressPercentage)}%`;
    currentStepText.textContent = `Passo ${currentSection} de ${totalSections}`;
}

/**
 * Atualiza as informações de consentimento com os dados do formulário
 */
function updateConsentInfo() {
    const nome = document.getElementById('nome').value || '[Nome Completo]';
    const rg = document.getElementById('rg').value || '[Número do RG]';
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    document.getElementById('consentName').textContent = nome;
    document.getElementById('consentRG').textContent = rg;
    document.getElementById('consentDate').textContent = dataAtual;
}

// ============================================
// VALIDAÇÃO DO FORMULÁRIO
// ============================================

/**
 * Valida todos os campos obrigatórios da seção atual
 * @returns {boolean} True se a seção for válida, False caso contrário
 */
function validateCurrentSection() {
    const currentSectionElement = document.getElementById(`section${currentSection}`);
    const requiredInputs = currentSectionElement.querySelectorAll('[required]');
    let isValid = true;
    
    // Remove estilos de erro anteriores
    requiredInputs.forEach(input => {
        input.classList.remove('error');
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) errorElement.remove();
    });
    
    // Valida cada campo obrigatório
    requiredInputs.forEach(input => {
        // Verifica campos de texto vazios
        if (input.type !== 'radio' && input.type !== 'checkbox' && !input.value.trim()) {
            input.classList.add('error');
            showFieldError(input, 'Este campo é obrigatório');
            isValid = false;
        }
        
        // Verifica grupos de radio buttons
        if (input.type === 'radio') {
            const radioName = input.name;
            const radioGroup = currentSectionElement.querySelectorAll(`input[name="${radioName}"]:checked`);
            
            if (radioGroup.length === 0) {
                // Encontra o primeiro radio do grupo para marcar o erro
                const firstRadio = currentSectionElement.querySelector(`input[name="${radioName}"]`);
                if (firstRadio) {
                    firstRadio.classList.add('error');
                    showFieldError(firstRadio, 'Selecione uma opção');
                    isValid = false;
                }
            }
        }
        
        // Verifica checkboxes
        if (input.type === 'checkbox' && !input.checked) {
            input.classList.add('error');
            showFieldError(input, 'Você precisa confirmar este campo');
            isValid = false;
        }
    });
    
    // Validação específica para a seção de assinatura
    if (currentSection === 5) {
        if (!signaturePad || signaturePad.isEmpty()) {
            showErrorMessage('Por favor, forneça sua assinatura digital');
            isValid = false;
        }
    }
    
    if (!isValid) {
        console.warn('Validação da seção atual falhou');
    }
    
    return isValid;
}

/**
 * Valida todo o formulário antes do envio
 * @returns {boolean} True se o formulário for válido, False caso contrário
 */
function validateForm() {
    // Valida a seção atual primeiro
    if (!validateCurrentSection()) {
        return false;
    }
    
    // Verifica todas as seções
    for (let i = 1; i <= totalSections; i++) {
        const sectionElement = document.getElementById(`section${i}`);
        const requiredInputs = sectionElement.querySelectorAll('[required]');
        
        for (const input of requiredInputs) {
            if (input.type === 'radio') {
                const radioName = input.name;
                const isChecked = sectionElement.querySelector(`input[name="${radioName}"]:checked`);
                
                if (!isChecked) {
                    // Vai para a seção com erro
                    changeSection(i);
                    showErrorMessage('Por favor, preencha todos os campos obrigatórios');
                    return false;
                }
            } else if (input.type === 'checkbox' && !input.checked) {
                changeSection(i);
                showErrorMessage('Por favor, preencha todos os campos obrigatórios');
                return false;
            } else if (input.type !== 'radio' && input.type !== 'checkbox' && !input.value.trim()) {
                changeSection(i);
                showErrorMessage('Por favor, preencha todos os campos obrigatórios');
                return false;
            }
        }
    }
    
    console.log('Validação do formulário completa - todos os campos estão válidos');
    return true;
}

/**
 * Exibe mensagem de erro para um campo específico
 * @param {HTMLElement} field - Campo que contém o erro
 * @param {string} message - Mensagem de erro a ser exibida
 */
function showFieldError(field, message) {
    // Remove mensagens de erro anteriores
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // Cria e adiciona a mensagem de erro
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.style.color = '#e60073';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    
    field.parentNode.appendChild(errorElement);
    
    // Rola até o campo com erro
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
            field.classList.remove('error');
        }
    }, 5000);
}

// ============================================
// MANIPULAÇÃO DO ENVIO DO FORMULÁRIO
// ============================================

/**
 * Manipula o envio do formulário
 * @param {Event} e - Evento de submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('Iniciando envio do formulário...');
    
    // Valida o formulário antes de enviar
    if (!validateForm()) {
        console.error('Formulário inválido - envio cancelado');
        return;
    }
    
    // Coleta os dados do formulário
    const formData = collectFormData();
    
    // Mostra mensagem de carregamento
    showLoadingMessage();
    
    try {
        console.log('Gerando PDF...');
        // Gera o PDF
        const pdfData = await generatePdfSimplified(formData);
        
        console.log('Enviando dados para Google Apps Script...');
        // Envia os dados para o Google Apps Script
        const response = await sendToGoogleScript(formData, pdfData);
        
        if (response.success) {
            console.log('Formulário enviado com sucesso!');
            // Mostra mensagem de sucesso
            showSuccessMessage();
            
            // Armazena a URL do PDF para download
            generatedPdfUrl = response.pdfUrl;
            
            // Mostra o botão de download
            document.getElementById('downloadPdfBtn').style.display = 'block';
            
            // Reseta o formulário após 5 segundos
            setTimeout(() => {
                resetForm();
                // Volta para a primeira seção
                changeSection(1);
                console.log('Formulário resetado para novo preenchimento');
            }, 5000);
        } else {
            throw new Error(response.message || 'Erro ao processar o formulário');
        }
    } catch (error) {
        console.error('Erro no envio do formulário:', error);
        
        // Mensagem de erro mais amigável
        let errorMessage = error.message;
        if (errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet. Se o problema persistir, entre em contato com a clínica.';
        } else if (errorMessage.includes('Network Error')) {
            errorMessage = 'Erro de rede. Verifique sua conexão com a internet.';
        }
        
        showErrorMessage(`Erro: ${errorMessage}`);
    } finally {
        hideLoadingMessage();
    }
}

/**
 * Coleta todos os dados do formulário em um objeto
 * @returns {Object} Objeto com todos os dados do formulário
 */
function collectFormData() {
    const form = document.getElementById('anamneseForm');
    const formData = new FormData(form);
    const data = {};
    
    // Converte FormData para objeto simples
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Adiciona a assinatura como base64 (se existir)
    if (signaturePad && !signaturePad.isEmpty()) {
        try {
            // Usa qualidade mais baixa para evitar problemas
            const signatureData = signaturePad.toDataURL('image/jpeg', 0.5);
            data.assinatura = signatureData;
            console.log('Assinatura capturada com sucesso');
        } catch (error) {
            console.warn('Erro ao capturar assinatura:', error);
            data.assinatura = '';
        }
    } else {
        data.assinatura = '';
    }
    
    // Adiciona data e hora do preenchimento
    data.dataPreenchimento = new Date().toISOString();
    data.dataPreenchimentoFormatada = new Date().toLocaleString('pt-BR');
    
    console.log('Dados do formulário coletados:', Object.keys(data));
    return data;
}

/**
 * Gera o PDF com os dados do formulário - MÉTODO SIMPLIFICADO
 * @param {Object} formData - Dados do formulário
 * @returns {Promise<string>} Promise com o PDF em base64
 */
async function generatePdfSimplified(formData) {
    return new Promise((resolve, reject) => {
        try {
            console.log('Gerando PDF simplificado...');
            
            // Cria um novo PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Configurações iniciais
            const pageWidth = pdf.internal.pageSize.getWidth();
            let yPos = 20;
            
            // Função para adicionar texto com quebra de linha
            const addText = (text, x, y, maxWidth = 180) => {
                const lines = pdf.splitTextToSize(text, maxWidth);
                pdf.text(lines, x, y);
                return lines.length * 7; // Retorna altura aproximada
            };
            
            // Cabeçalho
            pdf.setFontSize(20);
            pdf.setTextColor(230, 0, 115); // Cor rosa
            pdf.text('Dra. Jaqueline Nobre Moratore', pageWidth / 2, yPos, { align: 'center' });
            
            pdf.setFontSize(14);
            pdf.setTextColor(102, 102, 102); // Cinza
            yPos += 10;
            pdf.text('Odontologia Especializada', pageWidth / 2, yPos, { align: 'center' });
            
            pdf.setFontSize(16);
            pdf.setTextColor(51, 51, 51); // Preto
            yPos += 15;
            pdf.text('FORMULÁRIO DE ANAMNESE ODONTOLÓGICA', pageWidth / 2, yPos, { align: 'center' });
            
            // Linha divisória
            yPos += 10;
            pdf.setDrawColor(255, 77, 148); // Rosa
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos, pageWidth - 20, yPos);
            
            // Seção: Dados Pessoais
            yPos += 15;
            pdf.setFontSize(14);
            pdf.setTextColor(230, 0, 115); // Rosa
            pdf.text('DADOS PESSOAIS', 20, yPos);
            
            pdf.setFontSize(10);
            pdf.setTextColor(51, 51, 51); // Preto
            
            // Função auxiliar para formatar respostas
            const formatYesNo = (value) => {
                if (value === 'sim') return 'Sim';
                if (value === 'nao') return 'Não';
                if (value === 'nao_aplicavel') return 'Não se aplica';
                if (value === 'as_vezes') return 'Às vezes';
                if (value === 'nao_sei') return 'Não sei';
                return value || 'Não informado';
            };
            
            // Adiciona dados pessoais
            const personalData = [
                `Nome: ${formData.nome || 'Não informado'}`,
                `Data Nascimento: ${formData.dataNascimento ? new Date(formData.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}`,
                `Gênero: ${formData.genero || 'Não informado'}`,
                `Telefone: ${formData.telefone || 'Não informado'}`,
                `E-mail: ${formData.email || 'Não informado'}`,
                `Endereço: ${formData.endereco || 'Não informado'}`,
                `Profissão: ${formData.profissao || 'Não informado'}`,
                `RG: ${formData.rg || 'Não informado'}`,
                `CPF: ${formData.cpf || 'Não informado'}`,
                `Autoriza imagem: ${formatYesNo(formData.autorizaImagem)}`
            ];
            
            personalData.forEach(item => {
                yPos += 7;
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text(item, 25, yPos);
            });
            
            // Nova página para histórico médico
            pdf.addPage();
            yPos = 20;
            
            // Seção: Histórico Médico
            pdf.setFontSize(14);
            pdf.setTextColor(230, 0, 115);
            pdf.text('HISTÓRICO MÉDICO', 20, yPos);
            
            pdf.setFontSize(10);
            pdf.setTextColor(51, 51, 51);
            yPos += 10;
            
            const medicalHistory = [
                `Tratamento médico: ${formData.tratamentoMedico === 'sim' ? (formData.tratamentoEspecifico || 'Sim') : formatYesNo(formData.tratamentoMedico)}`,
                `Medicações: ${formData.tomaMedicacao === 'sim' ? (formData.medicacaoEspecifica || 'Sim') : formatYesNo(formData.tomaMedicacao)}`,
                `Cirurgias: ${formData.cirurgia === 'sim' ? (formData.cirurgiaEspecifica || 'Sim') : formatYesNo(formData.cirurgia)}`,
                `Anestesia odontológica: ${formData.anestesiaOdontologica === 'sim' ? (formData.reacaoAnestesia || 'Sim') : formatYesNo(formData.anestesiaOdontologica)}`,
                `Alergia medicamentos: ${formData.alergiaMedicamento === 'sim' ? (formData.alergiaMedicamentoEspecifica || 'Sim') : formatYesNo(formData.alergiaMedicamento)}`,
                `Alergia alimentos: ${formData.alergiaAlimento === 'sim' ? (formData.alergiaAlimentoEspecifica || 'Sim') : formatYesNo(formData.alergiaAlimento)}`,
                `Problemas cardíacos: ${formData.alteracaoCardiologica === 'sim' ? (formData.alteracaoCardiologicaEspecifica || 'Sim') : formatYesNo(formData.alteracaoCardiologica)}`,
                `Diabetes: ${formatYesNo(formData.diabetico)}`,
                `Convulsões/Epilepsia: ${formatYesNo(formData.convulsoes)}`,
                `Problemas renais: ${formData.disfuncaoRenal === 'sim' ? (formData.disfuncaoRenalEspecifica || 'Sim') : formatYesNo(formData.disfuncaoRenal)}`,
                `Problemas coagulação: ${formatYesNo(formData.coagulacaoSanguinea)}`,
                `Grávida/Lactante: ${formatYesNo(formData.gravidaLactante)}`,
                `Problemas hormonais: ${formData.problemaHormonal === 'sim' ? (formData.problemaHormonalEspecifico || 'Sim') : formatYesNo(formData.problemaHormonal)}`,
                `Alergia cosméticos: ${formData.alergiaCosmeticos === 'sim' ? (formData.alergiaCosmeticosEspecifica || 'Sim') : formatYesNo(formData.alergiaCosmeticos)}`
            ];
            
            medicalHistory.forEach(item => {
                yPos += 7;
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text(item, 25, yPos);
            });
            
            // Nova página para hábitos bucais e consentimento
            pdf.addPage();
            yPos = 20;
            
            // Seção: Hábitos de Higiene Bucal
            pdf.setFontSize(14);
            pdf.setTextColor(230, 0, 115);
            pdf.text('HÁBITOS DE HIGIENE BUCAL', 20, yPos);
            
            pdf.setFontSize(10);
            pdf.setTextColor(51, 51, 51);
            yPos += 10;
            
            const oralHabits = [
                `Frequência escovação: ${formData.frequenciaEscovacao || 'Não informado'}`,
                `Uso fio dental: ${formatYesNo(formData.usoFioDental)}`,
                `Creme dental: ${formData.cremeDental || 'Não informado'}`,
                `Escova língua: ${formatYesNo(formData.escovaLingua)}`,
                `Marca escova: ${formData.marcaEscova || 'Não informado'}`,
                `Morde objetos: ${formatYesNo(formData.mordeObjetos)}`,
                `Range dentes: ${formatYesNo(formData.rangeDentes)}`,
                `Rói unhas: ${formatYesNo(formData.roiUnhas)}`
            ];
            
            oralHabits.forEach(item => {
                yPos += 7;
                pdf.text(item, 25, yPos);
            });
            
            // Seção: Consentimento
            yPos += 15;
            pdf.setFontSize(14);
            pdf.setTextColor(230, 0, 115);
            pdf.text('CONSENTIMENTO E ASSINATURA', 20, yPos);
            
            pdf.setFontSize(10);
            pdf.setTextColor(51, 51, 51);
            yPos += 10;
            
            const consentText = `Eu, ${formData.nome || 'Não informado'}, RG ${formData.rg || 'Não informado'}, declaro que todas as informações fornecidas são verdadeiras.`;
            
            const consentLines = pdf.splitTextToSize(consentText, 170);
            pdf.text(consentLines, 25, yPos);
            
            yPos += consentLines.length * 7 + 10;
            pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 25, yPos);
            
            yPos += 15;
            pdf.text('Assinatura do paciente:', 25, yPos);
            
            // Adiciona a assinatura se existir
            if (formData.assinatura) {
                try {
                    // Adiciona a imagem da assinatura
                    pdf.addImage(formData.assinatura, 'JPEG', 25, yPos + 5, 80, 30);
                    yPos += 40;
                } catch (error) {
                    console.warn('Não foi possível adicionar a assinatura ao PDF:', error);
                    yPos += 10;
                    pdf.setLineWidth(0.5);
                    pdf.line(25, yPos, 125, yPos);
                    yPos += 15;
                }
            } else {
                yPos += 5;
                pdf.setLineWidth(0.5);
                pdf.line(25, yPos, 125, yPos);
                yPos += 10;
            }
            
            pdf.text(formData.nome || 'Não informado', 25, yPos);
            
            // Rodapé
            pdf.setFontSize(8);
            pdf.setTextColor(102, 102, 102);
            yPos = 280;
            pdf.text('Documento gerado automaticamente em ' + new Date().toLocaleString('pt-BR'), pageWidth / 2, yPos, { align: 'center' });
            
            // Converte para base64
            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            console.log('PDF simplificado gerado com sucesso');
            resolve(pdfBase64);
            
        } catch (error) {
            console.error('Erro ao gerar PDF simplificado:', error);
            // Fallback: cria um PDF mínimo
            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                pdf.text('Anamnese Odontológica - ' + (formData.nome || 'Paciente'), 20, 20);
                pdf.text('Documento gerado em: ' + new Date().toLocaleString('pt-BR'), 20, 30);
                const fallbackBase64 = pdf.output('datauristring').split(',')[1];
                resolve(fallbackBase64);
            } catch (fallbackError) {
                reject(new Error('Não foi possível gerar o PDF: ' + error.message));
            }
        }
    });
}

/**
 * Envia dados para o Google Apps Script - CORREÇÃO DO ERRO "Failed to fetch"
 * @param {Object} formData - Dados do formulário
 * @param {string} pdfData - PDF em base64
 * @returns {Promise<Object>} Resposta do servidor
 */
async function sendToGoogleScript(formData, pdfData) {
    // Monta os dados para envio
    const payload = {
        ...formData,
        pdf: pdfData,
        action: 'saveAnamnese'
    };

    console.log('Enviando payload para Google Apps Script...');
    console.log('URL do script:', GOOGLE_SCRIPT_URL);

    try {
        // Usa timeout para evitar que a requisição fique travada
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

        // Envia para o Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Resposta do Google Apps Script:', responseData);
        return responseData;
    } catch (error) {
        console.error('Erro ao enviar para Google Apps Script:', error);
        
        // Verifica se a URL está correta
        if (GOOGLE_SCRIPT_URL === "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") {
            throw new Error('URL do Google Apps Script não configurada. Por favor, configure a URL antes de enviar.');
        }
        
        if (error.name === 'AbortError') {
            throw new Error('Tempo limite excedido ao tentar conectar ao servidor.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
            throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet e se a URL do Google Apps Script está correta.');
        }
        
        throw error;
    }
}

/**
 * Testa a conexão com o Google Apps Script
 */
async function testGoogleScriptConnection() {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'testConnection' })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Conexão testada com sucesso:', data);
            return true;
        } else {
            console.error('Erro na conexão:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        return false;
    }
}

/**
 * Configura o botão de download do PDF
 */
function setupPdfDownload() {
    const downloadBtn = document.getElementById('downloadPdfBtn');
    
    downloadBtn.addEventListener('click', async function() {
        if (generatedPdfUrl) {
            console.log('Baixando PDF da URL:', generatedPdfUrl);
            // Baixa o PDF da URL
            const link = document.createElement('a');
            link.href = generatedPdfUrl;
            link.download = `anamnese_${document.getElementById('nome').value.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.log('Gerando PDF local para download');
            // Gera um PDF local para download
            const formData = collectFormData();
            showLoadingMessage();
            
            try {
                const pdfData = await generatePdfSimplified(formData);
                const pdfBlob = base64ToBlob(pdfData, 'application/pdf');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `anamnese_${formData.nome.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Libera a URL do objeto
                setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
                console.log('PDF gerado localmente e baixado');
            } catch (error) {
                console.error('Erro ao gerar PDF para download:', error);
                showErrorMessage('Erro ao gerar PDF para download: ' + error.message);
            } finally {
                hideLoadingMessage();
            }
        }
    });
    
    console.log('Botão de download do PDF configurado');
}

/**
 * Converte base64 para Blob
 * @param {string} base64 - Dados em base64
 * @param {string} contentType - Tipo de conteúdo
 * @returns {Blob} Blob gerado
 */
function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: contentType });
}

// ============================================
// MANIPULAÇÃO DE MENSAGENS DE STATUS
// ============================================

/**
 * Exibe mensagem de sucesso
 */
function showSuccessMessage() {
    hideAllMessages();
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
    console.log('Mensagem de sucesso exibida');
}

/**
 * Exibe mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showErrorMessage(message) {
    hideAllMessages();
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth' });
    console.error('Mensagem de erro exibida:', message);
}

/**
 * Exibe mensagem de carregamento
 */
function showLoadingMessage() {
    hideAllMessages();
    document.getElementById('loadingMessage').style.display = 'block';
    console.log('Mensagem de carregamento exibida');
}

/**
 * Oculta mensagem de carregamento
 */
function hideLoadingMessage() {
    document.getElementById('loadingMessage').style.display = 'none';
    console.log('Mensagem de carregamento ocultada');
}

/**
 * Oculta todas as mensagens de status
 */
function hideAllMessages() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('loadingMessage').style.display = 'none';
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Reseta o formulário para o estado inicial
 */
function resetForm() {
    document.getElementById('anamneseForm').reset();
    if (signaturePad) {
        signaturePad.clear();
    }
    generatedPdfUrl = null;
    document.getElementById('downloadPdfBtn').style.display = 'none';
    hideAllMessages();
    
    // Reseta as perguntas condicionais
    document.querySelectorAll('.conditional-question').forEach(container => {
        container.classList.remove('active');
    });
    
    console.log('Formulário resetado');
}
