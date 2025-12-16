// ====================================
// VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ====================================

// Referências aos elementos DOM
const form = document.getElementById('anamneseForm');
const sections = document.querySelectorAll('.form-section');
const progressBar = document.querySelector('.progress-bar');
const steps = document.querySelectorAll('.step');
const signatureCanvas = document.getElementById('signatureCanvas');
const clearSignatureBtn = document.getElementById('clearSignature');
const saveSignatureBtn = document.getElementById('saveSignature');
const signatureStatus = document.getElementById('signatureStatus');
const submitFormBtn = document.getElementById('submitForm');
const confirmationModal = document.getElementById('confirmationModal');
const downloadPdfBtn = document.getElementById('downloadPdf');
const closeModalBtn = document.getElementById('closeModal');
const summaryContent = document.getElementById('summaryContent');
const userEmailSpan = document.getElementById('userEmail');

// Objeto para armazenar os dados do formulário
let formData = {
    // Dados pessoais
    nomeCompleto: '',
    dataNascimento: '',
    genero: '',
    telefone: '',
    email: '',
    endereco: '',
    profissao: '',
    rg: '',
    cpf: '',
    autorizaImagem: 'Não',
    preferenciaMusical: '',
    preferenciaMusicalQual: '',
    
    // Saúde geral
    tratamentoMedico: '',
    tratamentoMedicoQual: '',
    tomaMedicacao: '',
    tomaMedicacaoQual: '',
    submeteuCirurgia: '',
    submeteuCirurgiaQual: '',
    anestesiaOdontologica: '',
    alergiaMedicacao: '',
    alergiaMedicacaoQual: '',
    alergiaAlimento: '',
    alergiaAlimentoQual: '',
    alteracaoCardiologica: '',
    alteracaoCardiologicaQual: '',
    diabetico: '',
    convulsoesEpilepsia: '',
    disfuncaoRenal: '',
    problemaCoagulacao: '',
    gravidaLactante: '',
    problemaHormonal: '',
    problemaHormonalQual: '',
    alergiaCosmeticos: '',
    alergiaCosmeticosQual: '',
    
    // Hábitos de higiene
    frequenciaEscovacao: '',
    usoFioDental: '',
    cremeDental: '',
    escovaLingua: '',
    marcaEscova: '',
    mordeObjetos: '',
    rangeDentes: '',
    roiUnhas: '',
    
    // Assinatura (será adicionada posteriormente)
    signatureData: null,
    
    // Data de envio
    dataEnvio: ''
};

// Inicialização da assinatura
let signaturePad = null;
let isSignatureSaved = false;

// ====================================
// FUNÇÕES DE INICIALIZAÇÃO
// ====================================

/**
 * Inicializa o aplicativo quando o DOM estiver carregado
 */
function initApp() {
    console.log('Inicializando aplicativo de anamnese odontológica...');
    
    // Inicializa a assinatura
    initSignaturePad();
    
    // Configura os eventos
    setupEventListeners();
    
    // Configura a validação do formulário
    setupFormValidation();
    
    // Atualiza a barra de progresso
    updateProgressBar();
    
    console.log('Aplicativo inicializado com sucesso!');
}

/**
 * Inicializa o canvas de assinatura
 */
function initSignaturePad() {
    if (signatureCanvas) {
        signaturePad = new SignaturePad(signatureCanvas, {
            backgroundColor: 'white',
            penColor: '#e75480'
        });
        
        // Ajusta o canvas para telas de alta resolução
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        signatureCanvas.width = signatureCanvas.offsetWidth * ratio;
        signatureCanvas.height = signatureCanvas.offsetHeight * ratio;
        signatureCanvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); // Limpa o canvas após o redimensionamento
        
        console.log('Canvas de assinatura inicializado');
    }
}

// ====================================
// CONFIGURAÇÃO DE EVENTOS
// ====================================

/**
 * Configura todos os event listeners do aplicativo
 */
function setupEventListeners() {
    // Navegação entre seções
    document.querySelectorAll('.btn-next').forEach(button => {
        button.addEventListener('click', handleNextSection);
    });
    
    document.querySelectorAll('.btn-prev').forEach(button => {
        button.addEventListener('click', handlePrevSection);
    });
    
    // Eventos da assinatura
    if (clearSignatureBtn) {
        clearSignatureBtn.addEventListener('click', clearSignature);
    }
    
    if (saveSignatureBtn) {
        saveSignatureBtn.addEventListener('click', saveSignature);
    }
    
    // Envio do formulário
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Eventos do modal
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', handleDownloadPdf);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', handleCloseModal);
    }
    
    // Eventos para perguntas condicionais
    setupConditionalQuestions();
    
    // Eventos para atualização de dados em tempo real
    setupRealTimeDataCapture();
    
    console.log('Event listeners configurados');
}

/**
 * Configura os eventos para perguntas condicionais
 */
function setupConditionalQuestions() {
    // Mapeamento de perguntas condicionais
    const conditionalMap = {
        'preferenciaMusical': 'preferenciaMusicalQual',
        'tratamentoMedico': 'tratamentoMedicoQual',
        'tomaMedicacao': 'tomaMedicacaoQual',
        'submeteuCirurgia': 'submeteuCirurgiaQual',
        'alergiaMedicacao': 'alergiaMedicacaoQual',
        'alergiaAlimento': 'alergiaAlimentoQual',
        'alteracaoCardiologica': 'alteracaoCardiologicaQual',
        'problemaHormonal': 'problemaHormonalQual',
        'alergiaCosmeticos': 'alergiaCosmeticosQual'
    };
    
    // Adiciona event listeners para todas as perguntas condicionais
    Object.keys(conditionalMap).forEach(questionName => {
        const conditionalElementId = conditionalMap[questionName];
        const conditionalElement = document.getElementById(conditionalElementId);
        
        if (conditionalElement) {
            // Encontra todos os inputs de rádio com esse nome
            const radioInputs = document.querySelectorAll(`input[name="${questionName}"]`);
            
            radioInputs.forEach(input => {
                input.addEventListener('change', function() {
                    if (this.value === 'Sim') {
                        conditionalElement.style.display = 'block';
                        setTimeout(() => {
                            conditionalElement.style.opacity = '1';
                            conditionalElement.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        conditionalElement.style.opacity = '0';
                        conditionalElement.style.transform = 'translateY(-10px)';
                        setTimeout(() => {
                            conditionalElement.style.display = 'none';
                        }, 300);
                    }
                });
            });
        }
    });
    
    console.log('Perguntas condicionais configuradas');
}

/**
 * Configura a captura de dados em tempo real do formulário
 */
function setupRealTimeDataCapture() {
    // Captura dados de inputs de texto, selects e textareas
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Para inputs de texto, captura ao digitar (com debounce)
        if (input.type === 'text' || input.type === 'email' || input.type === 'tel' || input.type === 'date') {
            let timeout;
            input.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    captureFormData();
                    updateSummary();
                }, 500);
            });
        }
        // Para selects e radios, captura imediatamente
        else if (input.type === 'radio' || input.tagName === 'SELECT') {
            input.addEventListener('change', function() {
                captureFormData();
                updateSummary();
            });
        }
        // Para checkboxes
        else if (input.type === 'checkbox') {
            input.addEventListener('change', function() {
                captureFormData();
                updateSummary();
            });
        }
    });
    
    console.log('Captura de dados em tempo real configurada');
}

/**
 * Configura a validação do formulário
 */
function setupFormValidation() {
    // Validação customizada para CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            // Formata o CPF
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }
    
    // Validação customizada para telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            // Formata o telefone
            if (value.length > 0) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                if (value.length > 10) {
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                } else {
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                }
            }
            
            e.target.value = value;
        });
    }
    
    console.log('Validação do formulário configurada');
}

// ====================================
// MANIPULAÇÃO DE SEÇÕES E PROGRESSO
// ====================================

/**
 * Manipula a navegação para a próxima seção
 * @param {Event} event - Evento de clique
 */
function handleNextSection(event) {
    event.preventDefault();
    
    const currentSection = document.querySelector('.form-section.active');
    const nextSectionId = event.currentTarget.getAttribute('data-next');
    const nextSection = document.getElementById(nextSectionId);
    
    if (currentSection && nextSection) {
        // Valida a seção atual antes de prosseguir
        if (!validateSection(currentSection)) {
            showSectionError(currentSection);
            return;
        }
        
        // Atualiza a seção ativa
        currentSection.classList.remove('active');
        nextSection.classList.add('active');
        
        // Atualiza os passos da barra de progresso
        updateSteps(currentSection.id, nextSectionId);
        
        // Atualiza a barra de progresso
        updateProgressBar();
        
        // Se for a última seção, atualiza o resumo
        if (nextSectionId === 'section4') {
            captureFormData();
            updateSummary();
            
            // Habilita/desabilita o botão de envio baseado na assinatura
            submitFormBtn.disabled = !isSignatureSaved;
        }
        
        console.log(`Navegando da seção ${currentSection.id} para ${nextSectionId}`);
    }
}

/**
 * Manipula a navegação para a seção anterior
 * @param {Event} event - Evento de clique
 */
function handlePrevSection(event) {
    event.preventDefault();
    
    const currentSection = document.querySelector('.form-section.active');
    const prevSectionId = event.currentTarget.getAttribute('data-prev');
    const prevSection = document.getElementById(prevSectionId);
    
    if (currentSection && prevSection) {
        // Atualiza a seção ativa
        currentSection.classList.remove('active');
        prevSection.classList.add('active');
        
        // Atualiza os passos da barra de progresso
        updateSteps(currentSection.id, prevSectionId);
        
        // Atualiza a barra de progresso
        updateProgressBar();
        
        console.log(`Navegando da seção ${currentSection.id} para ${prevSectionId}`);
    }
}

/**
 * Valida uma seção do formulário
 * @param {HTMLElement} section - Elemento da seção a ser validada
 * @returns {boolean} True se a seção for válida
 */
function validateSection(section) {
    const requiredInputs = section.querySelectorAll('[required]');
    let isValid = true;
    
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

/**
 * Mostra um erro para uma seção inválida
 * @param {HTMLElement} section - Elemento da seção com erro
 */
function showSectionError(section) {
    // Adiciona uma classe de erro à seção
    section.classList.add('section-error');
    
    // Cria e exibe uma mensagem de erro
    let errorMessage = section.querySelector('.section-error-message');
    
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'section-error-message';
        errorMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> Por favor, preencha todos os campos obrigatórios antes de prosseguir.';
        section.insertBefore(errorMessage, section.querySelector('.form-navigation'));
    }
    
    // Remove a mensagem após alguns segundos
    setTimeout(() => {
        section.classList.remove('section-error');
        if (errorMessage && errorMessage.parentNode) {
            errorMessage.parentNode.removeChild(errorMessage);
        }
    }, 5000);
    
    console.log('Seção com campos obrigatórios não preenchidos');
}

/**
 * Atualiza os passos da barra de progresso
 * @param {string} currentId - ID da seção atual
 * @param {string} nextId - ID da próxima seção
 */
function updateSteps(currentId, nextId) {
    const currentStep = parseInt(currentId.replace('section', ''));
    const nextStep = parseInt(nextId.replace('section', ''));
    
    steps.forEach(step => {
        const stepNumber = parseInt(step.getAttribute('data-step'));
        
        if (stepNumber <= nextStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    console.log(`Atualizando passos: seção ${currentStep} -> ${nextStep}`);
}

/**
 * Atualiza a barra de progresso
 */
function updateProgressBar() {
    const activeSection = document.querySelector('.form-section.active');
    const activeSectionId = activeSection ? activeSection.id : 'section1';
    const activeStep = parseInt(activeSectionId.replace('section', ''));
    const progressPercentage = ((activeStep - 1) / 3) * 100;
    
    progressBar.style.setProperty('--progress-width', `${progressPercentage}%`);
    
    console.log(`Barra de progresso atualizada: ${progressPercentage}%`);
}

// ====================================
// MANIPULAÇÃO DE ASSINATURA
// ====================================

/**
 * Limpa a assinatura do canvas
 */
function clearSignature() {
    if (signaturePad) {
        signaturePad.clear();
        isSignatureSaved = false;
        signatureStatus.textContent = 'Não';
        signatureStatus.style.color = '#e75480';
        submitFormBtn.disabled = true;
        
        console.log('Assinatura limpa');
    }
}

/**
 * Salva a assinatura do canvas
 */
function saveSignature() {
    if (signaturePad && !signaturePad.isEmpty()) {
        // Converte a assinatura para base64
        formData.signatureData = signaturePad.toDataURL();
        isSignatureSaved = true;
        signatureStatus.textContent = 'Sim';
        signatureStatus.style.color = '#4caf50';
        submitFormBtn.disabled = false;
        
        console.log('Assinatura salva');
    } else {
        alert('Por favor, faça sua assinatura antes de salvar.');
        console.log('Tentativa de salvar assinatura vazia');
    }
}

// ====================================
// CAPTURA E ATUALIZAÇÃO DE DADOS
// ====================================

/**
 * Captura os dados do formulário e armazena no objeto formData
 */
function captureFormData() {
    // Dados pessoais
    formData.nomeCompleto = getInputValue('nomeCompleto');
    formData.dataNascimento = getInputValue('dataNascimento');
    formData.genero = getInputValue('genero');
    formData.telefone = getInputValue('telefone');
    formData.email = getInputValue('email');
    formData.endereco = getInputValue('endereco');
    formData.profissao = getInputValue('profissao');
    formData.rg = getInputValue('rg');
    formData.cpf = getInputValue('cpf');
    formData.autorizaImagem = document.getElementById('autorizaImagem').checked ? 'Sim' : 'Não';
    formData.preferenciaMusical = getRadioValue('preferenciaMusical');
    formData.preferenciaMusicalQual = getInputValue('preferenciaMusicalQual');
    
    // Saúde geral
    formData.tratamentoMedico = getRadioValue('tratamentoMedico');
    formData.tratamentoMedicoQual = getInputValue('tratamentoMedicoQual');
    formData.tomaMedicacao = getRadioValue('tomaMedicacao');
    formData.tomaMedicacaoQual = getInputValue('tomaMedicacaoQual');
    formData.submeteuCirurgia = getRadioValue('submeteuCirurgia');
    formData.submeteuCirurgiaQual = getInputValue('submeteuCirurgiaQual');
    formData.anestesiaOdontologica = getRadioValue('anestesiaOdontologica');
    formData.alergiaMedicacao = getRadioValue('alergiaMedicacao');
    formData.alergiaMedicacaoQual = getInputValue('alergiaMedicacaoQual');
    formData.alergiaAlimento = getRadioValue('alergiaAlimento');
    formData.alergiaAlimentoQual = getInputValue('alergiaAlimentoQual');
    formData.alteracaoCardiologica = getRadioValue('alteracaoCardiologica');
    formData.alteracaoCardiologicaQual = getInputValue('alteracaoCardiologicaQual');
    formData.diabetico = getRadioValue('diabetico');
    formData.convulsoesEpilepsia = getRadioValue('convulsoesEpilepsia');
    formData.disfuncaoRenal = getRadioValue('disfuncaoRenal');
    formData.problemaCoagulacao = getRadioValue('problemaCoagulacao');
    formData.gravidaLactante = getRadioValue('gravidaLactante');
    formData.problemaHormonal = getRadioValue('problemaHormonal');
    formData.problemaHormonalQual = getInputValue('problemaHormonalQual');
    formData.alergiaCosmeticos = getRadioValue('alergiaCosmeticos');
    formData.alergiaCosmeticosQual = getInputValue('alergiaCosmeticosQual');
    
    // Hábitos de higiene
    formData.frequenciaEscovacao = getInputValue('frequenciaEscovacao');
    formData.usoFioDental = getRadioValue('usoFioDental');
    formData.cremeDental = getInputValue('cremeDental');
    formData.escovaLingua = getRadioValue('escovaLingua');
    formData.marcaEscova = getInputValue('marcaEscova');
    formData.mordeObjetos = getRadioValue('mordeObjetos');
    formData.rangeDentes = getRadioValue('rangeDentes');
    formData.roiUnhas = getRadioValue('roiUnhas');
    
    // Data de envio
    formData.dataEnvio = new Date().toLocaleString('pt-BR');
    
    console.log('Dados do formulário capturados');
}

/**
 * Obtém o valor de um input pelo ID
 * @param {string} id - ID do elemento
 * @returns {string} Valor do elemento
 */
function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

/**
 * Obtém o valor de um grupo de radio buttons pelo nome
 * @param {string} name - Nome do grupo de radio buttons
 * @returns {string} Valor do radio button selecionado
 */
function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : '';
}

/**
 * Atualiza o resumo das informações na seção de confirmação
 */
function updateSummary() {
    if (!summaryContent) return;
    
    // Limpa o conteúdo atual
    summaryContent.innerHTML = '';
    
    // Adiciona os itens do resumo
    const summaryItems = [
        { label: 'Nome Completo', value: formData.nomeCompleto || 'Não informado' },
        { label: 'Data de Nascimento', value: formData.dataNascimento || 'Não informado' },
        { label: 'Gênero', value: formData.genero || 'Não informado' },
        { label: 'Telefone/WhatsApp', value: formData.telefone || 'Não informado' },
        { label: 'E-mail', value: formData.email || 'Não informado' },
        { label: 'Endereço', value: formData.endereco || 'Não informado' },
        { label: 'Profissão', value: formData.profissao || 'Não informado' },
        { label: 'RG', value: formData.rg || 'Não informado' },
        { label: 'CPF', value: formData.cpf || 'Não informado' },
        { label: 'Autoriza uso de imagem', value: formData.autorizaImagem },
        { label: 'Preferência musical', value: formData.preferenciaMusical === 'Sim' ? `Sim: ${formData.preferenciaMusicalQual}` : formData.preferenciaMusical || 'Não informado' },
        { label: 'Tratamento médico', value: formData.tratamentoMedico === 'Sim' ? `Sim: ${formData.tratamentoMedicoQual}` : formData.tratamentoMedico || 'Não informado' },
        { label: 'Medicação regular', value: formData.tomaMedicacao === 'Sim' ? `Sim: ${formData.tomaMedicacaoQual}` : formData.tomaMedicacao || 'Não informado' },
        { label: 'Cirurgias anteriores', value: formData.submeteuCirurgia === 'Sim' ? `Sim: ${formData.submeteuCirurgiaQual}` : formData.submeteuCirurgia || 'Não informado' },
        { label: 'Anestesia odontológica', value: formData.anestesiaOdontologica || 'Não informado' },
        { label: 'Alergia a medicamentos', value: formData.alergiaMedicacao === 'Sim' ? `Sim: ${formData.alergiaMedicacaoQual}` : formData.alergiaMedicacao || 'Não informado' },
        { label: 'Alergia a alimentos', value: formData.alergiaAlimento === 'Sim' ? `Sim: ${formData.alergiaAlimentoQual}` : formData.alergiaAlimento || 'Não informado' },
        { label: 'Alteração cardiológica', value: formData.alteracaoCardiologica === 'Sim' ? `Sim: ${formData.alteracaoCardiologicaQual}` : formData.alteracaoCardiologica || 'Não informado' },
        { label: 'Diabético', value: formData.diabetico || 'Não informado' },
        { label: 'Convulsões/Epilepsia', value: formData.convulsoesEpilepsia || 'Não informado' },
        { label: 'Disfunção renal', value: formData.disfuncaoRenal || 'Não informado' },
        { label: 'Problema de coagulação', value: formData.problemaCoagulacao || 'Não informado' },
        { label: 'Grávida/Lactante', value: formData.gravidaLactante || 'Não informado' },
        { label: 'Problema hormonal', value: formData.problemaHormonal === 'Sim' ? `Sim: ${formData.problemaHormonalQual}` : formData.problemaHormonal || 'Não informado' },
        { label: 'Alergia a cosméticos', value: formData.alergiaCosmeticos === 'Sim' ? `Sim: ${formData.alergiaCosmeticosQual}` : formData.alergiaCosmeticos || 'Não informado' },
        { label: 'Frequência de escovação', value: formData.frequenciaEscovacao || 'Não informado' },
        { label: 'Uso de fio dental', value: formData.usoFioDental || 'Não informado' },
        { label: 'Creme dental', value: formData.cremeDental || 'Não informado' },
        { label: 'Escova a língua', value: formData.escovaLingua || 'Não informado' },
        { label: 'Marca da escova', value: formData.marcaEscova || 'Não informado' },
        { label: 'Morde objetos', value: formData.mordeObjetos || 'Não informado' },
        { label: 'Range os dentes', value: formData.rangeDentes || 'Não informado' },
        { label: 'Rói as unhas', value: formData.roiUnhas || 'Não informado' },
    ];
    
    // Cria e adiciona os itens ao resumo
    summaryItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <div class="summary-label">${item.label}</div>
            <div class="summary-value">${item.value}</div>
        `;
        summaryContent.appendChild(itemElement);
    });
    
    console.log('Resumo atualizado');
}

// ====================================
// MANIPULAÇÃO DO ENVIO DO FORMULÁRIO
// ====================================

/**
 * Manipula o envio do formulário
 * @param {Event} event - Evento de submit
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Valida se a assinatura foi salva
    if (!isSignatureSaved) {
        alert('Por favor, salve sua assinatura antes de enviar o formulário.');
        console.log('Tentativa de envio sem assinatura salva');
        return;
    }
    
    // Captura os dados finais
    captureFormData();
    
    // Exibe o modal de confirmação
    showConfirmationModal();
    
    // Envia os dados para o Google Apps Script (simulado neste exemplo)
    sendDataToGoogleAppsScript();
    
    console.log('Formulário enviado com sucesso');
}

/**
 * Exibe o modal de confirmação
 */
function showConfirmationModal() {
    if (confirmationModal) {
        // Atualiza o e-mail do usuário no modal
        userEmailSpan.textContent = formData.email || 'não informado';
        
        // Exibe o modal
        confirmationModal.style.display = 'flex';
        
        console.log('Modal de confirmação exibido');
    }
}

/**
 * Envia os dados para o Google Apps Script (simulado)
 * Em um ambiente real, isso seria uma requisição fetch para o endpoint do Google Apps Script
 */
function sendDataToGoogleAppsScript() {
    // Simulação do envio para o Google Apps Script
    console.log('Enviando dados para o Google Apps Script:', formData);
    
    // Aqui você faria uma requisição fetch para o seu endpoint do Google Apps Script
    // fetch('https://script.google.com/macros/s/SEU_SCRIPT_ID/exec', {
    //     method: 'POST',
    //     body: JSON.stringify(formData),
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     console.log('Resposta do Google Apps Script:', data);
    // })
    // .catch(error => {
    //     console.error('Erro ao enviar dados para o Google Apps Script:', error);
    // });
    
    // Para fins de demonstração, vamos simular um envio bem-sucedido
    setTimeout(() => {
        console.log('Dados enviados com sucesso para o Google Apps Script (simulado)');
    }, 1000);
}

// ====================================
// GERAÇÃO E DOWNLOAD DO PDF
// ====================================

/**
 * Manipula o download do PDF
 */
function handleDownloadPdf() {
    generatePdf();
    console.log('Download do PDF iniciado');
}

/**
 * Gera o PDF com os dados do formulário
 */
function generatePdf() {
    // Verifica se jsPDF está disponível
    if (typeof jsPDF === 'undefined') {
        alert('Erro ao gerar PDF: biblioteca jsPDF não carregada.');
        console.error('Biblioteca jsPDF não está disponível');
        return;
    }
    
    try {
        // Cria um novo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Configurações de cores
        const primaryColor = '#e75480';
        const textColor = '#333333';
        const lightColor = '#666666';
        
        // Adiciona o cabeçalho
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 40, 'F');
        
        // Logo e título
        doc.setFontSize(20);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Dra. Jaqueline Nobre Moratore', 20, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(lightColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Odontologia Integrada & Bem-Estar', 20, 28);
        
        // Linha decorativa
        doc.setDrawColor(231, 84, 128);
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);
        
        // Título do formulário
        doc.setFontSize(18);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Formulário de Anamnese Odontológica', 20, 50);
        
        // Data de envio
        doc.setFontSize(10);
        doc.setTextColor(lightColor);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data de envio: ${formData.dataEnvio}`, 20, 58);
        
        // Informações do paciente
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados do Paciente', 20, 70);
        
        doc.setFontSize(11);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'normal');
        
        let yPosition = 80;
        
        // Dados pessoais
        const personalData = [
            `Nome: ${formData.nomeCompleto}`,
            `Data de Nascimento: ${formData.dataNascimento}`,
            `Gênero: ${formData.genero}`,
            `Telefone: ${formData.telefone}`,
            `E-mail: ${formData.email}`,
            `Endereço: ${formData.endereco}`,
            `Profissão: ${formData.profissao}`,
            `RG: ${formData.rg}`,
            `CPF: ${formData.cpf}`,
            `Autoriza uso de imagem: ${formData.autorizaImagem}`,
            `Preferência musical: ${formData.preferenciaMusical === 'Sim' ? `Sim: ${formData.preferenciaMusicalQual}` : formData.preferenciaMusical}`
        ];
        
        personalData.forEach(item => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(item, 20, yPosition);
            yPosition += 7;
        });
        
        // Adiciona uma nova página se necessário
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Saúde geral
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Saúde Geral', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'normal');
        
        const healthData = [
            `Tratamento médico: ${formData.tratamentoMedico === 'Sim' ? `Sim: ${formData.tratamentoMedicoQual}` : formData.tratamentoMedico}`,
            `Medicação regular: ${formData.tomaMedicacao === 'Sim' ? `Sim: ${formData.tomaMedicacaoQual}` : formData.tomaMedicacao}`,
            `Cirurgias anteriores: ${formData.submeteuCirurgia === 'Sim' ? `Sim: ${formData.submeteuCirurgiaQual}` : formData.submeteuCirurgia}`,
            `Anestesia odontológica: ${formData.anestesiaOdontologica}`,
            `Alergia a medicamentos: ${formData.alergiaMedicacao === 'Sim' ? `Sim: ${formData.alergiaMedicacaoQual}` : formData.alergiaMedicacao}`,
            `Alergia a alimentos: ${formData.alergiaAlimento === 'Sim' ? `Sim: ${formData.alergiaAlimentoQual}` : formData.alergiaAlimento}`,
            `Alteração cardiológica: ${formData.alteracaoCardiologica === 'Sim' ? `Sim: ${formData.alteracaoCardiologicaQual}` : formData.alteracaoCardiologica}`,
            `Diabético: ${formData.diabetico}`,
            `Convulsões/Epilepsia: ${formData.convulsoesEpilepsia}`,
            `Disfunção renal: ${formData.disfuncaoRenal}`,
            `Problema de coagulação: ${formData.problemaCoagulacao}`,
            `Grávida/Lactante: ${formData.gravidaLactante}`,
            `Problema hormonal: ${formData.problemaHormonal === 'Sim' ? `Sim: ${formData.problemaHormonalQual}` : formData.problemaHormonal}`,
            `Alergia a cosméticos: ${formData.alergiaCosmeticos === 'Sim' ? `Sim: ${formData.alergiaCosmeticosQual}` : formData.alergiaCosmeticos}`
        ];
        
        healthData.forEach(item => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(item, 20, yPosition);
            yPosition += 7;
        });
        
        // Adiciona uma nova página se necessário
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Hábitos de higiene
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Hábitos de Higiene Bucal', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'normal');
        
        const hygieneData = [
            `Frequência de escovação: ${formData.frequenciaEscovacao}`,
            `Uso de fio dental: ${formData.usoFioDental}`,
            `Creme dental: ${formData.cremeDental}`,
            `Escova a língua: ${formData.escovaLingua}`,
            `Marca da escova: ${formData.marcaEscova}`,
            `Morde objetos: ${formData.mordeObjetos}`,
            `Range os dentes: ${formData.rangeDentes}`,
            `Rói as unhas: ${formData.roiUnhas}`
        ];
        
        hygieneData.forEach(item => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(item, 20, yPosition);
            yPosition += 7;
        });
        
        // Adiciona uma nova página para a assinatura se necessário
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Assinatura
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Assinatura do Paciente', 20, yPosition);
        yPosition += 10;
        
        // Se houver uma assinatura, adiciona-a ao PDF
        if (formData.signatureData) {
            try {
                // Adiciona a imagem da assinatura ao PDF
                doc.addImage(formData.signatureData, 'PNG', 20, yPosition, 100, 40);
                yPosition += 50;
            } catch (error) {
                console.error('Erro ao adicionar assinatura ao PDF:', error);
                doc.text('Assinatura não pôde ser carregada', 20, yPosition);
                yPosition += 10;
            }
        } else {
            doc.text('Assinatura não fornecida', 20, yPosition);
            yPosition += 10;
        }
        
        // Data e local da assinatura
        doc.setFontSize(11);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
        yPosition += 7;
        doc.text('Local: Formulário Online', 20, yPosition);
        
        // Rodapé
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(lightColor);
            doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
            doc.text('Dra. Jaqueline Nobre Moratore - Rua Avaré nº15, Bairro Matriz, Sala 22, Mauá - SP - Tel: 11 98470-8439', 105, 292, { align: 'center' });
        }
        
        // Gera o nome do arquivo
        const fileName = `${formData.nomeCompleto.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Faz o download do PDF
        doc.save(fileName);
        
        console.log('PDF gerado com sucesso:', fileName);
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    }
}

/**
 * Manipula o fechamento do modal
 */
function handleCloseModal() {
    if (confirmationModal) {
        confirmationModal.style.display = 'none';
        
        // Reseta o formulário
        form.reset();
        
        // Reseta a assinatura
        if (signaturePad) {
            signaturePad.clear();
        }
        
        isSignatureSaved = false;
        signatureStatus.textContent = 'Não';
        signatureStatus.style.color = '#e75480';
        
        // Volta para a primeira seção
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById('section1').classList.add('active');
        
        // Reseta a barra de progresso
        steps.forEach(step => {
            if (step.getAttribute('data-step') === '1') {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        updateProgressBar();
        
        // Reseta o objeto formData
        formData = {
            nomeCompleto: '',
            dataNascimento: '',
            genero: '',
            telefone: '',
            email: '',
            endereco: '',
            profissao: '',
            rg: '',
            cpf: '',
            autorizaImagem: 'Não',
            preferenciaMusical: '',
            preferenciaMusicalQual: '',
            tratamentoMedico: '',
            tratamentoMedicoQual: '',
            tomaMedicacao: '',
            tomaMedicacaoQual: '',
            submeteuCirurgia: '',
            submeteuCirurgiaQual: '',
            anestesiaOdontologica: '',
            alergiaMedicacao: '',
            alergiaMedicacaoQual: '',
            alergiaAlimento: '',
            alergiaAlimentoQual: '',
            alteracaoCardiologica: '',
            alteracaoCardiologicaQual: '',
            diabetico: '',
            convulsoesEpilepsia: '',
            disfuncaoRenal: '',
            problemaCoagulacao: '',
            gravidaLactante: '',
            problemaHormonal: '',
            problemaHormonalQual: '',
            alergiaCosmeticos: '',
            alergiaCosmeticosQual: '',
            frequenciaEscovacao: '',
            usoFioDental: '',
            cremeDental: '',
            escovaLingua: '',
            marcaEscova: '',
            mordeObjetos: '',
            rangeDentes: '',
            roiUnhas: '',
            signatureData: null,
            dataEnvio: ''
        };
        
        console.log('Modal fechado e formulário resetado');
    }
}

// ====================================
// INICIALIZAÇÃO DO APLICATIVO
// ====================================

// Inicializa o aplicativo quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', initApp);
