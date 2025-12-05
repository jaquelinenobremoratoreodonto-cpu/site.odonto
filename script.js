/**
 * SISTEMA DE ANAMNESE ODONTOLÓGICA - FRONT-END
 * Desenvolvido para Dra. Jaqueline Nobre Moratore
 * Funções principais: Navegação, validação, geração de PDF e comunicação com Google Apps Script
 */

// ============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ============================================

// URL do Google Apps Script (DEVE SER ATUALIZADA APÓS PUBLICAR O SCRIPT)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYcMXZhjIUrAZ1anD9R3IshYRdSZKfsrwX-2mGsBZZdb7w1DTIHzjCyT7NLBI2Uiij/exec";

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
 * Inicializa a área de assinatura digital
 */
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    const clearBtn = document.getElementById('clearSignature');
    
    // Ajusta o canvas para alta resolução
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Inicializa o SignaturePad
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: '#ffffff',
        penColor: '#333333',
        minWidth: 1,
        maxWidth: 3
    });
    
    // Configura o botão de limpar assinatura
    clearBtn.addEventListener('click', function() {
        signaturePad.clear();
    });
    
    // Redimensiona o canvas quando a janela é redimensionada
    window.addEventListener('resize', function() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        signaturePad.clear(); // Limpa a assinatura ao redimensionar
    });
    
    console.log('Área de assinatura inicializada');
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
        if (signaturePad.isEmpty()) {
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
        const pdfData = await generatePdf(formData);
        
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
        showErrorMessage(`Erro: ${error.message}`);
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
    
    // Adiciona a assinatura como base64
    if (!signaturePad.isEmpty()) {
        data.assinatura = signaturePad.toDataURL();
    }
    
    // Adiciona data e hora do preenchimento
    data.dataPreenchimento = new Date().toISOString();
    data.dataPreenchimentoFormatada = new Date().toLocaleString('pt-BR');
    
    console.log('Dados do formulário coletados:', data);
    return data;
}

/**
 * Gera o PDF com os dados do formulário
 * @param {Object} formData - Dados do formulário
 * @returns {Promise<string>} Promise com o PDF em base64
 */
async function generatePdf(formData) {
    return new Promise((resolve, reject) => {
        try {
            // Cria um container temporário para o PDF
            const pdfContainer = document.getElementById('pdfContainer');
            
            // Limpa o container
            pdfContainer.innerHTML = '';
            
            // Cria o conteúdo HTML do PDF
            const pdfHtml = createPdfHtml(formData);
            pdfContainer.innerHTML = pdfHtml;
            
            // Aguarda o carregamento das fontes e imagens
            setTimeout(async () => {
                try {
                    // Gera o PDF usando html2canvas e jsPDF
                    const canvas = await html2canvas(pdfContainer, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                    });
                    
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
                    const imgWidth = 210;
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    
                    // Converte para base64
                    const pdfBase64 = pdf.output('datauristring').split(',')[1];
                    console.log('PDF gerado com sucesso');
                    resolve(pdfBase64);
                } catch (error) {
                    reject(new Error(`Erro ao gerar PDF: ${error.message}`));
                }
            }, 1000);
        } catch (error) {
            reject(new Error(`Erro ao criar PDF: ${error.message}`));
        }
    });
}

/**
 * Cria o HTML para o PDF
 * @param {Object} formData - Dados do formulário
 * @returns {string} HTML para o PDF
 */
function createPdfHtml(formData) {
    // Formata a data de nascimento
    const dataNascimento = formData.dataNascimento ? 
        new Date(formData.dataNascimento).toLocaleDateString('pt-BR') : '';
    
    // Formata as respostas de sim/não para texto completo
    const formatYesNo = (value) => {
        if (value === 'sim') return 'Sim';
        if (value === 'nao') return 'Não';
        if (value === 'nao_aplicavel') return 'Não se aplica';
        if (value === 'as_vezes') return 'Às vezes';
        if (value === 'nao_sei') return 'Não sei';
        return value || 'Não informado';
    };
    
    // Cria o HTML do PDF
    return `
    <div class="pdf-content" style="font-family: 'Poppins', sans-serif; color: #333; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e60073; font-family: 'Playfair Display', serif; margin-bottom: 5px;">
                Dra. Jaqueline Nobre Moratore
            </h1>
            <p style="color: #666; margin-bottom: 20px;">Odontologia Especializada</p>
            <h2 style="color: #333; border-bottom: 2px solid #ffccdc; padding-bottom: 10px;">
                Formulário de Anamnese Odontológica
            </h2>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="color: #e60073; margin-bottom: 15px;">Dados Pessoais</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>Nome Completo:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.nome || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Data de Nascimento:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dataNascimento}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Gênero:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.genero || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Telefone:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.telefone || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>E-mail:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.email || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Endereço:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.endereco || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Profissão:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.profissao || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>RG:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.rg || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>CPF:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.cpf || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Autoriza uso de imagem:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.autorizaImagem)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Preferência musical:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                        ${formData.prefereMusica === 'sim' ? (formData.musicaEspecifica || 'Sim') : formatYesNo(formData.prefereMusica)}
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="color: #e60073; margin-bottom: 15px;">Histórico Médico</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>Tratamento médico atual:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.tratamentoMedico === 'sim' ? (formData.tratamentoEspecifico || 'Sim') : formatYesNo(formData.tratamentoMedico)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Medicações em uso:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.tomaMedicacao === 'sim' ? (formData.medicacaoEspecifica || 'Sim') : formatYesNo(formData.tomaMedicacao)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Cirurgias anteriores:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.cirurgia === 'sim' ? (formData.cirurgiaEspecifica || 'Sim') : formatYesNo(formData.cirurgia)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Anestesia odontológica:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                        ${formData.anestesiaOdontologica === 'sim' ? 
                            (formData.reacaoAnestesia ? 'Sim - ' + formData.reacaoAnestesia : 'Sim') : 
                            formatYesNo(formData.anestesiaOdontologica)}
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="color: #e60073; margin-bottom: 15px;">Alergias</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>Alergia a medicamentos:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.alergiaMedicamento === 'sim' ? (formData.alergiaMedicamentoEspecifica || 'Sim') : formatYesNo(formData.alergiaMedicamento)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Alergia a alimentos:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.alergiaAlimento === 'sim' ? (formData.alergiaAlimentoEspecifica || 'Sim') : formatYesNo(formData.alergiaAlimento)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Alergia a cosméticos:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.alergiaCosmeticos === 'sim' ? (formData.alergiaCosmeticosEspecifica || 'Sim') : formatYesNo(formData.alergiaCosmeticos)}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="color: #e60073; margin-bottom: 15px;">Condições de Saúde</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>Problemas cardíacos:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.alteracaoCardiologica === 'sim' ? (formData.alteracaoCardiologicaEspecifica || 'Sim') : formatYesNo(formData.alteracaoCardiologica)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Diabetes:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.diabetico)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Convulsões/Epilepsia:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.convulsoes)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Problemas renais:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.disfuncaoRenal === 'sim' ? (formData.disfuncaoRenalEspecifica || 'Sim') : formatYesNo(formData.disfuncaoRenal)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Problemas de coagulação:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.coagulacaoSanguinea)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Grávida/Lactante:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.gravidaLactante)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Problemas hormonais:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.problemaHormonal === 'sim' ? (formData.problemaHormonalEspecifico || 'Sim') : formatYesNo(formData.problemaHormonal)}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="color: #e60073; margin-bottom: 15px;">Hábitos de Higiene Bucal</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>Frequência de escovação:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.frequenciaEscovacao || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Uso de fio dental:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.usoFioDental)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Creme dental:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.cremeDental || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Escova a língua:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.escovaLingua)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Marca da escova:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formData.marcaEscova || 'Não informado'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Range os dentes:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.rangeDentes)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Rói as unhas:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.roiUnhas)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Morde objetos:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formatYesNo(formData.mordeObjetos)}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="color: #e60073; margin-bottom: 15px;">Consentimento e Assinatura</h3>
            <div style="background-color: #fff5f9; padding: 20px; border-radius: 10px; border-left: 5px solid #ff4d94;">
                <p style="margin-bottom: 15px; line-height: 1.6;">
                    Eu, <strong>${formData.nome || 'Não informado'}</strong>, RG <strong>${formData.rg || 'Não informado'}</strong>, 
                    declaro, sob as penas da lei, que as informações fornecidas neste formulário de anamnese são verdadeiras 
                    e estou ciente de que informações incorretas podem comprometer a segurança do meu tratamento odontológico.
                </p>
                <p style="margin-bottom: 15px; line-height: 1.6;">
                    Autorizo a Dra. Jaqueline Nobre Moratore a utilizar estas informações para fins de diagnóstico e 
                    planejamento do meu tratamento odontológico, de acordo com a Lei Geral de Proteção de Dados (LGPD) 
                    e normas éticas da profissão odontológica.
                </p>
                <p style="margin-bottom: 20px;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                
                <div style="margin-top: 40px;">
                    <p style="margin-bottom: 10px;"><strong>Assinatura do paciente:</strong></p>
                    ${formData.assinatura ? 
                        `<div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 20px;">
                            <img src="${formData.assinatura}" alt="Assinatura" style="max-width: 300px; max-height: 100px;">
                        </div>` : 
                        '<div style="border-top: 1px solid #333; width: 300px; margin-top: 50px; padding-top: 10px;"></div>'
                    }
                    <p style="margin-top: 10px;">${formData.nome || 'Não informado'}</p>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 50px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
            <p>Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Dra. Jaqueline Nobre Moratore | (11) 98470-8439 | @dentista.jaque</p>
            <p>jaqueline.nobre.moratore.odonto@gmail.com | Rua Avaré 15 - Bairro Matriz Sala 22</p>
        </div>
    </div>
    `;
}

/**
 * Envia dados para o Google Apps Script
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
    
    console.log('Enviando payload para Google Apps Script:', {
        ...formData,
        pdf: '[BASE64_DATA]' // Não logar dados binários
    });
    
    // Envia para o Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    console.log('Resposta do Google Apps Script:', responseData);
    return responseData;
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
                const pdfData = await generatePdf(formData);
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
    signaturePad.clear();
    generatedPdfUrl = null;
    document.getElementById('downloadPdfBtn').style.display = 'none';
    hideAllMessages();
    
    // Reseta as perguntas condicionais
    document.querySelectorAll('.conditional-question').forEach(container => {
        container.classList.remove('active');
    });
    
    console.log('Formulário resetado');
}
