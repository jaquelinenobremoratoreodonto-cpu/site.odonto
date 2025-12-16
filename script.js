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
const signatureError = document.getElementById('signatureError');
const confirmVeracityCheckbox = document.getElementById('confirmVeracity');
const veracityError = document.getElementById('veracityError');
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
    
    // Assinatura e veracidade
    signatureData: null,
    confirmVeracity: false,
    
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
    
    // Desabilita o botão de envio inicialmente
    updateSubmitButtonState();
    
    console.log('Aplicativo inicializado com sucesso!');
}

/**
 * Inicializa o canvas de assinatura
 */
function initSignaturePad() {
    if (signatureCanvas) {
        // Obtém o contexto 2D do canvas
        const ctx = signatureCanvas.getContext('2d');
        
        // Configura a qualidade da assinatura para telas de alta resolução
        const scale = window.devicePixelRatio || 1;
        const width = signatureCanvas.offsetWidth * scale;
        const height = signatureCanvas.offsetHeight * scale;
        
        // Define o tamanho do canvas
        signatureCanvas.width = width;
        signatureCanvas.height = height;
        
        // Ajusta o contexto para a escala
        ctx.scale(scale, scale);
        
        // Inicializa o SignaturePad
        signaturePad = new SignaturePad(signatureCanvas, {
            backgroundColor: 'white',
            penColor: '#e75480',
            minWidth: 1,
            maxWidth: 3,
            throttle: 16 // Controla a frequência de eventos para melhor performance
        });
        
        // Ajusta para dispositivos touch
        if (window.PointerEvent) {
            signatureCanvas.style.touchAction = 'none';
        }
        
        // Lida com redimensionamento da janela
        window.addEventListener('resize', handleResizeSignatureCanvas);
        
        console.log('Canvas de assinatura inicializado');
    } else {
        console.error('Canvas de assinatura não encontrado');
    }
}

/**
 * Ajusta o canvas de assinatura ao redimensionar a janela
 */
function handleResizeSignatureCanvas() {
    if (!signatureCanvas || !signaturePad) return;
    
    // Salva a assinatura atual
    const data = signaturePad.toData();
    
    // Redimensiona o canvas
    const scale = window.devicePixelRatio || 1;
    const width = signatureCanvas.offsetWidth * scale;
    const height = signatureCanvas.offsetHeight * scale;
    
    signatureCanvas.width = width;
    signatureCanvas.height = height;
    
    // Restaura a assinatura
    signaturePad.fromData(data);
    
    console.log('Canvas de assinatura redimensionado');
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
    
    // Eventos da veracidade
    if (confirmVeracityCheckbox) {
        confirmVeracityCheckbox.addEventListener('change', handleVeracityChange);
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
                            // Limpa o valor do campo condicional
                            const inputElement = conditionalElement.querySelector('input');
                            if (inputElement) inputElement.value = '';
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
                }, 300);
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
        
        // Se for a última seção, atualiza o resumo e configura os estados
        if (nextSectionId === 'section4') {
            captureFormData();
            updateSummary();
            
            // Atualiza o estado do botão de envio
            updateSubmitButtonState();
        }
        
        // Rola para o topo da seção
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
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
        
        // Rola para o topo da seção
        prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
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
        if (!input.value.trim() && input.type !== 'checkbox') {
            isValid = false;
            highlightError(input);
        } else if (input.type === 'checkbox' && !input.checked) {
            isValid = false;
            highlightError(input);
        } else {
            removeErrorHighlight(input);
        }
    });
    
    return isValid;
}

/**
 * Destaca um campo com erro
 * @param {HTMLElement} input - Elemento input com erro
 */
function highlightError(input) {
    input.classList.add('error');
    input.style.borderColor = '#f44336';
    
    // Adiciona animação de shake
    input.classList.add('shake');
    setTimeout(() => {
        input.classList.remove('shake');
    }, 500);
}

/**
 * Remove o destaque de erro de um campo
 * @param {HTMLElement} input - Elemento input
 */
function removeErrorHighlight(input) {
    input.classList.remove('error');
    input.style.borderColor = '';
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
        formData.signatureData = null;
        signatureStatus.textContent = 'Não';
        signatureStatus.style.color = '#e75480';
        
        // Oculta a mensagem de erro da assinatura
        if (signatureError) signatureError.style.display = 'none';
        
        // Atualiza o estado do botão de envio
        updateSubmitButtonState();
        
        console.log('Assinatura limpa');
    }
}

/**
 * Salva a assinatura do canvas
 */
function saveSignature() {
    if (signaturePad && !signaturePad.isEmpty()) {
        // Converte a assinatura para base64
        formData.signatureData = signaturePad.toDataURL('image/png');
        isSignatureSaved = true;
        signatureStatus.textContent = 'Sim';
        signatureStatus.style.color = '#4caf50';
        
        // Oculta a mensagem de erro da assinatura
        if (signatureError) signatureError.style.display = 'none';
        
        // Atualiza o estado do botão de envio
        updateSubmitButtonState();
        
        console.log('Assinatura salva');
    } else {
        // Mostra mensagem de erro
        if (signatureError) {
            signatureError.style.display = 'flex';
            signatureError.classList.add('shake');
            setTimeout(() => {
                signatureError.classList.remove('shake');
            }, 500);
        }
        
        console.log('Tentativa de salvar assinatura vazia');
    }
}

// ====================================
// MANIPULAÇÃO DA CONFIRMAÇÃO DE VERACIDADE
// ====================================

/**
 * Manipula a mudança no checkbox de veracidade
 * @param {Event} event - Evento de change
 */
function handleVeracityChange(event) {
    formData.confirmVeracity = event.target.checked;
    
    // Oculta a mensagem de erro se estiver marcado
    if (event.target.checked && veracityError) {
        veracityError.style.display = 'none';
    }
    
    // Atualiza o estado do botão de envio
    updateSubmitButtonState();
    
    console.log('Veracidade confirmada:', event.target.checked);
}

// ====================================
// ATUALIZAÇÃO DO ESTADO DO BOTÃO DE ENVIO
// ====================================

/**
 * Atualiza o estado do botão de envio baseado na assinatura e veracidade
 */
function updateSubmitButtonState() {
    if (!submitFormBtn) return;
    
    const isReady = isSignatureSaved && formData.confirmVeracity;
    submitFormBtn.disabled = !isReady;
    
    console.log('Estado do botão de envio atualizado:', isReady ? 'Habilitado' : 'Desabilitado');
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
    
    // Veracidade (já é capturada pelo event listener)
    
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
        { label: 'Data de Nascimento', value: formatDate(formData.dataNascimento) || 'Não informado' },
        { label: 'Gênero', value: formData.genero || 'Não informado' },
        { label: 'Telefone/WhatsApp', value: formData.telefone || 'Não informado' },
        { label: 'E-mail', value: formData.email || 'Não informado' },
        { label: 'Endereço', value: formData.endereco || 'Não informado' },
        { label: 'Profissão', value: formData.profissao || 'Não informado' },
        { label: 'RG', value: formData.rg || 'Não informado' },
        { label: 'CPF', value: formData.cpf || 'Não informado' },
        { label: 'Autoriza uso de imagem', value: formData.autorizaImagem },
        { label: 'Preferência musical', value: formData.preferenciaMusical === 'Sim' ? `Sim: ${formData.preferenciaMusicalQual || 'Não especificada'}` : formData.preferenciaMusical || 'Não informado' },
        { label: 'Tratamento médico', value: formData.tratamentoMedico === 'Sim' ? `Sim: ${formData.tratamentoMedicoQual || 'Não especificado'}` : formData.tratamentoMedico || 'Não informado' },
        { label: 'Medicação regular', value: formData.tomaMedicacao === 'Sim' ? `Sim: ${formData.tomaMedicacaoQual || 'Não especificada'}` : formData.tomaMedicacao || 'Não informado' },
        { label: 'Cirurgias anteriores', value: formData.submeteuCirurgia === 'Sim' ? `Sim: ${formData.submeteuCirurgiaQual || 'Não especificada'}` : formData.submeteuCirurgia || 'Não informado' },
        { label: 'Anestesia odontológica', value: formData.anestesiaOdontologica || 'Não informado' },
        { label: 'Alergia a medicamentos', value: formData.alergiaMedicacao === 'Sim' ? `Sim: ${formData.alergiaMedicacaoQual || 'Não especificada'}` : formData.alergiaMedicacao || 'Não informado' },
        { label: 'Alergia a alimentos', value: formData.alergiaAlimento === 'Sim' ? `Sim: ${formData.alergiaAlimentoQual || 'Não especificada'}` : formData.alergiaAlimento || 'Não informado' },
        { label: 'Alteração cardiológica', value: formData.alteracaoCardiologica === 'Sim' ? `Sim: ${formData.alteracaoCardiologicaQual || 'Não especificada'}` : formData.alteracaoCardiologica || 'Não informado' },
        { label: 'Diabético', value: formData.diabetico || 'Não informado' },
        { label: 'Convulsões/Epilepsia', value: formData.convulsoesEpilepsia || 'Não informado' },
        { label: 'Disfunção renal', value: formData.disfuncaoRenal || 'Não informado' },
        { label: 'Problema de coagulação', value: formData.problemaCoagulacao || 'Não informado' },
        { label: 'Grávida/Lactante', value: formData.gravidaLactante || 'Não informado' },
        { label: 'Problema hormonal', value: formData.problemaHormonal === 'Sim' ? `Sim: ${formData.problemaHormonalQual || 'Não especificado'}` : formData.problemaHormonal || 'Não informado' },
        { label: 'Alergia a cosméticos', value: formData.alergiaCosmeticos === 'Sim' ? `Sim: ${formData.alergiaCosmeticosQual || 'Não especificada'}` : formData.alergiaCosmeticos || 'Não informado' },
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

/**
 * Formata uma data no formato brasileiro
 * @param {string} dateString - String da data no formato YYYY-MM-DD
 * @returns {string} Data formatada no formato DD/MM/YYYY
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('pt-BR');
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
    
    console.log('Iniciando envio do formulário...');
    
    // Valida se a assinatura foi salva
    if (!isSignatureSaved) {
        console.log('Assinatura não salva');
        
        if (signatureError) {
            signatureError.style.display = 'flex';
            signatureError.classList.add('shake');
            setTimeout(() => {
                signatureError.classList.remove('shake');
            }, 500);
        }
        
        // Rola para a seção de assinatura
        document.getElementById('signatureCanvas').scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        alert('Por favor, salve sua assinatura antes de enviar o formulário.');
        return;
    }
    
    // Valida se a veracidade foi confirmada
    if (!formData.confirmVeracity) {
        console.log('Veracidade não confirmada');
        
        if (veracityError) {
            veracityError.style.display = 'flex';
            veracityError.classList.add('shake');
            setTimeout(() => {
                veracityError.classList.remove('shake');
            }, 500);
        }
        
        // Rola para a declaração de veracidade
        document.getElementById('confirmVeracity').scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        alert('Por favor, confirme a veracidade das informações antes de enviar o formulário.');
        return;
    }
    
    // Valida todas as seções do formulário
    let allSectionsValid = true;
    sections.forEach(section => {
        if (!validateSection(section)) {
            allSectionsValid = false;
        }
    });
    
    if (!allSectionsValid) {
        alert('Por favor, preencha todos os campos obrigatórios antes de enviar o formulário.');
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
        
        // Adiciona uma animação de entrada
        confirmationModal.querySelector('.modal-content').classList.add('animate-in');
        
        console.log('Modal de confirmação exibido');
    }
}

/**
 * Envia os dados para o Google Apps Script (simulado)
 */
function sendDataToGoogleAppsScript() {
    // Simulação do envio para o Google Apps Script
    console.log('Enviando dados para o Google Apps Script:', formData);
    
    // Em produção, descomente e ajuste este código:
    fetch('https://script.google.com/macros/s/AKfycbwBgUr8gewHvfQDF5aFW1l03Iziyb1rHznKkzsAWJK7Qa7lSsonZlOygvCNAgXg7B4y/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(() => {
        console.log('Dados enviados com sucesso para o Google Apps Script');
    })
    .catch(error => {
        console.error('Erro ao enviar dados para o Google Apps Script:', error);
    });
    
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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Configurações
        const primaryColor = [231, 84, 128];
        const textColor = [51, 51, 51];
        const lightColor = [102, 102, 102];
        
        // Cabeçalho
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 40, 'F');
        
        // Logo e título
        doc.setFontSize(20);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Dra. Jaqueline Nobre Moratore', 20, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(...lightColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Odontologia Integrada & Bem-Estar', 20, 28);
        
        // Linha decorativa
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);
        
        // Título do formulário
        doc.setFontSize(18);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Formulário de Anamnese Odontológica', 20, 50);
        
        // Data de envio
        doc.setFontSize(10);
        doc.setTextColor(...lightColor);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data de envio: ${formData.dataEnvio}`, 20, 58);
        
        // Informações do paciente
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados do Paciente', 20, 70);
        
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');
        
        let yPosition = 80;
        
        // Dados pessoais
        const personalData = [
            `Nome: ${formData.nomeCompleto}`,
            `Data de Nascimento: ${formatDate(formData.dataNascimento)}`,
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
        
        // Saúde geral
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Saúde Geral', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
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
        
        // Hábitos de higiene
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Hábitos de Higiene Bucal', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
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
        
        // Declaração e assinatura
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Declaração e Assinatura', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');
        
        // Declaração de veracidade
        const declaration = 'Declaro, sob as penas da lei, que todas as informações fornecidas neste formulário são verdadeiras e estou ciente que informações falsas podem acarretar em prejuízos ao meu tratamento.';
        const splitDeclaration = doc.splitTextToSize(declaration, 170);
        doc.text(splitDeclaration, 20, yPosition);
        yPosition += splitDeclaration.length * 7 + 10;
        
        doc.text(`Confirmado: ${formData.confirmVeracity ? 'Sim' : 'Não'}`, 20, yPosition);
        yPosition += 10;
        
        // Assinatura
        if (formData.signatureData) {
            try {
                const img = new Image();
                img.src = formData.signatureData;
                
                // Adiciona a imagem da assinatura
                doc.addImage(img, 'PNG', 20, yPosition, 100, 40);
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
        
        // Data e local
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
        yPosition += 7;
        doc.text('Local: Formulário Online', 20, yPosition);
        
        // Rodapé
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...lightColor);
            doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
            doc.text('Dra. Jaqueline Nobre Moratore - Rua Avaré nº15, Bairro Matriz, Sala 22, Mauá - SP - Tel: 11 98470-8439', 105, 292, { align: 'center' });
        }
        
        // Gera o nome do arquivo
        const cleanName = formData.nomeCompleto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
        
        const fileName = `${cleanName || 'anamnese'}.${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Faz o download do PDF
        doc.save(fileName);
        
        console.log('PDF gerado com sucesso:', fileName);
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    }
}

// ====================================
// MANIPULAÇÃO DO MODAL
// ====================================

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
        
        // Reseta os estados
        isSignatureSaved = false;
        formData.confirmVeracity = false;
        signatureStatus.textContent = 'Não';
        signatureStatus.style.color = '#e75480';
        
        // Reseta a checkbox de veracidade
        if (confirmVeracityCheckbox) {
            confirmVeracityCheckbox.checked = false;
        }
        
        // Reseta as mensagens de erro
        if (signatureError) signatureError.style.display = 'none';
        if (veracityError) veracityError.style.display = 'none';
        
        // Atualiza o estado do botão de envio
        updateSubmitButtonState();
        
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
            confirmVeracity: false,
            dataEnvio: ''
        };
        
        // Limpa o resumo
        if (summaryContent) {
            summaryContent.innerHTML = '';
        }
        
        // Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('Modal fechado e formulário resetado');
    }
}

// ====================================
// INICIALIZAÇÃO DO APLICATIVO
// ====================================

// Inicializa o aplicativo quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', initApp);

// Configura o canvas de assinatura quando a janela é redimensionada
window.addEventListener('resize', function() {
    if (signaturePad) {
        // Pequeno delay para garantir que o redimensionamento foi concluído
        setTimeout(() => {
            const data = signaturePad.toData();
            const canvas = signaturePad.canvas;
            
            // Redimensiona o canvas
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            
            // Limpa e redesenha a assinatura
            signaturePad.clear();
            if (data && data.length > 0) {
                signaturePad.fromData(data);
            }
        }, 250);
    }
});
