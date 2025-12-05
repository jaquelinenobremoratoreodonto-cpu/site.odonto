/**
 * SCRIPT PRINCIPAL DO PORTAL DE ANAMNESE
 * Dra. Jaqueline Nobre Moratore
 * 
 * VERSÃO CORRIGIDA - Sem download automático, sem duplicação
 */

// Configurações globais
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwNup39Bew5-5PR3-Wud7s2u6ZSvNOswg11yhepzRfei01GlC1ybdvTR4LT7SQ8ZZIw/exec',
    PDF_OPTIONS: {
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    }
};

// Estado da aplicação
const AppState = {
    currentSection: 1,
    totalSections: 4,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    signaturePaths: [],
    currentPath: [],
    signatureCtx: null,
    formData: {},
    lastPdfBlob: null,
    lastFileName: '',
    validationErrors: {},
    isSubmitting: false // Flag para evitar envio duplo
};

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    console.log('Inicializando aplicação...');
    
    setupInputMasks();
    setupSectionNavigation();
    setupConditionalFields();
    setupSignaturePad();
    setupFormSubmission();
    setupModal();
    updateConfirmationName();
    setupRealTimeValidation();
    setupFormDate();
    
    console.log('Aplicação inicializada com sucesso!');
}

/**
 * Configura máscaras para campos de telefone e CPF
 */
function setupInputMasks() {
    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 11) value = value.substring(0, 11);
            
            if (value.length <= 10) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else {
                value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
            
            e.target.value = value;
        });
    }

    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 11) value = value.substring(0, 11);
            
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
            
            e.target.value = value;
        });
    }
}

/**
 * Configura a navegação entre seções do formulário
 */
function setupSectionNavigation() {
    // Botões "Próximo"
    document.querySelectorAll('.btn-next').forEach(button => {
        button.addEventListener('click', function() {
            const nextSection = parseInt(this.getAttribute('data-next'));
            navigateToSection(nextSection);
        });
    });
    
    // Botões "Anterior"
    document.querySelectorAll('.btn-prev').forEach(button => {
        button.addEventListener('click', function() {
            const prevSection = parseInt(this.getAttribute('data-prev'));
            navigateToSection(prevSection);
        });
    });
    
    // Atualizar progresso quando mudar de seção
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const section = parseInt(this.getAttribute('data-step'));
            navigateToSection(section);
        });
    });
}

/**
 * Navega para uma seção específica
 */
function navigateToSection(sectionNumber) {
    console.log(`Navegando para seção ${sectionNumber}...`);
    
    // Se estamos tentando avançar, validar a seção atual
    if (sectionNumber > AppState.currentSection) {
        if (!validateCurrentSection(true)) {
            console.log('Validação falhou, não navegando.');
            return;
        }
    }
    
    // Atualizar estado
    AppState.currentSection = sectionNumber;
    
    // Atualizar visual da seção ativa
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section${sectionNumber}`);
    if (targetSection) targetSection.classList.add('active');
    
    // Atualizar barra de progresso
    updateProgressBar(sectionNumber);
    
    // Atualizar passos ativos
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    const targetStep = document.querySelector(`.step[data-step="${sectionNumber}"]`);
    if (targetStep) targetStep.classList.add('active');
    
    // Se estamos indo para a seção 4, preencher o resumo
    if (sectionNumber === 4) fillReviewSummary();
    
    // Rolar para o topo da seção
    window.scrollTo({
        top: document.querySelector('.form-container').offsetTop - 20,
        behavior: 'smooth'
    });
}

/**
 * Valida os campos da seção atual
 */
function validateCurrentSection(showNotification = false) {
    const currentSection = document.getElementById(`section${AppState.currentSection}`);
    if (!currentSection) return false;
    
    const requiredInputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
    const requiredRadios = currentSection.querySelectorAll('.radio-group[required]');
    
    let isValid = true;
    const errors = [];
    
    // Validar inputs obrigatórios
    requiredInputs.forEach(input => {
        const isEmpty = !input.value.trim();
        const isCheckbox = input.type === 'checkbox';
        
        if (isCheckbox) {
            if (!input.checked) {
                isValid = false;
                errors.push(`O campo "${input.name}" deve ser marcado`);
                highlightInvalidField(input.parentNode);
            } else {
                removeHighlightInvalidField(input.parentNode);
            }
        } else if (isEmpty) {
            isValid = false;
            const fieldName = input.previousElementSibling ? input.previousElementSibling.textContent.replace('*', '').trim() : 'Este campo';
            errors.push(`O campo "${fieldName}" é obrigatório`);
            highlightInvalidField(input);
        } else {
            removeHighlightInvalidField(input);
            
            // Validações específicas
            if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
                isValid = false;
                errors.push('Email inválido');
                highlightInvalidField(input, 'Email inválido');
            }
            
            if (input.id === 'telefone' && input.value && !isValidPhone(input.value)) {
                isValid = false;
                errors.push('Telefone inválido');
                highlightInvalidField(input, 'Telefone inválido');
            }
            
            if (input.id === 'cpf' && input.value && !isValidCPF(input.value)) {
                isValid = false;
                errors.push('CPF inválido');
                highlightInvalidField(input, 'CPF inválido');
            }
        }
    });
    
    // Validar grupos de radio obrigatórios
    requiredRadios.forEach(radioGroup => {
        const radioName = radioGroup.querySelector('input[type="radio"]').name;
        const checkedRadio = currentSection.querySelector(`input[name="${radioName}"]:checked`);
        
        if (!checkedRadio) {
            isValid = false;
            const label = radioGroup.querySelector('label');
            const fieldName = label ? label.textContent.replace('*', '').trim() : 'Este campo';
            errors.push(`O campo "${fieldName}" é obrigatório`);
            highlightInvalidField(radioGroup);
        } else {
            removeHighlightInvalidField(radioGroup);
        }
    });
    
    // Validação específica para a seção 4
    if (AppState.currentSection === 4) {
        // Verificar assinatura
        const signatureCanvas = document.getElementById('signatureCanvas');
        if (signatureCanvas && AppState.signaturePaths.length === 0) {
            const ctx = signatureCanvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
            let isEmpty = true;
            
            for (let i = 0; i < imageData.data.length; i += 4) {
                if (imageData.data[i] !== 255 || imageData.data[i+1] !== 255 || imageData.data[i+2] !== 255) {
                    isEmpty = false;
                    break;
                }
            }
            
            if (isEmpty) {
                isValid = false;
                errors.push('A assinatura digital é obrigatória');
            }
        }
        
        // Verificar checkboxes
        const confirmacao = document.getElementById('confirmacaoIdentidade');
        const lgpdConsentimento = document.getElementById('lgpdConsentimento');
        
        if (confirmacao && !confirmacao.checked) {
            isValid = false;
            errors.push('Confirmação de identidade é obrigatória');
            highlightInvalidField(confirmacao.parentNode);
        } else if (confirmacao) removeHighlightInvalidField(confirmacao.parentNode);
        
        if (lgpdConsentimento && !lgpdConsentimento.checked) {
            isValid = false;
            errors.push('Consentimento LGPD é obrigatório');
            highlightInvalidField(lgpdConsentimento.parentNode);
        } else if (lgpdConsentimento) removeHighlightInvalidField(lgpdConsentimento.parentNode);
    }
    
    // Mostrar notificação se houver erros
    if (!isValid && showNotification && errors.length > 0) {
        const errorMessage = errors.length === 1 ? errors[0] : 'Por favor, corrija os erros destacados no formulário';
        showNotification(errorMessage, 'error');
    }
    
    AppState.validationErrors[AppState.currentSection] = errors;
    return isValid;
}

/**
 * Destaca um campo inválido
 */
function highlightInvalidField(element, message = 'Campo obrigatório') {
    element.classList.add('error');
    
    // Remover mensagem de erro existente
    const existingError = element.parentNode.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    // Adicionar mensagem de erro se for um input, select ou textarea
    if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: var(--error-color);
            font-size: 0.85rem;
            margin-top: 5px;
        `;
        
        element.parentNode.appendChild(errorElement);
    }
}

/**
 * Remove destaque de campo inválido
 */
function removeHighlightInvalidField(element) {
    element.classList.remove('error');
    
    const errorElement = element.parentNode.querySelector('.error-message');
    if (errorElement) errorElement.remove();
}

/**
 * Configura campos condicionais
 */
function setupConditionalFields() {
    document.querySelectorAll('input[type="radio"][data-toggle]').forEach(radio => {
        radio.addEventListener('change', function() {
            const targetId = this.getAttribute('data-toggle');
            const targetElement = document.getElementById(targetId);
            
            if (this.value === 'Sim' && targetElement) {
                targetElement.classList.remove('hidden');
                // Adicionar required aos campos dentro do elemento condicional
                const inputs = targetElement.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (!input.hasAttribute('data-optional')) input.required = true;
                });
            } else if (targetElement) {
                targetElement.classList.add('hidden');
                // Remover required e limpar valor
                const inputs = targetElement.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.required = false;
                    input.value = '';
                });
            }
        });
        
        // Disparar evento change para configurar estado inicial
        if (radio.checked) radio.dispatchEvent(new Event('change'));
    });
}

/**
 * Configura a área de assinatura digital
 */
function setupSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) {
        console.error('Canvas de assinatura não encontrado!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    AppState.signatureCtx = ctx;
    
    // Configurar estilo do canvas
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#333333';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Função para começar a desenhar
    function startDrawing(e) {
        e.preventDefault();
        AppState.isDrawing = true;
        const coords = getCoordinates(e);
        [AppState.lastX, AppState.lastY] = coords;
        AppState.currentPath = [{x: AppState.lastX, y: AppState.lastY}];
    }
    
    // Função para desenhar
    function draw(e) {
        if (!AppState.isDrawing) return;
        e.preventDefault();
        
        const [x, y] = getCoordinates(e);
        
        // Desenhar linha
        ctx.beginPath();
        ctx.moveTo(AppState.lastX, AppState.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Atualizar coordenadas
        [AppState.lastX, AppState.lastY] = [x, y];
        
        // Salvar ponto no caminho atual
        AppState.currentPath.push({x, y});
    }
    
    // Função para parar de desenhar
    function stopDrawing() {
        if (!AppState.isDrawing) return;
        AppState.isDrawing = false;
        
        // Salvar caminho se tiver pontos
        if (AppState.currentPath.length > 1) {
            AppState.signaturePaths.push([...AppState.currentPath]);
        }
        AppState.currentPath = [];
    }
    
    // Obter coordenadas do evento (mouse ou touch)
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        
        if (e.type.includes('touch')) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return [
            (clientX - rect.left) * scaleX,
            (clientY - rect.top) * scaleY
        ];
    }
    
    // Event listeners para mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Event listeners para touch
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Botão para limpar assinatura
    const clearBtn = document.getElementById('clearSignature');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            AppState.signaturePaths = [];
            AppState.currentPath = [];
        });
    }
    
    // Botão para desfazer último traço
    const undoBtn = document.getElementById('undoSignature');
    if (undoBtn) {
        undoBtn.addEventListener('click', function() {
            if (AppState.signaturePaths.length > 0) {
                AppState.signaturePaths.pop();
                
                // Limpar canvas e redesenhar todos os caminhos
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.beginPath();
                AppState.signaturePaths.forEach(path => {
                    if (path.length > 0) {
                        ctx.moveTo(path[0].x, path[0].y);
                        for (let i = 1; i < path.length; i++) {
                            ctx.lineTo(path[i].x, path[i].y);
                        }
                    }
                });
                ctx.stroke();
            }
        });
    }
}

/**
 * Preenche o resumo das informações na seção 4
 */
function fillReviewSummary() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;
    
    const form = document.getElementById('anamneseForm');
    const formData = new FormData(form);
    const data = {};
    
    // Converter FormData para objeto
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Salvar dados no estado
    AppState.formData = data;
    
    let html = '';
    
    // Dados Pessoais
    html += '<div class="review-item">';
    html += '<h4><i class="fas fa-user"></i> Dados Pessoais</h4>';
    html += `<p><strong>Nome Completo:</strong> ${data.nomeCompleto || 'Não informado'}</p>`;
    html += `<p><strong>Data de Nascimento:</strong> ${formatDate(data.dataNascimento) || 'Não informado'}</p>`;
    html += `<p><strong>Gênero:</strong> ${data.genero || 'Não informado'}</p>`;
    html += `<p><strong>Telefone:</strong> ${data.telefone || 'Não informado'}</p>`;
    html += `<p><strong>Email:</strong> ${data.email || 'Não informado'}</p>`;
    html += `<p><strong>Endereço:</strong> ${data.endereco || 'Não informado'}</p>`;
    html += `<p><strong>Profissão:</strong> ${data.profissao || 'Não informado'}</p>`;
    html += `<p><strong>RG:</strong> ${data.rg || 'Não informado'}</p>`;
    html += `<p><strong>CPF:</strong> ${data.cpf || 'Não informado'}</p>`;
    html += `<p><strong>Autoriza uso de imagem:</strong> ${data.autorizaImagem || 'Não informado'}</p>`;
    html += `<p><strong>Preferência musical:</strong> ${data.preferenciaMusica === 'Sim' ? data.preferenciaMusicaQual || 'Sim' : 'Não'}</p>`;
    html += '</div>';
    
    // Saúde Geral
    html += '<div class="review-item">';
    html += '<h4><i class="fas fa-heartbeat"></i> Saúde Geral</h4>';
    html += `<p><strong>Tratamento médico atual:</strong> ${data.tratamentoMedico === 'Sim' ? data.tratamentoQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Medicação regular:</strong> ${data.tomaMedicacao === 'Sim' ? data.medicacaoQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Cirurgias anteriores:</strong> ${data.cirurgia === 'Sim' ? data.cirurgiaQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Anestesia odontológica:</strong> ${data.anestesiaOdontologica === 'Sim' ? data.anestesiaReacao || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Alergia a medicamentos:</strong> ${data.alergiaMedicamento === 'Sim' ? data.alergiaMedicamentoQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Alergia a alimentos:</strong> ${data.alergiaAlimento === 'Sim' ? data.alergiaAlimentoQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Problemas cardíacos:</strong> ${data.alteracaoCardiologica === 'Sim' ? data.alteracaoCardiologicaQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Diabético:</strong> ${data.diabetico || 'Não informado'}</p>`;
    html += `<p><strong>Convulsões/Epilepsia:</strong> ${data.convulsoes || 'Não informado'}</p>`;
    html += `<p><strong>Problemas renais:</strong> ${data.disfuncaoRenal === 'Sim' ? data.disfuncaoRenalQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Problemas de coagulação:</strong> ${data.coagulacao || 'Não informado'}</p>`;
    html += `<p><strong>Grávida/Lactante:</strong> ${data.gravidaLactante || 'Não informado'}</p>`;
    html += `<p><strong>Problemas hormonais:</strong> ${data.problemaHormonal === 'Sim' ? data.problemaHormonalQual || 'Sim' : 'Não'}</p>`;
    html += `<p><strong>Alergia a cosméticos:</strong> ${data.alergiaCosmeticos === 'Sim' ? data.alergiaCosmeticosQual || 'Sim' : 'Não'}</p>`;
    html += '</div>';
    
    // Saúde Bucal
    html += '<div class="review-item">';
    html += '<h4><i class="fas fa-tooth"></i> Saúde Bucal</h4>';
    html += `<p><strong>Frequência de escovação:</strong> ${data.frequenciaEscovacao || 'Não informado'}</p>`;
    html += `<p><strong>Uso de fio dental:</strong> ${data.usoFioDental || 'Não informado'}</p>`;
    html += `<p><strong>Creme dental usado:</strong> ${data.cremeDental || 'Não informado'}</p>`;
    html += `<p><strong>Escova a língua:</strong> ${data.escovaLingua || 'Não informado'}</p>`;
    html += `<p><strong>Marca da escova:</strong> ${data.marcaEscova || 'Não informado'}</p>`;
    html += `<p><strong>Morde objetos:</strong> ${data.mordeObjetos || 'Não informado'}</p>`;
    html += `<p><strong>Range os dentes:</strong> ${data.rangeDentes || 'Não informado'}</p>`;
    html += `<p><strong>Rói as unhas:</strong> ${data.roiUnhas || 'Não informado'}</p>`;
    html += '</div>';
    
    reviewContent.innerHTML = html;
    updateConfirmationName();
}

/**
 * Atualiza o nome na confirmação de identidade
 */
function updateConfirmationName() {
    const nomeCompleto = document.getElementById('nomeCompleto');
    const nomeConfirma = document.getElementById('nomeConfirma');
    
    if (nomeCompleto && nomeConfirma) {
        nomeCompleto.addEventListener('input', function() {
            nomeConfirma.textContent = this.value || '[seu nome]';
        });
        nomeConfirma.textContent = nomeCompleto.value || '[seu nome]';
    }
}

/**
 * Configura a data de preenchimento
 */
function setupFormDate() {
    const dataPreenchimento = document.getElementById('dataPreenchimento');
    if (dataPreenchimento) {
        const now = new Date();
        dataPreenchimento.textContent = now.toLocaleDateString('pt-BR') + ' às ' + 
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}

/**
 * Configura o envio do formulário
 */
function setupFormSubmission() {
    const form = document.getElementById('anamneseForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Evitar envio duplo
        if (AppState.isSubmitting) {
            showNotification('Aguarde, seu formulário está sendo enviado...', 'warning');
            return;
        }
        
        console.log('Iniciando envio do formulário...');
        
        // Validar todas as seções antes de enviar
        let allValid = true;
        for (let i = 1; i <= AppState.totalSections; i++) {
            AppState.currentSection = i;
            if (!validateCurrentSection(i === AppState.totalSections)) {
                allValid = false;
                navigateToSection(i);
                break;
            }
        }
        
        if (!allValid) {
            showNotification('Por favor, corrija todos os erros antes de enviar o formulário.', 'error');
            return;
        }
        
        // Verificar assinatura
        if (AppState.signaturePaths.length === 0) {
            showNotification('Por favor, forneça sua assinatura digital.', 'warning');
            navigateToSection(4);
            return;
        }
        
        // Verificar checkboxes
        const confirmacao = document.getElementById('confirmacaoIdentidade');
        const lgpdConsentimento = document.getElementById('lgpdConsentimento');
        
        if (!confirmacao.checked || !lgpdConsentimento.checked) {
            showNotification('Por favor, marque todas as confirmações antes de enviar.', 'warning');
            navigateToSection(4);
            return;
        }
        
        // Marcar como enviando
        AppState.isSubmitting = true;
        
        // Mostrar carregamento
        const submitBtn = document.getElementById('submitForm');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;
        
        try {
            // Coletar dados do formulário
            const formData = collectFormData();
            
            // Gerar PDF
            console.log('Gerando PDF...');
            const pdfBlob = await generatePDF(formData);
            
            // Enviar para Google Apps Script
            console.log('Enviando para Google Apps Script...');
            const response = await sendToGoogleScript(formData, pdfBlob);
            
            if (response.success) {
                console.log('Formulário enviado com sucesso!');
                
                // Salvar PDF localmente no estado para download posterior
                AppState.lastPdfBlob = pdfBlob;
                AppState.lastFileName = response.fileName || generateFileName(formData);
                
                // Mostrar modal de sucesso
                showSuccessModal(formData.email);
                
                // Não fazer download automático - removido completamente
                
            } else {
                throw new Error(response.message || 'Erro ao enviar formulário');
            }
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            showNotification(`Erro ao enviar: ${error.message}. Tente novamente.`, 'error');
            
            // Reativar envio em caso de erro
            AppState.isSubmitting = false;
        } finally {
            // Restaurar botão (exceto se tivermos sucesso e modal aberto)
            const modal = document.getElementById('successModal');
            if (!modal || modal.style.display !== 'flex') {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                AppState.isSubmitting = false;
            }
        }
    });
    
    // Botão de editar informações
    const editBtn = document.getElementById('editForm');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            navigateToSection(1);
        });
    }
}

/**
 * Coleta todos os dados do formulário
 */
function collectFormData() {
    const form = document.getElementById('anamneseForm');
    const formData = new FormData(form);
    const data = {};
    
    // Converter FormData para objeto
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Adicionar data de preenchimento
    data.dataPreenchimento = new Date().toISOString();
    
    // Adicionar assinatura (como data URL)
    const signatureCanvas = document.getElementById('signatureCanvas');
    if (signatureCanvas) {
        data.assinatura = signatureCanvas.toDataURL('image/png');
    }
    
    console.log('Dados coletados:', Object.keys(data).length, 'campos');
    return data;
}

/**
 * Gera PDF com os dados do formulário
 */
async function generatePDF(formData) {
    return new Promise((resolve, reject) => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF(CONFIG.PDF_OPTIONS);
            
            const margin = 20;
            let yPos = margin;
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            
            // Adicionar cabeçalho
            doc.setFillColor(240, 98, 146);
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('FORMULÁRIO DE ANAMNESE', pageWidth / 2, 20, { align: 'center' });
            
            doc.setFontSize(14);
            doc.text('Dra. Jaqueline Nobre Moratore', pageWidth / 2, 30, { align: 'center' });
            doc.text('Odontologia & Saúde Bucal', pageWidth / 2, 37, { align: 'center' });
            
            // Voltar ao texto preto
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            yPos = 50;
            
            // Adicionar dados pessoais
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DADOS PESSOAIS', margin, yPos);
            yPos += lineHeight * 1.5;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            const personalFields = [
                `Nome: ${formData.nomeCompleto || ''}`,
                `Data de Nascimento: ${formatDate(formData.dataNascimento) || ''}`,
                `Gênero: ${formData.genero || ''}`,
                `Telefone: ${formData.telefone || ''}`,
                `Email: ${formData.email || ''}`,
                `Endereço: ${formData.endereco || ''}`,
                `Profissão: ${formData.profissao || ''}`,
                `RG: ${formData.rg || ''}`,
                `CPF: ${formData.cpf || ''}`,
                `Autoriza uso de imagem: ${formData.autorizaImagem || ''}`,
                `Preferência musical: ${formData.preferenciaMusica === 'Sim' ? formData.preferenciaMusicaQual || 'Sim' : 'Não'}`
            ];
            
            personalFields.forEach(field => {
                if (yPos > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(field, margin, yPos);
                yPos += lineHeight;
            });
            
            // Adicionar dados de saúde geral
            yPos += lineHeight;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('SAÚDE GERAL', margin, yPos);
            yPos += lineHeight * 1.5;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            const healthFields = [
                `Tratamento médico: ${formData.tratamentoMedico === 'Sim' ? formData.tratamentoQual || 'Sim' : 'Não'}`,
                `Medicação regular: ${formData.tomaMedicacao === 'Sim' ? formData.medicacaoQual || 'Sim' : 'Não'}`,
                `Cirurgias anteriores: ${formData.cirurgia === 'Sim' ? formData.cirurgiaQual || 'Sim' : 'Não'}`,
                `Anestesia odontológica: ${formData.anestesiaOdontologica === 'Sim' ? formData.anestesiaReacao || 'Sim' : 'Não'}`,
                `Alergia a medicamentos: ${formData.alergiaMedicamento === 'Sim' ? formData.alergiaMedicamentoQual || 'Sim' : 'Não'}`,
                `Alergia a alimentos: ${formData.alergiaAlimento === 'Sim' ? formData.alergiaAlimentoQual || 'Sim' : 'Não'}`,
                `Problemas cardíacos: ${formData.alteracaoCardiologica === 'Sim' ? formData.alteracaoCardiologicaQual || 'Sim' : 'Não'}`,
                `Diabético: ${formData.diabetico || ''}`,
                `Convulsões/Epilepsia: ${formData.convulsoes || ''}`,
                `Problemas renais: ${formData.disfuncaoRenal === 'Sim' ? formData.disfuncaoRenalQual || 'Sim' : 'Não'}`,
                `Problemas de coagulação: ${formData.coagulacao || ''}`,
                `Grávida/Lactante: ${formData.gravidaLactante || ''}`,
                `Problemas hormonais: ${formData.problemaHormonal === 'Sim' ? formData.problemaHormonalQual || 'Sim' : 'Não'}`,
                `Alergia a cosméticos: ${formData.alergiaCosmeticos === 'Sim' ? formData.alergiaCosmeticosQual || 'Sim' : 'Não'}`
            ];
            
            healthFields.forEach(field => {
                if (yPos > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(field, margin, yPos);
                yPos += lineHeight;
            });
            
            // Adicionar dados de saúde bucal
            yPos += lineHeight;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('SAÚDE BUCAL', margin, yPos);
            yPos += lineHeight * 1.5;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            const dentalFields = [
                `Frequência de escovação: ${formData.frequenciaEscovacao || ''}`,
                `Uso de fio dental: ${formData.usoFioDental || ''}`,
                `Creme dental usado: ${formData.cremeDental || ''}`,
                `Escova a língua: ${formData.escovaLingua || ''}`,
                `Marca da escova: ${formData.marcaEscova || ''}`,
                `Morde objetos: ${formData.mordeObjetos || ''}`,
                `Range os dentes: ${formData.rangeDentes || ''}`,
                `Rói as unhas: ${formData.roiUnhas || ''}`
            ];
            
            dentalFields.forEach(field => {
                if (yPos > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(field, margin, yPos);
                yPos += lineHeight;
            });
            
            // Adicionar data de preenchimento
            yPos += lineHeight * 2;
            if (yPos > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(`Data de preenchimento: ${formatDate(formData.dataPreenchimento)}`, margin, yPos);
            yPos += lineHeight;
            
            // Adicionar consentimentos
            doc.text(`Confirmação de identidade: ASSINADO DIGITALMENTE`, margin, yPos);
            yPos += lineHeight;
            doc.text(`Consentimento LGPD: CONFIRMADO`, margin, yPos);
            
            // Adicionar assinatura (se houver)
            if (formData.assinatura) {
                yPos += lineHeight * 2;
                if (yPos > pageHeight - 60) {
                    doc.addPage();
                    yPos = margin;
                }
                
                doc.text('Assinatura Digital:', margin, yPos);
                yPos += lineHeight;
                
                try {
                    // Adicionar imagem da assinatura
                    const signatureImg = new Image();
                    signatureImg.src = formData.assinatura;
                    
                    // Adicionar assinatura ao PDF
                    doc.addImage(signatureImg, 'PNG', margin, yPos, 80, 30);
                    yPos += 35;
                    doc.text('Assinatura do Paciente', margin, yPos);
                } catch (error) {
                    console.error('Erro ao adicionar assinatura ao PDF:', error);
                    doc.text('Assinatura digital incluída no documento', margin, yPos);
                }
            }
            
            // Gerar blob do PDF
            const pdfBlob = doc.output('blob');
            resolve(pdfBlob);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            reject(error);
        }
    });
}

/**
 * Gera nome do arquivo PDF
 */
function generateFileName(formData) {
    const nome = (formData.nomeCompleto || 'anonimo')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const rg = (formData.rg || 'semrg').replace(/\D/g, '');
    const data = new Date().toISOString().split('T')[0];
    return `${nome}.${rg}.${data}.pdf`;
}

/**
 * Salva PDF localmente (apenas quando solicitado pelo botão)
 */
function savePDFLocally(pdfBlob, fileName) {
    // Criar link de download
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Simular clique para download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log('PDF salvo localmente:', fileName);
}

/**
 * Envia dados para o Google Apps Script
 */
async function sendToGoogleScript(formData, pdfBlob) {
    const fileName = generateFileName(formData);
    
    // Em produção, substitua pelo código real:
    // return fetch(CONFIG.GOOGLE_SCRIPT_URL, {...});
    
    // Para desenvolvimento, simular sucesso
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Simulando envio para Google Apps Script...');
            console.log('Arquivo:', fileName);
            console.log('Email:', formData.email);
            
            resolve({
                success: true,
                fileName: fileName,
                message: 'Formulário enviado com sucesso (simulação)'
            });
        }, 1500);
    });
}

/**
 * Configura o modal de confirmação
 */
function setupModal() {
    const modal = document.getElementById('successModal');
    const closeBtns = document.querySelectorAll('#closeModal, #closeModalBtn');
    const downloadBtn = document.getElementById('downloadPdf');
    
    // Fechar modal
    closeBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                modal.style.display = 'none';
                
                // Reativar botão de envio após fechar modal
                const submitBtn = document.getElementById('submitForm');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Formulário';
                }
                
                // Resetar flag de envio
                AppState.isSubmitting = false;
            });
        }
    });
    
    // Fechar ao clicar fora do modal
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            
            // Reativar botão de envio após fechar modal
            const submitBtn = document.getElementById('submitForm');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Formulário';
            }
            
            // Resetar flag de envio
            AppState.isSubmitting = false;
        }
    });
    
    // Botão de download no modal
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (AppState.lastPdfBlob && AppState.lastFileName) {
                savePDFLocally(AppState.lastPdfBlob, AppState.lastFileName);
                
                // Feedback visual
                const originalHtml = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> PDF Baixado';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalHtml;
                    this.disabled = false;
                }, 3000);
            }
        });
    }
}

/**
 * Mostra o modal de sucesso
 */
function showSuccessModal(email) {
    const modal = document.getElementById('successModal');
    const emailEnviado = document.getElementById('emailEnviado');
    
    if (emailEnviado && email) {
        emailEnviado.textContent = email;
    }
    
    modal.style.display = 'flex';
    
    // Atualizar botão de download
    const downloadBtn = document.getElementById('downloadPdf');
    if (downloadBtn) {
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Baixar PDF';
        downloadBtn.disabled = false;
    }
}

/**
 * Atualiza a barra de progresso
 */
function updateProgressBar(currentSection) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const percentage = ((currentSection - 1) / (AppState.totalSections - 1)) * 100;
        progressBar.style.width = `${percentage}%`;
    }
}

/**
 * Configura validação em tempo real
 */
function setupRealTimeValidation() {
    // Validar campos enquanto o usuário digita
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Validar campos de texto enquanto digita
        if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
            input.addEventListener('input', function() {
                validateField(this);
            });
        }
    });
}

/**
 * Valida um campo individual
 */
function validateField(field) {
    const isEmpty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
    
    if (field.hasAttribute('required')) {
        if (isEmpty) {
            highlightInvalidField(field);
        } else {
            removeHighlightInvalidField(field);
            
            // Validações específicas
            if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
                highlightInvalidField(field, 'Email inválido');
            }
            
            if (field.id === 'telefone' && field.value && !isValidPhone(field.value)) {
                highlightInvalidField(field, 'Telefone inválido');
            }
            
            if (field.id === 'cpf' && field.value && !isValidCPF(field.value)) {
                highlightInvalidField(field, 'CPF inválido');
            }
        }
    }
}

/**
 * Mostra notificação para o usuário
 */
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = 'info-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'success') icon = 'check-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Estilos da notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'error' ? 'var(--error-color)' : 
                   type === 'warning' ? 'var(--warning-color)' : 
                   type === 'success' ? 'var(--success-color)' : 'var(--primary-color)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        zIndex: '1001',
        maxWidth: '400px',
        animation: 'fadeIn 0.3s ease',
        fontSize: '0.95rem'
    });
    
    // Adicionar ao documento
    document.body.appendChild(notification);
    
    // Botão de fechar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Fechar notificação automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Funções auxiliares de validação
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
}

function isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
}

// Inicializar quando a página carregar
window.addEventListener('load', initializeApp);
