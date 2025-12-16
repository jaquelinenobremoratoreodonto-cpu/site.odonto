// ====================================
// VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ====================================

// Referências aos elementos DOM principais
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

// Objeto para armazenar todos os dados do formulário
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
    
    // Assinatura e confirmação
    signatureData: null,
    confirmVeracity: false,
    
    // Data de envio
    dataEnvio: '',
    
    // Informações da clínica
    clinica: {
        nome: 'Dra. Jaqueline Nobre Moratore',
        telefone: '11 98470-8439',
        email: 'jaque.nobre.moratore.odonto@gmail.com',
        instagram: '@dentista.jaque',
        endereco: 'Rua Avaré nº15, Bairro Matriz, Sala 22, Mauá - SP'
    }
};

// Variáveis de controle
let isSignatureSaved = false;
let signaturePad = null;
let isSubmitting = false;

// ====================================
// INICIALIZAÇÃO DO APLICATIVO
// ====================================

/**
 * Função principal de inicialização
 */
function initApp() {
    console.log('🚀 Inicializando Formulário de Anamnese Odontológica...');
    
    // Inicializa os componentes
    initSignaturePad();
    setupEventListeners();
    setupConditionalQuestions();
    setupFormValidation();
    updateProgressBar();
    
    // Define a data atual como padrão no campo de nascimento
    setDefaultDate();
    
    console.log('✅ Aplicativo inicializado com sucesso!');
}

/**
 * Inicializa o canvas de assinatura digital
 */
function initSignaturePad() {
    if (!signatureCanvas) {
        console.error('❌ Canvas de assinatura não encontrado!');
        return;
    }
    
    console.log('🖋️ Inicializando canvas de assinatura...');
    
    // Configura o canvas para alta resolução
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const canvasWidth = signatureCanvas.offsetWidth * ratio;
    const canvasHeight = signatureCanvas.offsetHeight * ratio;
    
    // Define o tamanho do canvas
    signatureCanvas.width = canvasWidth;
    signatureCanvas.height = canvasHeight;
    
    // Ajusta o contexto para a escala
    const ctx = signatureCanvas.getContext('2d');
    ctx.scale(ratio, ratio);
    
    // Configura a cor da linha
    ctx.strokeStyle = '#e75480';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Inicializa o SignaturePad
    signaturePad = new SignaturePad(signatureCanvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(231, 84, 128)',
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16,
        velocityFilterWeight: 0.7
    });
    
    console.log('✅ SignaturePad inicializado:', signaturePad);
    
    // Adiciona evento para limpar a assinatura ao redimensionar
    window.addEventListener('resize', handleSignatureResize);
}

/**
 * Lida com o redimensionamento do canvas de assinatura
 */
function handleSignatureResize() {
    if (!signaturePad || !signatureCanvas) return;
    
    // Salva a assinatura atual
    const data = signaturePad.toData();
    
    // Redimensiona o canvas
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    signatureCanvas.width = signatureCanvas.offsetWidth * ratio;
    signatureCanvas.height = signatureCanvas.offsetHeight * ratio;
    signatureCanvas.getContext('2d').scale(ratio, ratio);
    
    // Limpa e redesenha se houver assinatura
    signaturePad.clear();
    if (data && data.length > 0) {
        signaturePad.fromData(data);
    }
}

/**
 * Define a data atual como padrão no campo de nascimento
 */
function setDefaultDate() {
    const dataNascimentoInput = document.getElementById('dataNascimento');
    if (dataNascimentoInput) {
        // Define a data para 18 anos atrás como padrão
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        
        dataNascimentoInput.min = minDate.toISOString().split('T')[0];
        dataNascimentoInput.max = maxDate.toISOString().split('T')[0];
        
        // Data padrão: 30 anos atrás
        const defaultDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
        dataNascimentoInput.value = defaultDate.toISOString().split('T')[0];
        
        // Atualiza os dados do formulário
        formData.dataNascimento = dataNascimentoInput.value;
    }
}

// ====================================
// CONFIGURAÇÃO DE EVENTOS
// ====================================

/**
 * Configura todos os event listeners do aplicativo
 */
function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Navegação entre seções
    document.querySelectorAll('.btn-next').forEach(button => {
        button.addEventListener('click', handleNextSection);
    });
    
    document.querySelectorAll('.btn-prev').forEach(button => {
        button.addEventListener('click', handlePrevSection);
    });
    
    // Assinatura digital
    if (clearSignatureBtn) {
        clearSignatureBtn.addEventListener('click', clearSignature);
    }
    
    if (saveSignatureBtn) {
        saveSignatureBtn.addEventListener('click', saveSignature);
    }
    
    // Verificação de veracidade
    if (confirmVeracityCheckbox) {
        confirmVeracityCheckbox.addEventListener('change', function() {
            formData.confirmVeracity = this.checked;
            if (this.checked) {
                veracityError.style.display = 'none';
                confirmVeracityCheckbox.parentElement.classList.remove('error');
            }
            updateSubmitButtonState();
        });
    }
    
    // Envio do formulário
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Modal de confirmação
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', handleDownloadPdf);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', handleCloseModal);
    }
    
    // Captura de dados em tempo real
    setupRealTimeDataCapture();
    
    console.log('✅ Event listeners configurados');
}

/**
 * Configura a captura de dados em tempo real
 */
function setupRealTimeDataCapture() {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Para campos de texto, email, telefone, data
        if (['text', 'email', 'tel', 'date'].includes(input.type)) {
            let timeout;
            input.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    captureFormData();
                    if (document.querySelector('.form-section.active').id === 'section4') {
                        updateSummary();
                    }
                }, 300);
            });
        }
        
        // Para selects e radios
        if (input.type === 'radio' || input.tagName === 'SELECT') {
            input.addEventListener('change', function() {
                captureFormData();
                if (document.querySelector('.form-section.active').id === 'section4') {
                    updateSummary();
                }
            });
        }
        
        // Para checkboxes
        if (input.type === 'checkbox') {
            input.addEventListener('change', function() {
                captureFormData();
                if (document.querySelector('.form-section.active').id === 'section4') {
                    updateSummary();
                }
            });
        }
    });
}

/**
 * Configura as perguntas condicionais
 */
function setupConditionalQuestions() {
    console.log('🔧 Configurando perguntas condicionais...');
    
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
    
    Object.keys(conditionalMap).forEach(questionName => {
        const conditionalId = conditionalMap[questionName];
        const conditionalElement = document.getElementById(conditionalId);
        
        if (conditionalElement) {
            document.querySelectorAll(`input[name="${questionName}"]`).forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.value === 'Sim') {
                        // Mostra o campo condicional
                        conditionalElement.style.display = 'block';
                        conditionalElement.style.opacity = '0';
                        conditionalElement.style.transform = 'translateY(-10px)';
                        
                        setTimeout(() => {
                            conditionalElement.style.opacity = '1';
                            conditionalElement.style.transform = 'translateY(0)';
                            conditionalElement.classList.add('show');
                            conditionalElement.classList.remove('hide');
                        }, 10);
                        
                        // Torna o campo obrigatório
                        const inputElement = conditionalElement.querySelector('input');
                        if (inputElement) {
                            inputElement.required = true;
                            inputElement.disabled = false;
                        }
                    } else {
                        // Oculta o campo condicional
                        conditionalElement.style.opacity = '0';
                        conditionalElement.style.transform = 'translateY(-10px)';
                        conditionalElement.classList.add('hide');
                        conditionalElement.classList.remove('show');
                        
                        setTimeout(() => {
                            conditionalElement.style.display = 'none';
                            // Remove a obrigatoriedade e limpa o campo
                            const inputElement = conditionalElement.querySelector('input');
                            if (inputElement) {
                                inputElement.required = false;
                                inputElement.value = '';
                                inputElement.disabled = true;
                            }
                        }, 300);
                    }
                });
            });
        }
    });
    
    console.log('✅ Perguntas condicionais configuradas');
}

/**
 * Configura a validação do formulário
 */
function setupFormValidation() {
    // Formatação do CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // Limita a 11 dígitos
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            // Aplica a formatação
            if (value.length > 9) {
                value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
            } else if (value.length > 3) {
                value = value.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
            }
            
            e.target.value = value;
            
            // Valida o CPF
            validateCPF(value);
        });
    }
    
    // Formatação do telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // Limita a 11 dígitos
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            // Aplica a formatação
            if (value.length > 10) {
                // Formato: (11) 99999-9999
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (value.length > 6) {
                // Formato: (11) 9999-9999
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d{0,2}).*/, '($1');
            }
            
            e.target.value = value;
        });
    }
    
    console.log('✅ Validação do formulário configurada');
}

/**
 * Valida um CPF
 */
function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    
    if (cpf === '') return false;
    
    // Elimina CPFs inválidos conhecidos
    if (cpf.length !== 11 ||
        cpf === "00000000000" ||
        cpf === "11111111111" ||
        cpf === "22222222222" ||
        cpf === "33333333333" ||
        cpf === "44444444444" ||
        cpf === "55555555555" ||
        cpf === "66666666666" ||
        cpf === "77777777777" ||
        cpf === "88888888888" ||
        cpf === "99999999999")
        return false;
    
    // Valida 1º dígito
    let add = 0;
    for (let i = 0; i < 9; i++)
        add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11)
        rev = 0;
    if (rev !== parseInt(cpf.charAt(9)))
        return false;
    
    // Valida 2º dígito
    add = 0;
    for (let i = 0; i < 10; i++)
        add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11)
        rev = 0;
    if (rev !== parseInt(cpf.charAt(10)))
        return false;
    
    return true;
}

// ====================================
// ASSINATURA DIGITAL
// ====================================

/**
 * Limpa a assinatura do canvas
 */
function clearSignature() {
    if (signaturePad) {
        signaturePad.clear();
        isSignatureSaved = false;
        signatureStatus.textContent = 'Aguardando assinatura';
        signatureStatus.className = 'signature-status pending';
        signatureError.style.display = 'none';
        formData.signatureData = null;
        
        updateSubmitButtonState();
        console.log('🖋️ Assinatura limpa');
    }
}

/**
 * Salva a assinatura do canvas
 */
function saveSignature() {
    if (!signaturePad) {
        console.error('❌ SignaturePad não inicializado!');
        showError('Erro no sistema de assinatura. Por favor, recarregue a página.');
        return;
    }
    
    if (signaturePad.isEmpty()) {
        signatureError.textContent = 'Por favor, faça sua assinatura antes de salvar.';
        signatureError.style.display = 'flex';
        signatureError.classList.add('shake');
        setTimeout(() => signatureError.classList.remove('shake'), 500);
        console.log('❌ Tentativa de salvar assinatura vazia');
        return;
    }
    
    try {
        // Converte a assinatura para base64 (PNG)
        const signatureData = signaturePad.toDataURL('image/png');
        
        // Armazena os dados
        formData.signatureData = signatureData;
        isSignatureSaved = true;
        
        // Atualiza a interface
        signatureStatus.textContent = 'Assinatura salva ✓';
        signatureStatus.className = 'signature-status saved';
        signatureError.style.display = 'none';
        
        // Atualiza o estado do botão de envio
        updateSubmitButtonState();
        
        console.log('✅ Assinatura salva com sucesso!');
        
        // Feedback visual
        saveSignatureBtn.innerHTML = '<i class="fas fa-check"></i> Salva!';
        saveSignatureBtn.style.backgroundColor = '#4caf50';
        
        setTimeout(() => {
            saveSignatureBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Assinatura';
            saveSignatureBtn.style.backgroundColor = '';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar assinatura:', error);
        showError('Erro ao salvar assinatura. Por favor, tente novamente.');
    }
}

// ====================================
// NAVEGAÇÃO DO FORMULÁRIO
// ====================================

/**
 * Lida com a navegação para a próxima seção
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
            updateSubmitButtonState();
            
            // Rola para o topo da seção
            setTimeout(() => {
                nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
        
        console.log(`🔀 Navegando: ${currentSection.id} → ${nextSectionId}`);
    }
}

/**
 * Lida com a navegação para a seção anterior
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
        setTimeout(() => {
            prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        
        console.log(`🔀 Navegando: ${currentSection.id} → ${prevSectionId}`);
    }
}

/**
 * Valida uma seção do formulário
 */
function validateSection(section) {
    let isValid = true;
    const requiredInputs = section.querySelectorAll('[required]');
    
    // Remove erros anteriores
    section.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
        const errorSpan = group.querySelector('.field-error');
        if (errorSpan) errorSpan.style.display = 'none';
    });
    
    // Valida cada campo obrigatório
    requiredInputs.forEach(input => {
        const formGroup = input.closest('.form-group');
        
        if (input.type === 'checkbox' && !input.checked) {
            isValid = false;
            formGroup.classList.add('error');
            const errorSpan = formGroup.querySelector('.field-error');
            if (errorSpan) {
                errorSpan.textContent = 'Este campo é obrigatório';
                errorSpan.style.display = 'block';
            }
        } else if (input.type === 'radio') {
            const radioName = input.name;
            const radioChecked = section.querySelector(`input[name="${radioName}"]:checked`);
            if (!radioChecked) {
                isValid = false;
                const radioGroup = document.querySelector(`input[name="${radioName}"]`).closest('.form-group');
                radioGroup.classList.add('error');
                const errorSpan = radioGroup.querySelector('.field-error');
                if (errorSpan) {
                    errorSpan.textContent = 'Selecione uma opção';
                    errorSpan.style.display = 'block';
                }
            }
        } else if (!input.value.trim()) {
            isValid = false;
            formGroup.classList.add('error');
            const errorSpan = formGroup.querySelector('.field-error');
            if (errorSpan) {
                errorSpan.textContent = 'Este campo é obrigatório';
                errorSpan.style.display = 'block';
            }
        }
    });
    
    return isValid;
}

/**
 * Mostra erro em uma seção
 */
function showSectionError(section) {
    section.classList.add('shake');
    setTimeout(() => section.classList.remove('shake'), 500);
    
    // Cria mensagem de erro se não existir
    let errorMessage = section.querySelector('.section-error-message');
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'section-error-message error-message';
        errorMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> Por favor, preencha todos os campos obrigatórios antes de prosseguir.';
        section.querySelector('.form-navigation').before(errorMessage);
    }
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        if (errorMessage && errorMessage.parentNode) {
            errorMessage.remove();
        }
    }, 5000);
}

/**
 * Atualiza os passos da barra de progresso
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
    
    console.log(`📊 Atualizando passos: ${currentStep} → ${nextStep}`);
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
    console.log(`📊 Progresso: ${progressPercentage}%`);
}

// ====================================
// CAPTURA E ATUALIZAÇÃO DE DADOS
// ====================================

/**
 * Captura todos os dados do formulário
 */
function captureFormData() {
    console.log('📝 Capturando dados do formulário...');
    
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
    formData.autorizaImagem = document.getElementById('autorizaImagem')?.checked ? 'Sim' : 'Não';
    formData.preferenciaMusical = getRadioValue('preferenciaMusical');
    formData.preferenciaMusicalQual = getInputValue('preferenciaMusicalQualInput');
    
    // Saúde geral
    formData.tratamentoMedico = getRadioValue('tratamentoMedico');
    formData.tratamentoMedicoQual = getInputValue('tratamentoMedicoQualInput');
    formData.tomaMedicacao = getRadioValue('tomaMedicacao');
    formData.tomaMedicacaoQual = getInputValue('tomaMedicacaoQualInput');
    formData.submeteuCirurgia = getRadioValue('submeteuCirurgia');
    formData.submeteuCirurgiaQual = getInputValue('submeteuCirurgiaQualInput');
    formData.anestesiaOdontologica = getRadioValue('anestesiaOdontologica');
    formData.alergiaMedicacao = getRadioValue('alergiaMedicacao');
    formData.alergiaMedicacaoQual = getInputValue('alergiaMedicacaoQualInput');
    formData.alergiaAlimento = getRadioValue('alergiaAlimento');
    formData.alergiaAlimentoQual = getInputValue('alergiaAlimentoQualInput');
    formData.alteracaoCardiologica = getRadioValue('alteracaoCardiologica');
    formData.alteracaoCardiologicaQual = getInputValue('alteracaoCardiologicaQualInput');
    formData.diabetico = getRadioValue('diabetico');
    formData.convulsoesEpilepsia = getRadioValue('convulsoesEpilepsia');
    formData.disfuncaoRenal = getRadioValue('disfuncaoRenal');
    formData.problemaCoagulacao = getRadioValue('problemaCoagulacao');
    formData.gravidaLactante = getRadioValue('gravidaLactante');
    formData.problemaHormonal = getRadioValue('problemaHormonal');
    formData.problemaHormonalQual = getInputValue('problemaHormonalQualInput');
    formData.alergiaCosmeticos = getRadioValue('alergiaCosmeticos');
    formData.alergiaCosmeticosQual = getInputValue('alergiaCosmeticosQualInput');
    
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
    formData.dataEnvio = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    console.log('✅ Dados capturados:', formData);
}

/**
 * Obtém o valor de um campo de entrada
 */
function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

/**
 * Obtém o valor de um grupo de radio buttons
 */
function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : '';
}

/**
 * Atualiza o resumo das informações
 */
function updateSummary() {
    if (!summaryContent) return;
    
    summaryContent.innerHTML = '';
    
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
    
    summaryItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <div class="summary-label">${item.label}</div>
            <div class="summary-value">${item.value}</div>
        `;
        summaryContent.appendChild(itemElement);
    });
    
    console.log('✅ Resumo atualizado');
}

/**
 * Formata uma data
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return dateString;
    }
}

// ====================================
   ENVIO DO FORMULÁRIO
// ====================================

/**
 * Atualiza o estado do botão de envio
 */
function updateSubmitButtonState() {
    if (!submitFormBtn) return;
    
    const isReady = isSignatureSaved && formData.confirmVeracity;
    
    submitFormBtn.disabled = !isReady;
    submitFormBtn.title = isReady ? 'Clique para enviar o formulário' : 'Complete a assinatura e confirme a veracidade';
    
    console.log(`🔄 Estado do botão: ${isReady ? 'HABILITADO' : 'DESABILITADO'}`);
    console.log(`   - Assinatura: ${isSignatureSaved ? '✓' : '✗'}`);
    console.log(`   - Veracidade: ${formData.confirmVeracity ? '✓' : '✗'}`);
}

/**
 * Lida com o envio do formulário
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) {
        console.log('⏳ Envio já em andamento...');
        return;
    }
    
    console.log('🚀 Iniciando envio do formulário...');
    
    // Validações finais
    if (!validateFinalSubmission()) {
        console.log('❌ Validações falharam');
        return;
    }
    
    // Atualiza estado de envio
    isSubmitting = true;
    submitFormBtn.disabled = true;
    submitFormBtn.classList.add('loading');
    
    try {
        // Captura dados finais
        captureFormData();
        
        // Simula processamento (remover em produção)
        await simulateProcessing();
        
        // Mostra modal de confirmação
        showConfirmationModal();
        
        // Envia dados para o Google Apps Script
        await sendToGoogleAppsScript();
        
        console.log('✅ Formulário enviado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao enviar formulário:', error);
        showError('Erro ao enviar formulário. Por favor, tente novamente.');
    } finally {
        // Restaura estado do botão
        isSubmitting = false;
        submitFormBtn.disabled = false;
        submitFormBtn.classList.remove('loading');
    }
}

/**
 * Valida o envio final do formulário
 */
function validateFinalSubmission() {
    let isValid = true;
    
    // Valida assinatura
    if (!isSignatureSaved) {
        signatureError.textContent = 'Você precisa salvar sua assinatura.';
        signatureError.style.display = 'flex';
        signatureError.classList.add('shake');
        setTimeout(() => signatureError.classList.remove('shake'), 500);
        
        // Rola para a assinatura
        signatureCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        isValid = false;
    }
    
    // Valida veracidade
    if (!formData.confirmVeracity) {
        veracityError.style.display = 'flex';
        veracityError.classList.add('shake');
        setTimeout(() => veracityError.classList.remove('shake'), 500);
        
        // Rola para a declaração
        confirmVeracityCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        isValid = false;
    }
    
    // Valida todos os campos obrigatórios
    sections.forEach(section => {
        if (!validateSection(section)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showError('Por favor, corrija os erros antes de enviar.');
    }
    
    return isValid;
}

/**
 * Simula processamento (para demonstração)
 */
function simulateProcessing() {
    return new Promise(resolve => {
        console.log('⏳ Simulando processamento...');
        setTimeout(resolve, 2000);
    });
}

/**
 * Mostra o modal de confirmação
 */
function showConfirmationModal() {
    if (!confirmationModal) {
        console.error('❌ Modal de confirmação não encontrado');
        return;
    }
    
    // Atualiza o email no modal
    userEmailSpan.textContent = formData.email || 'não informado';
    
    // Mostra o modal
    confirmationModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal de confirmação exibido');
}

/**
 * Envia dados para o Google Apps Script
 */
async function sendToGoogleAppsScript() {
    console.log('📤 Enviando dados para Google Apps Script...');
    
    // URL do seu Google Apps Script (substitua pela sua)
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwBgUr8gewHvfQDF5aFW1l03Iziyb1rHznKkzsAWJK7Qa7lSsonZlOygvCNAgXg7B4y/exec';
    
    // Preparar dados para envio
    const dataToSend = {
        ...formData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`
    };
    
    console.log('📦 Dados preparados para envio:', dataToSend);
    
    // Em produção, descomente este código:
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Importante para Google Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        
        console.log('✅ Dados enviados com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao enviar dados:', error);
        throw error;
    }
    
    // Para demonstração, simulamos o envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Envio simulado com sucesso');
}

// ====================================
// GERAÇÃO DE PDF
// ====================================

/**
 * Lida com o download do PDF
 */
function handleDownloadPdf() {
    console.log('📄 Gerando PDF...');
    
    try {
        generatePdf();
        console.log('✅ PDF gerado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error);
        showError('Erro ao gerar PDF. Por favor, tente novamente.');
    }
}

/**
 * Gera o PDF com os dados do formulário
 */
function generatePdf() {
    // Verifica se a biblioteca está disponível
    if (typeof jsPDF === 'undefined') {
        throw new Error('Biblioteca jsPDF não carregada');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Configurações
    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    let yPosition = margin;
    
    // Cores
    const primaryColor = [231, 84, 128];
    const textColor = [51, 51, 51];
    const lightColor = [102, 102, 102];
    
    // ==================== CABEÇALHO ====================
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Dra. Jaqueline Nobre Moratore', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Odontologia Integrada & Bem-Estar', pageWidth / 2, 30, { align: 'center' });
    
    yPosition = 50;
    
    // ==================== TÍTULO ====================
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMULÁRIO DE ANAMNESE ODONTOLÓGICA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightColor);
    doc.text(`Data de envio: ${formData.dataEnvio}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // ==================== DADOS DO PACIENTE ====================
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PACIENTE', margin, yPosition);
    yPosition += 10;
    
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Dados pessoais
    doc.setTextColor(...textColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const personalInfo = [
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
        `Preferência musical: ${formData.preferenciaMusical === 'Sim' ? `Sim (${formData.preferenciaMusicalQual})` : formData.preferenciaMusical}`
    ];
    
    personalInfo.forEach(info => {
        if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
        doc.text(info, margin, yPosition);
        yPosition += 7;
    });
    
    yPosition += 5;
    
    // ==================== SAÚDE GERAL ====================
    if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
    }
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SAÚDE GERAL', margin, yPosition);
    yPosition += 10;
    
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    doc.setTextColor(...textColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const healthInfo = [
        `Tratamento médico: ${formData.tratamentoMedico === 'Sim' ? `Sim (${formData.tratamentoMedicoQual})` : formData.tratamentoMedico}`,
        `Medicação regular: ${formData.tomaMedicacao === 'Sim' ? `Sim (${formData.tomaMedicacaoQual})` : formData.tomaMedicacao}`,
        `Cirurgias anteriores: ${formData.submeteuCirurgia === 'Sim' ? `Sim (${formData.submeteuCirurgiaQual})` : formData.submeteuCirurgia}`,
        `Anestesia odontológica: ${formData.anestesiaOdontologica}`,
        `Alergia a medicamentos: ${formData.alergiaMedicacao === 'Sim' ? `Sim (${formData.alergiaMedicacaoQual})` : formData.alergiaMedicacao}`,
        `Alergia a alimentos: ${formData.alergiaAlimento === 'Sim' ? `Sim (${formData.alergiaAlimentoQual})` : formData.alergiaAlimento}`,
        `Alteração cardiológica: ${formData.alteracaoCardiologica === 'Sim' ? `Sim (${formData.alteracaoCardiologicaQual})` : formData.alteracaoCardiologica}`,
        `Diabético: ${formData.diabetico}`,
        `Convulsões/Epilepsia: ${formData.convulsoesEpilepsia}`,
        `Disfunção renal: ${formData.disfuncaoRenal}`,
        `Problema de coagulação: ${formData.problemaCoagulacao}`,
        `Grávida/Lactante: ${formData.gravidaLactante}`,
        `Problema hormonal: ${formData.problemaHormonal === 'Sim' ? `Sim (${formData.problemaHormonalQual})` : formData.problemaHormonal}`,
        `Alergia a cosméticos: ${formData.alergiaCosmeticos === 'Sim' ? `Sim (${formData.alergiaCosmeticosQual})` : formData.alergiaCosmeticos}`
    ];
    
    healthInfo.forEach(info => {
        if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
        doc.text(info, margin, yPosition);
        yPosition += 7;
    });
    
    yPosition += 5;
    
    // ==================== HÁBITOS DE HIGIENE ====================
    if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
    }
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HÁBITOS DE HIGIENE BUCAL', margin, yPosition);
    yPosition += 10;
    
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    doc.setTextColor(...textColor);
    doc.setFontSize(11);
    
    const hygieneInfo = [
        `Frequência de escovação: ${formData.frequenciaEscovacao}`,
        `Uso de fio dental: ${formData.usoFioDental}`,
        `Creme dental: ${formData.cremeDental}`,
        `Escova a língua: ${formData.escovaLingua}`,
        `Marca da escova: ${formData.marcaEscova}`,
        `Morde objetos: ${formData.mordeObjetos}`,
        `Range os dentes: ${formData.rangeDentes}`,
        `Rói as unhas: ${formData.roiUnhas}`
    ];
    
    hygieneInfo.forEach(info => {
        if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
        doc.text(info, margin, yPosition);
        yPosition += 7;
    });
    
    yPosition += 10;
    
    // ==================== DECLARAÇÃO E ASSINATURA ====================
    if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
    }
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO E ASSINATURA', margin, yPosition);
    yPosition += 10;
    
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Declaração de veracidade
    doc.setTextColor(...textColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const declaration = "Declaro, sob as penas da lei, que todas as informações fornecidas neste formulário são verdadeiras e estou ciente que informações falsas podem acarretar em prejuízos ao meu tratamento.";
    const splitDeclaration = doc.splitTextToSize(declaration, pageWidth - 2 * margin);
    doc.text(splitDeclaration, margin, yPosition);
    yPosition += splitDeclaration.length * 7 + 5;
    
    doc.text(`Confirmado: ${formData.confirmVeracity ? 'SIM' : 'NÃO'}`, margin, yPosition);
    yPosition += 10;
    
    // Assinatura
    if (formData.signatureData) {
        try {
            const signatureImg = new Image();
            signatureImg.src = formData.signatureData;
            
            // Adiciona a imagem da assinatura
            doc.addImage(signatureImg, 'PNG', margin, yPosition, 80, 30);
            yPosition += 40;
        } catch (error) {
            console.error('Erro ao adicionar assinatura:', error);
            doc.text('Assinatura não pôde ser carregada', margin, yPosition);
            yPosition += 10;
        }
    } else {
        doc.text('Assinatura não fornecida', margin, yPosition);
        yPosition += 10;
    }
    
    // Data e local
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    yPosition += 7;
    doc.text('Local: Formulário Online', margin, yPosition);
    
    // ==================== RODAPÉ ====================
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Número da página
        doc.setFontSize(10);
        doc.setTextColor(...lightColor);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Informações da clínica
        doc.text('Dra. Jaqueline Nobre Moratore | 11 98470-8439 | @dentista.jaque', pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
    
    // ==================== SALVAR PDF ====================
    // Gera nome do arquivo
    const fileName = generateFileName();
    
    // Salva o PDF
    doc.save(fileName);
}

/**
 * Gera o nome do arquivo PDF
 */
function generateFileName() {
    const cleanName = formData.nomeCompleto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .toLowerCase();
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    return `${cleanName || 'anamnese'}_${dateStr}.pdf`;
}

// ====================================
// FECHAMENTO DO MODAL E RESET
// ====================================

/**
 * Lida com o fechamento do modal
 */
function handleCloseModal() {
    if (!confirmationModal) return;
    
    // Fecha o modal
    confirmationModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reseta o formulário
    resetForm();
    
    console.log('🔄 Formulário resetado');
}

/**
 * Reseta todo o formulário
 */
function resetForm() {
    // Reseta o formulário HTML
    form.reset();
    
    // Reseta a assinatura
    if (signaturePad) {
        signaturePad.clear();
    }
    isSignatureSaved = false;
    signatureStatus.textContent = 'Aguardando assinatura';
    signatureStatus.className = 'signature-status pending';
    signatureError.style.display = 'none';
    
    // Reseta a veracidade
    if (confirmVeracityCheckbox) {
        confirmVeracityCheckbox.checked = false;
    }
    formData.confirmVeracity = false;
    veracityError.style.display = 'none';
    
    // Reseta os dados
    formData = {
        ...formData,
        // Mantém apenas as informações da clínica
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
    
    // Volta para a primeira seção
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('section1').classList.add('active');
    
    // Reseta a barra de progresso
    steps.forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        step.classList.toggle('active', stepNum === 1);
    });
    updateProgressBar();
    
    // Reseta o botão de envio
    updateSubmitButtonState();
    
    // Limpa o resumo
    if (summaryContent) {
        summaryContent.innerHTML = '';
    }
    
    // Reseta a data padrão
    setDefaultDate();
    
    // Rola para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

/**
 * Mostra uma mensagem de erro
 */
function showError(message) {
    console.error('❌ Erro:', message);
    
    // Cria elemento de erro se não existir
    let errorElement = document.getElementById('global-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'global-error';
        errorElement.className = 'global-error error-message';
        errorElement.style.position = 'fixed';
        errorElement.style.top = '20px';
        errorElement.style.right = '20px';
        errorElement.style.zIndex = '9999';
        errorElement.style.padding = '15px 20px';
        errorElement.style.backgroundColor = 'white';
        errorElement.style.border = '2px solid #f44336';
        errorElement.style.borderRadius = '8px';
        errorElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        errorElement.style.maxWidth = '400px';
        document.body.appendChild(errorElement);
    }
    
    // Atualiza a mensagem
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.style.display = 'block';
    
    // Remove após 5 segundos
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

/**
 * Mostra uma mensagem de sucesso
 */
function showSuccess(message) {
    console.log('✅ Sucesso:', message);
    
    // Similar ao showError, mas com cor verde
    let successElement = document.getElementById('global-success');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'global-success';
        successElement.className = 'global-success';
        successElement.style.position = 'fixed';
        successElement.style.top = '20px';
        successElement.style.right = '20px';
        successElement.style.zIndex = '9999';
        successElement.style.padding = '15px 20px';
        successElement.style.backgroundColor = 'white';
        successElement.style.border = '2px solid #4caf50';
        successElement.style.borderRadius = '8px';
        successElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        successElement.style.maxWidth = '400px';
        document.body.appendChild(successElement);
    }
    
    successElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successElement.style.display = 'block';
    
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

// ====================================
// INICIALIZAÇÃO FINAL
// ====================================

/**
 * Inicializa o aplicativo quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Função de debug para testes (remover em produção)
 */
window.debugForm = function() {
    console.log('=== DEBUG DO FORMULÁRIO ===');
    console.log('FormData:', formData);
    console.log('Assinatura salva:', isSignatureSaved);
    console.log('Veracidade confirmada:', formData.confirmVeracity);
    console.log('SignaturePad:', signaturePad ? 'Inicializado' : 'Não inicializado');
    console.log('Canvas:', signatureCanvas ? 'Encontrado' : 'Não encontrado');
    console.log('Modal:', confirmationModal ? 'Encontrado' : 'Não encontrado');
    
    // Testa a assinatura
    if (signaturePad) {
        // Desenha uma assinatura de teste
        signaturePad.fromData([
            {
                color: 'rgb(231, 84, 128)',
                points: [
                    { x: 50, y: 50, time: Date.now(), pressure: 0.5 },
                    { x: 100, y: 100, time: Date.now() + 100, pressure: 0.5 },
                    { x: 150, y: 50, time: Date.now() + 200, pressure: 0.5 }
                ]
            }
        ]);
        console.log('Assinatura de teste desenhada');
    }
    
    // Preenche alguns dados de teste
    document.getElementById('nomeCompleto').value = 'Maria da Silva Santos';
    document.getElementById('email').value = 'teste@exemplo.com';
    document.getElementById('telefone').value = '(11) 99999-9999';
    
    console.log('Dados de teste preenchidos');
};

/**
 * Função para testar o envio
 */
window.testSubmit = function() {
    console.log('=== TESTE DE ENVIO ===');
    
    // Simula o preenchimento completo
    formData.nomeCompleto = 'João da Silva Teste';
    formData.email = 'teste@exemplo.com';
    formData.confirmVeracity = true;
    isSignatureSaved = true;
    
    // Atualiza o botão
    updateSubmitButtonState();
    
    console.log('Pronto para teste de envio!');
};
