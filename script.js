/**
 * SISTEMA DE ANAMNESE ODONTOLÓGICA - FRONT-END CORRIGIDO
 * Desenvolvido para Dra. Jaqueline Nobre Moratore
 * COM CORREÇÃO COMPLETA DA COMUNICAÇÃO COM GOOGLE APPS SCRIPT
 */

// ============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ============================================

// URL do Google Apps Script - IMPERATIVO: Cole a URL após implantar o GAS
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOeSANuE4UM-IHan07oxjH0DWM7eemJnwaGpoC74EdRG9WiJWzjH-9pLCOql3QRsZ4/exec";

// Estado do formulário
let currentSection = 1;
const totalSections = 5;
let signaturePad = null;
let generatedPdfUrl = null;
let isSubmitting = false;

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================

/**
 * Inicializa a aplicação quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== SISTEMA DE ANAMNESE INICIALIZANDO ===');
    
    // Testar conexão imediatamente
    testConnectionOnLoad();
    
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
    
    // Inicializar sistema de fallback
    initFallbackSystem();
    
    console.log('✅ Sistema de Anamnese inicializado com sucesso!');
});

/**
 * Testa a conexão com o GAS ao carregar a página
 */
async function testConnectionOnLoad() {
    console.log('🔍 Testando conexão com Google Apps Script...');
    console.log('URL do GAS:', GOOGLE_SCRIPT_URL);
    
    // Verificar se a URL está configurada
    if (GOOGLE_SCRIPT_URL.includes('SUA_URL_DO_GOOGLE_APPS_SCRIPT') || 
        GOOGLE_SCRIPT_URL.includes('AKfycbydR8bnOCAygmNfe7IuhpmrYc2eYrSOehxQXvBxYY2aqFmUImw4yfh6TOnkikNv3wkm')) {
        console.warn('⚠️ ATENÇÃO: URL do Google Apps Script não foi atualizada!');
        console.warn('Por favor, cole a URL correta após implantar o script.');
        showConnectionWarning('URL do servidor não configurada. O formulário não funcionará até que você configure a URL correta.');
        return;
    }
    
    try {
        // Teste rápido de conexão
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({action: 'testConnection'})
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Conexão estabelecida com sucesso:', data.message);
            showConnectionSuccess('Conectado ao servidor ✓');
        } else {
            console.warn('⚠️ Resposta não OK:', response.status);
            showConnectionWarning('Servidor respondeu com erro ' + response.status);
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error.message);
        showConnectionWarning('Não foi possível conectar ao servidor: ' + error.message);
        
        // Mostrar instruções detalhadas
        if (error.message.includes('Failed to fetch')) {
            console.error('🔧 Possíveis soluções:');
            console.error('1. Verifique se a URL do GAS está correta');
            console.error('2. Verifique se o GAS foi implantado como "Qualquer pessoa, mesmo anônimo"');
            console.error('3. Verifique se há bloqueio de CORS no navegador');
        }
    }
}

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
    
    console.log('✅ Navegação do formulário inicializada');
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
        
        if (!container) {
            console.warn('Container não encontrado:', field.container);
            return;
        }
        
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
    
    console.log('✅ Perguntas condicionais inicializadas');
}

/**
 * Inicializa a área de assinatura digital
 */
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    const clearBtn = document.getElementById('clearSignature');
    
    // Verifica se o canvas existe
    if (!canvas) {
        console.error('Canvas de assinatura não encontrado!');
        return;
    }
    
    // Define as dimensões do canvas
    const setCanvasSize = () => {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        
        const rect = wrapper.getBoundingClientRect();
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
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 2.5,
        throttle: 5,
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
    
    console.log('✅ Área de assinatura inicializada corretamente');
}

/**
 * Inicializa máscaras para campos de entrada
 */
function initInputMasks() {
    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
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
    }
    
    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
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
    }
    
    console.log('✅ Máscaras de entrada inicializadas');
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
    const currentSectionEl = document.getElementById(`section${currentSection}`);
    if (currentSectionEl) {
        currentSectionEl.classList.remove('active');
    }
    
    // Exibe a nova seção
    const newSectionEl = document.getElementById(`section${sectionNumber}`);
    if (newSectionEl) {
        newSectionEl.classList.add('active');
    }
    
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
                const wrapper = canvas.parentElement;
                if (wrapper) {
                    const rect = wrapper.getBoundingClientRect();
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                }
            }
        }, 100);
    }
    
    // Rola para o topo da seção
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    console.log(`Seção alterada: ${currentSection}`);
}

/**
 * Atualiza os botões de navegação com base na seção atual
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!prevBtn || !nextBtn || !submitBtn) return;
    
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
    
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    if (progressPercentageText) {
        progressPercentageText.textContent = `${Math.round(progressPercentage)}%`;
    }
    
    if (currentStepText) {
        currentStepText.textContent = `Passo ${currentSection} de ${totalSections}`;
    }
}

/**
 * Atualiza as informações de consentimento com os dados do formulário
 */
function updateConsentInfo() {
    const nome = document.getElementById('nome')?.value || '[Nome Completo]';
    const rg = document.getElementById('rg')?.value || '[Número do RG]';
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const consentName = document.getElementById('consentName');
    const consentRG = document.getElementById('consentRG');
    const consentDate = document.getElementById('consentDate');
    
    if (consentName) consentName.textContent = nome;
    if (consentRG) consentRG.textContent = rg;
    if (consentDate) consentDate.textContent = dataAtual;
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
    if (!currentSectionElement) return false;
    
    const requiredInputs = currentSectionElement.querySelectorAll('[required]');
    let isValid = true;
    
    // Remove estilos de erro anteriores
    requiredInputs.forEach(input => {
        input.classList.remove('error');
        const errorElement = input.parentNode?.querySelector('.field-error');
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
        if (!sectionElement) continue;
        
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
    
    console.log('✅ Validação do formulário completa');
    return true;
}

/**
 * Exibe mensagem de erro para um campo específico
 * @param {HTMLElement} field - Campo que contém o erro
 * @param {string} message - Mensagem de erro a ser exibida
 */
function showFieldError(field, message) {
    // Remove mensagens de erro anteriores
    const existingError = field.parentNode?.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // Cria e adiciona a mensagem de erro
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.style.color = '#e60073';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    
    if (field.parentNode) {
        field.parentNode.appendChild(errorElement);
    }
    
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
// MANIPULAÇÃO DO ENVIO DO FORMULÁRIO (CORRIGIDO)
// ============================================

/**
 * Manipula o envio do formulário
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Prevenir múltiplos envios simultâneos
    if (isSubmitting) {
        console.warn('Envio já em andamento...');
        return;
    }
    
    isSubmitting = true;
    
    console.log('🚀 Iniciando envio do formulário...');
    
    // Valida o formulário antes de enviar
    if (!validateForm()) {
        console.error('❌ Formulário inválido - envio cancelado');
        isSubmitting = false;
        return;
    }
    
    // Coleta os dados do formulário
    const formData = collectFormData();
    
    // Mostra mensagem de carregamento
    showLoadingMessage();
    
    try {
        console.log('📄 Gerando PDF...');
        // Gera o PDF
        const pdfData = await generatePdfSimplified(formData);
        
        console.log('🌐 Enviando dados para servidor...');
        // Envia os dados para o Google Apps Script
        const response = await sendToGoogleScript(formData, pdfData);
        
        if (response.success) {
            console.log('✅ Formulário enviado com sucesso!');
            console.log('URL do PDF:', response.pdfUrl);
            
            // Mostra mensagem de sucesso
            showSuccessMessage('Formulário enviado com sucesso! Em instantes você receberá um e-mail com a cópia do documento.');
            
            // Armazena a URL do PDF para download
            generatedPdfUrl = response.pdfUrl;
            
            // Mostra o botão de download
            const downloadBtn = document.getElementById('downloadPdfBtn');
            if (downloadBtn) {
                downloadBtn.style.display = 'block';
                if (response.pdfUrl) {
                    downloadBtn.onclick = () => {
                        window.open(response.pdfUrl, '_blank');
                    };
                }
            }
            
            // Reseta o formulário após 5 segundos
            setTimeout(() => {
                resetForm();
                // Volta para a primeira seção
                changeSection(1);
                console.log('🔄 Formulário resetado para novo preenchimento');
            }, 5000);
        } else {
            throw new Error(response.message || 'Erro ao processar o formulário');
        }
    } catch (error) {
        console.error('❌ Erro no envio do formulário:', error);
        
        // Mensagem de erro mais amigável
        let errorMessage = error.message;
        
        if (errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet. Se o problema persistir, entre em contato com a clínica.';
        } else if (errorMessage.includes('Network Error')) {
            errorMessage = 'Erro de rede. Verifique sua conexão com a internet.';
        } else if (errorMessage.includes('CORS')) {
            errorMessage = 'Problema de configuração do servidor. Por favor, tente novamente mais tarde.';
        }
        
        showErrorMessage(`Erro: ${errorMessage}`);
        
        // Salva localmente como fallback
        saveDataLocally(formData);
    } finally {
        hideLoadingMessage();
        isSubmitting = false;
    }
}

/**
 * Coleta todos os dados do formulário em um objeto
 * @returns {Object} Objeto com todos os dados do formulário
 */
function collectFormData() {
    const form = document.getElementById('anamneseForm');
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    // Converte FormData para objeto simples
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Adiciona a assinatura como base64 (se existir)
    if (signaturePad && !signaturePad.isEmpty()) {
        try {
            const signatureData = signaturePad.toDataURL('image/jpeg', 0.5);
            data.assinatura = signatureData;
            console.log('✅ Assinatura capturada com sucesso');
        } catch (error) {
            console.warn('⚠️ Erro ao capturar assinatura:', error);
            data.assinatura = '';
        }
    } else {
        data.assinatura = '';
    }
    
    // Adiciona data e hora do preenchimento
    data.dataPreenchimento = new Date().toISOString();
    data.dataPreenchimentoFormatada = new Date().toLocaleString('pt-BR');
    
    console.log('📋 Dados do formulário coletados:', Object.keys(data).length + ' campos');
    return data;
}

/**
 * Gera o PDF com os dados do formulário
 */
async function generatePdfSimplified(formData) {
    return new Promise((resolve, reject) => {
        try {
            console.log('📄 Iniciando geração do PDF...');
            
            // Cria um novo PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Configurações iniciais
            const pageWidth = pdf.internal.pageSize.getWidth();
            let yPos = 20;
            
            // Cabeçalho
            pdf.setFontSize(20);
            pdf.setTextColor(230, 0, 115);
            pdf.text('Dra. Jaqueline Nobre Moratore', pageWidth / 2, yPos, { align: 'center' });
            
            pdf.setFontSize(14);
            pdf.setTextColor(102, 102, 102);
            yPos += 10;
            pdf.text('Odontologia Especializada', pageWidth / 2, yPos, { align: 'center' });
            
            pdf.setFontSize(16);
            pdf.setTextColor(51, 51, 51);
            yPos += 15;
            pdf.text('FORMULÁRIO DE ANAMNESE ODONTOLÓGICA', pageWidth / 2, yPos, { align: 'center' });
            
            // Linha divisória
            yPos += 10;
            pdf.setDrawColor(255, 77, 148);
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos, pageWidth - 20, yPos);
            
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
            yPos += 15;
            pdf.setFontSize(14);
            pdf.setTextColor(230, 0, 115);
            pdf.text('DADOS PESSOAIS', 20, yPos);
            
            pdf.setFontSize(10);
            pdf.setTextColor(51, 51, 51);
            
            const personalData = [
                `Nome: ${formData.nome || 'Não informado'}`,
                `Data Nascimento: ${formData.dataNascimento ? new Date(formData.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}`,
                `Gênero: ${formData.genero || 'Não informado'}`,
                `Telefone: ${formData.telefone || 'Não informado'}`,
                `E-mail: ${formData.email || 'Não informado'}`,
                `Endereço: ${formData.endereco || 'Não informado'}`,
                `RG: ${formData.rg || 'Não informado'}`,
                `CPF: ${formData.cpf || 'Não informado'}`
            ];
            
            personalData.forEach(item => {
                yPos += 7;
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text(item, 25, yPos);
            });
            
            // Converte para base64
            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            console.log('✅ PDF gerado com sucesso');
            resolve(pdfBase64);
            
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error);
            reject(new Error('Não foi possível gerar o PDF: ' + error.message));
        }
    });
}

// ============================================
// COMUNICAÇÃO COM GOOGLE APPS SCRIPT (CORRIGIDO)
// ============================================

/**
 * Envia dados para o Google Apps Script
 * COM MÚLTIPLAS TENTATIVAS E FALLBACK
 */
async function sendToGoogleScript(formData, pdfData) {
    console.log('🌐 Iniciando envio para Google Apps Script...');
    console.log('URL:', GOOGLE_SCRIPT_URL);
    
    // Monta os dados para envio
    const payload = {
        ...formData,
        pdf: pdfData,
        action: 'saveAnamnese',
        timestamp: new Date().toISOString(),
        source: 'github_pages'
    };
    
    // Método 1: Usando fetch com tratamento de CORS
    try {
        console.log('🔄 Tentativa 1: Fetch com headers otimizados...');
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📡 Status da resposta:', response.status);
        console.log('📡 Status OK?', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Resposta do servidor:', data);
            return data;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.warn('⚠️ Método 1 falhou:', error.message);
        
        // Método 2: Usando XMLHttpRequest (mais compatível)
        try {
            console.log('🔄 Tentativa 2: XMLHttpRequest...');
            return await sendWithXHR(payload);
        } catch (xhrError) {
            console.warn('⚠️ Método 2 falhou:', xhrError.message);
            
            // Método 3: Usando fetch sem mode
            try {
                console.log('🔄 Tentativa 3: Fetch sem mode...');
                
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Resposta do servidor (método 3):', data);
                    return data;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (finalError) {
                console.error('❌ Todos os métodos falharam:', finalError.message);
                throw new Error(`Não foi possível conectar ao servidor. Verifique a URL e tente novamente. Detalhes: ${finalError.message}`);
            }
        }
    }
}

/**
 * Envia dados usando XMLHttpRequest
 */
function sendWithXHR(payload) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', GOOGLE_SCRIPT_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 30000; // 30 segundos
        
        xhr.onload = function() {
            console.log('XHR Status:', xhr.status);
            
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data);
                } catch (e) {
                    console.warn('Resposta não é JSON:', xhr.responseText);
                    resolve({
                        success: true,
                        message: 'Enviado com sucesso (resposta não-JSON)',
                        status: xhr.status
                    });
                }
            } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Erro de rede XHR'));
        };
        
        xhr.ontimeout = function() {
            reject(new Error('Timeout XHR (30s)'));
        };
        
        xhr.send(JSON.stringify(payload));
    });
}

// ============================================
// SISTEMA DE FALLBACK LOCAL
// ============================================

/**
 * Inicializa o sistema de fallback
 */
function initFallbackSystem() {
    // Verifica se há dados pendentes
    const pending = localStorage.getItem('pendingAnamneses');
    if (pending) {
        try {
            const pendingArray = JSON.parse(pending);
            if (pendingArray.length > 0) {
                console.log(`📦 Encontradas ${pendingArray.length} submissões pendentes`);
                // Agenda tentativa de reenvio
                setTimeout(() => {
                    retryPendingSubmissions();
                }, 10000);
            }
        } catch (e) {
            console.error('Erro ao ler dados pendentes:', e);
        }
    }
}

/**
 * Salva dados localmente como fallback
 */
function saveDataLocally(formData) {
    try {
        const saveData = {
            formData: formData,
            timestamp: new Date().toISOString(),
            attempts: 0
        };
        
        const pending = JSON.parse(localStorage.getItem('pendingAnamneses') || '[]');
        pending.push(saveData);
        localStorage.setItem('pendingAnamneses', JSON.stringify(pending));
        
        console.log('💾 Dados salvos localmente. Total pendente:', pending.length);
        
        // Mostra mensagem ao usuário
        showInfoMessage('Seus dados foram salvos localmente e serão enviados quando a conexão for restaurada.');
        
        // Agenda reenvio
        setTimeout(() => {
            retryPendingSubmissions();
        }, 15000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar localmente:', error);
    }
}

/**
 * Tenta reenviar submissões pendentes
 */
async function retryPendingSubmissions() {
    try {
        const pending = JSON.parse(localStorage.getItem('pendingAnamneses') || '[]');
        if (pending.length === 0) return;
        
        console.log(`🔄 Tentando reenviar ${pending.length} submissões pendentes...`);
        
        for (let i = pending.length - 1; i >= 0; i--) {
            const submission = pending[i];
            
            // Limita a 3 tentativas
            if (submission.attempts >= 3) {
                console.log(`🗑️ Removendo submissão ${i} (muitas tentativas)`);
                pending.splice(i, 1);
                continue;
            }
            
            try {
                // Tenta enviar
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...submission.formData,
                        action: 'saveAnamnese',
                        isRetry: true,
                        originalTimestamp: submission.timestamp
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log(`✅ Submissão pendente ${i} enviada com sucesso`);
                        pending.splice(i, 1);
                    } else {
                        submission.attempts = (submission.attempts || 0) + 1;
                    }
                } else {
                    submission.attempts = (submission.attempts || 0) + 1;
                }
            } catch (error) {
                submission.attempts = (submission.attempts || 0) + 1;
                console.warn(`⚠️ Erro ao reenviar submissão ${i}:`, error.message);
            }
            
            // Aguarda 2 segundos entre tentativas
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Atualiza localStorage
        localStorage.setItem('pendingAnamneses', JSON.stringify(pending));
        
        if (pending.length === 0) {
            console.log('🎉 Todas as submissões pendentes foram processadas');
        } else {
            console.log(`📊 ${pending.length} submissões ainda pendentes`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar pendentes:', error);
    }
}

// ============================================
// CONFIGURAÇÃO DO BOTÃO DE DOWNLOAD
// ============================================

/**
 * Configura o botão de download do PDF
 */
function setupPdfDownload() {
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (!downloadBtn) return;
    
    downloadBtn.addEventListener('click', function() {
        if (generatedPdfUrl) {
            console.log('📥 Baixando PDF...');
            window.open(generatedPdfUrl, '_blank');
        } else {
            console.log('🔄 Gerando PDF local para download...');
            
            const formData = collectFormData();
            showLoadingMessage();
            
            generatePdfSimplified(formData)
                .then(pdfData => {
                    const pdfBlob = base64ToBlob(pdfData, 'application/pdf');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `anamnese_${formData.nome?.replace(/\s+/g, '_') || 'paciente'}_${new Date().getTime()}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Libera a URL
                    setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
                    
                    console.log('✅ PDF gerado localmente e baixado');
                })
                .catch(error => {
                    console.error('❌ Erro ao gerar PDF:', error);
                    showErrorMessage('Erro ao gerar PDF para download: ' + error.message);
                })
                .finally(() => {
                    hideLoadingMessage();
                });
        }
    });
    
    console.log('✅ Botão de download configurado');
}

/**
 * Converte base64 para Blob
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
function showSuccessMessage(message) {
    hideAllMessages();
    const successEl = document.getElementById('successMessage');
    if (successEl) {
        const textSpan = successEl.querySelector('span');
        if (textSpan && message) {
            textSpan.textContent = message;
        }
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior: 'smooth' });
    }
    console.log('✅ ' + (message || 'Mensagem de sucesso exibida'));
}

/**
 * Exibe mensagem de erro
 */
function showErrorMessage(message) {
    hideAllMessages();
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        const textSpan = document.getElementById('errorText');
        if (textSpan && message) {
            textSpan.textContent = message;
        }
        errorEl.style.display = 'block';
        errorEl.scrollIntoView({ behavior: 'smooth' });
    }
    console.error('❌ ' + (message || 'Mensagem de erro exibida'));
}

/**
 * Exibe mensagem informativa
 */
function showInfoMessage(message) {
    hideAllMessages();
    console.log('ℹ️ ' + message);
    // Pode implementar um toast ou notificação
}

/**
 * Exibe mensagem de conexão bem-sucedida
 */
function showConnectionSuccess(message) {
    console.log('✅ ' + message);
    // Pode adicionar indicador visual na interface
}

/**
 * Exibe aviso de conexão
 */
function showConnectionWarning(message) {
    console.warn('⚠️ ' + message);
    // Pode adicionar indicador visual na interface
}

/**
 * Exibe mensagem de carregamento
 */
function showLoadingMessage() {
    hideAllMessages();
    const loadingEl = document.getElementById('loadingMessage');
    if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.scrollIntoView({ behavior: 'smooth' });
    }
    console.log('⏳ Mensagem de carregamento exibida');
}

/**
 * Oculta mensagem de carregamento
 */
function hideLoadingMessage() {
    const loadingEl = document.getElementById('loadingMessage');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    console.log('✅ Mensagem de carregamento ocultada');
}

/**
 * Oculta todas as mensagens de status
 */
function hideAllMessages() {
    const successEl = document.getElementById('successMessage');
    const errorEl = document.getElementById('errorMessage');
    const loadingEl = document.getElementById('loadingMessage');
    
    if (successEl) successEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'none';
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Reseta o formulário para o estado inicial
 */
function resetForm() {
    const form = document.getElementById('anamneseForm');
    if (form) {
        form.reset();
    }
    
    if (signaturePad) {
        signaturePad.clear();
    }
    
    generatedPdfUrl = null;
    
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) {
        downloadBtn.style.display = 'none';
    }
    
    hideAllMessages();
    
    // Reseta as perguntas condicionais
    document.querySelectorAll('.conditional-question').forEach(container => {
        container.classList.remove('active');
    });
    
    console.log('🔄 Formulário resetado');
}

// ============================================
// TESTE DE CONEXÃO MANUAL (para debug)
// ============================================

/**
 * Testa a conexão manualmente (usar no console do navegador)
 */
window.testGASConnection = async function() {
    console.log('🔍 Testando conexão com GAS...');
    console.log('URL:', GOOGLE_SCRIPT_URL);
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({action: 'testConnection'})
        });
        
        console.log('Status:', response.status);
        console.log('OK?', response.ok);
        
        const data = await response.json();
        console.log('Resposta:', data);
        
        return {success: true, data: data};
    } catch (error) {
        console.error('Erro:', error);
        return {success: false, error: error.message};
    }
};

/**
 * Limpa dados locais (para debug)
 */
window.clearLocalData = function() {
    localStorage.removeItem('pendingAnamneses');
    console.log('🗑️ Dados locais limpos');
};

/**
 * Mostra dados pendentes (para debug)
 */
window.showPendingData = function() {
    const pending = JSON.parse(localStorage.getItem('pendingAnamneses') || '[]');
    console.log(`📊 ${pending.length} submissões pendentes:`, pending);
    return pending;
};
