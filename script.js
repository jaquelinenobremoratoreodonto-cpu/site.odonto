/**
 * SISTEMA DE ANAMNESE ODONTOLÓGICA - FRONTEND FUNCIONAL
 * Comunicação garantida com Google Apps Script
 */

// ============================================
// CONFIGURAÇÃO PRINCIPAL
// ============================================

// URL DO GOOGLE APPS SCRIPT - IMPERATIVO: Substitua pela sua URL após implantar
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoQMjVEWmQV_MoqoTZZ6p0Hwb6TTSM1Tt4eC9dTMgYHuE_xJtGkBhRYAEuuC9dyr10/exec";

// Estado global
let currentSection = 1;
const totalSections = 5;
let signaturePad = null;
let lastPdfBlob = null;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de anamnese...');
    
    // Inicializar componentes
    initFormNavigation();
    initConditionalQuestions();
    initSignaturePad();
    initInputMasks();
    setupPdfDownload();
    
    // Atualizar interface
    updateProgressBar();
    updateNavigationButtons();
    
    // Testar conexão ao carregar
    setTimeout(testConnection, 1000);
    
    console.log('Sistema inicializado!');
});

/**
 * Testa a conexão com o Google Apps Script
 */
async function testConnection() {
    console.log('Testando conexão com GAS...');
    
    // Verificar se a URL foi configurada
    if (GOOGLE_SCRIPT_URL.includes('COLE_SUA_URL') || !GOOGLE_SCRIPT_URL.includes('https://')) {
        console.error('URL do GAS não configurada!');
        showErrorMessage('⚠️ Configure a URL do Google Apps Script no código.');
        return;
    }
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'testConnection'})
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Conexão estabelecida:', data.message);
            showSuccessMessage('✅ Conectado ao servidor!');
        } else {
            console.error('❌ Conexão falhou:', data.message);
            showErrorMessage('❌ ' + data.message);
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showErrorMessage('❌ Não foi possível conectar ao servidor. Verifique a URL.');
    }
}

// ============================================
// NAVEGAÇÃO DO FORMULÁRIO
// ============================================

function initFormNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const form = document.getElementById('anamneseForm');
    
    prevBtn.addEventListener('click', goToPrevSection);
    nextBtn.addEventListener('click', goToNextSection);
    form.addEventListener('submit', handleSubmit);
}

function goToPrevSection() {
    if (currentSection > 1) {
        changeSection(currentSection - 1);
    }
}

function goToNextSection() {
    if (validateCurrentSection()) {
        if (currentSection < totalSections) {
            changeSection(currentSection + 1);
        }
    }
}

function changeSection(sectionNumber) {
    // Esconder seção atual
    document.getElementById(`section${currentSection}`).classList.remove('active');
    
    // Mostrar nova seção
    document.getElementById(`section${sectionNumber}`).classList.add('active');
    
    // Atualizar estado
    currentSection = sectionNumber;
    
    // Atualizar interface
    updateProgressBar();
    updateNavigationButtons();
    
    // Ações específicas por seção
    if (sectionNumber === 5) {
        updateConsentInfo();
        setTimeout(resizeSignaturePad, 100);
    }
    
    // Rolar para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
    const percentage = ((currentSection - 1) / (totalSections - 1)) * 100;
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressPercentage').textContent = `${Math.round(percentage)}%`;
    document.getElementById('currentStep').textContent = `Passo ${currentSection} de ${totalSections}`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (currentSection === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    } else if (currentSection === totalSections) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'flex';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    }
}

function updateConsentInfo() {
    const nome = document.getElementById('nome').value || '[Nome Completo]';
    const rg = document.getElementById('rg').value || '[Número do RG]';
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    document.getElementById('consentName').textContent = nome;
    document.getElementById('consentRG').textContent = rg;
    document.getElementById('consentDate').textContent = dataAtual;
}

// ============================================
// VALIDAÇÃO
// ============================================

function validateCurrentSection() {
    const section = document.getElementById(`section${currentSection}`);
    const requiredFields = section.querySelectorAll('[required]');
    let isValid = true;
    
    // Limpar erros anteriores
    section.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
        const errorMsg = el.parentNode.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    });
    
    // Validar cada campo
    requiredFields.forEach(field => {
        if (field.type === 'radio') {
            const groupName = field.name;
            const isChecked = section.querySelector(`input[name="${groupName}"]:checked`);
            if (!isChecked) {
                isValid = false;
                highlightError(field, 'Selecione uma opção');
            }
        } else if (field.type === 'checkbox') {
            if (!field.checked) {
                isValid = false;
                highlightError(field, 'Este campo é obrigatório');
            }
        } else {
            if (!field.value.trim()) {
                isValid = false;
                highlightError(field, 'Este campo é obrigatório');
            }
        }
    });
    
    // Validação especial para assinatura
    if (currentSection === 5) {
        if (!signaturePad || signaturePad.isEmpty()) {
            isValid = false;
            showErrorMessage('Por favor, forneça sua assinatura digital');
        }
    }
    
    if (!isValid) {
        showErrorMessage('Por favor, corrija os campos destacados');
    }
    
    return isValid;
}

function validateForm() {
    // Validar todas as seções
    for (let i = 1; i <= totalSections; i++) {
        currentSection = i;
        if (!validateCurrentSection()) {
            changeSection(i);
            return false;
        }
    }
    return true;
}

function highlightError(field, message) {
    field.classList.add('error');
    
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = message;
    errorMsg.style.color = '#e60073';
    errorMsg.style.fontSize = '0.85rem';
    errorMsg.style.marginTop = '5px';
    
    field.parentNode.appendChild(errorMsg);
}

// ============================================
// ASSINATURA DIGITAL
// ============================================

function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Configurar tamanho
    const resizeCanvas = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Limpar canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };
    
    resizeCanvas();
    
    // Inicializar SignaturePad
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'white',
        penColor: '#333'
    });
    
    // Botão de limpar
    document.getElementById('clearSignature').addEventListener('click', () => {
        signaturePad.clear();
    });
    
    // Redimensionar quando a janela mudar
    window.addEventListener('resize', resizeCanvas);
}

function resizeSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (canvas && signaturePad) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
}

// ============================================
// MÁSCARAS DE ENTRADA
// ============================================

function initInputMasks() {
    // Telefone
    const telefone = document.getElementById('telefone');
    if (telefone) {
        telefone.addEventListener('input', function(e) {
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
    
    // CPF
    const cpf = document.getElementById('cpf');
    if (cpf) {
        cpf.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.substring(0, 11);
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
            e.target.value = value;
        });
    }
}

// ============================================
// CAMPOS CONDICIONAIS
// ============================================

function initConditionalQuestions() {
    const mappings = [
        { trigger: 'prefereMusica', target: 'musicaEspecificaContainer', showOn: 'sim' },
        { trigger: 'tratamentoMedico', target: 'tratamentoEspecificoContainer', showOn: 'sim' },
        { trigger: 'tomaMedicacao', target: 'medicacaoEspecificaContainer', showOn: 'sim' },
        { trigger: 'cirurgia', target: 'cirurgiaEspecificaContainer', showOn: 'sim' },
        { trigger: 'anestesiaOdontologica', target: 'reacaoAnestesiaContainer', showOn: 'sim' },
        { trigger: 'alergiaMedicamento', target: 'alergiaMedicamentoEspecificaContainer', showOn: 'sim' },
        { trigger: 'alergiaAlimento', target: 'alergiaAlimentoEspecificaContainer', showOn: 'sim' },
        { trigger: 'alteracaoCardiologica', target: 'alteracaoCardiologicaEspecificaContainer', showOn: 'sim' },
        { trigger: 'disfuncaoRenal', target: 'disfuncaoRenalEspecificaContainer', showOn: 'sim' },
        { trigger: 'problemaHormonal', target: 'problemaHormonalEspecificoContainer', showOn: 'sim' },
        { trigger: 'alergiaCosmeticos', target: 'alergiaCosmeticosEspecificaContainer', showOn: 'sim' }
    ];
    
    mappings.forEach(mapping => {
        const radios = document.querySelectorAll(`input[name="${mapping.trigger}"]`);
        const target = document.getElementById(mapping.target);
        
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === mapping.showOn) {
                    target.classList.add('active');
                    // Tornar obrigatório
                    const input = target.querySelector('input');
                    if (input) input.required = true;
                } else {
                    target.classList.remove('active');
                    // Remover obrigatoriedade
                    const input = target.querySelector('input');
                    if (input) {
                        input.required = false;
                        input.value = '';
                    }
                }
            });
            
            // Inicializar estado
            if (radio.checked && radio.value === mapping.showOn) {
                target.classList.add('active');
            }
        });
    });
}

// ============================================
// ENVIO DO FORMULÁRIO
// ============================================

async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('Iniciando envio do formulário...');
    
    // Validar formulário
    if (!validateForm()) {
        console.error('Formulário inválido');
        return;
    }
    
    // Verificar assinatura
    if (!signaturePad || signaturePad.isEmpty()) {
        showErrorMessage('Por favor, forneça sua assinatura digital');
        return;
    }
    
    // Verificar URL do GAS
    if (GOOGLE_SCRIPT_URL.includes('COLE_SUA_URL')) {
        showErrorMessage('Configure a URL do Google Apps Script no código');
        return;
    }
    
    // Mostrar carregamento
    showLoadingMessage();
    
    try {
        // Coletar dados
        const formData = collectFormData();
        
        // Gerar PDF
        const pdfData = await generatePdf(formData);
        
        // Enviar para GAS
        const response = await sendToGoogleScript(formData, pdfData);
        
        if (response.success) {
            // Sucesso!
            showSuccessMessage(response.message);
            
            // Armazenar PDF para download
            lastPdfBlob = await base64ToBlob(pdfData, 'application/pdf');
            
            // Mostrar botão de download
            const downloadBtn = document.getElementById('downloadPdfBtn');
            downloadBtn.style.display = 'block';
            downloadBtn.onclick = () => {
                if (response.pdfUrl) {
                    window.open(response.pdfUrl, '_blank');
                } else if (lastPdfBlob) {
                    downloadPdfBlob(lastPdfBlob, `anamnese_${formData.nome}.pdf`);
                }
            };
            
            // Resetar formulário após 5 segundos
            setTimeout(() => {
                resetForm();
                changeSection(1);
            }, 5000);
            
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Erro no envio:', error);
        showErrorMessage(`Erro: ${error.message}`);
    } finally {
        hideLoadingMessage();
    }
}

function collectFormData() {
    const form = document.getElementById('anamneseForm');
    const formData = new FormData(form);
    const data = {};
    
    // Converter FormData para objeto
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Adicionar assinatura
    if (signaturePad && !signaturePad.isEmpty()) {
        data.assinatura = signaturePad.toDataURL('image/jpeg', 0.7);
    }
    
    // Adicionar data de preenchimento
    data.dataPreenchimento = new Date().toISOString();
    data.dataPreenchimentoFormatada = new Date().toLocaleString('pt-BR');
    
    console.log('Dados coletados:', Object.keys(data).length + ' campos');
    return data;
}

async function generatePdf(formData) {
    return new Promise((resolve, reject) => {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Configurações básicas
            pdf.setFontSize(16);
            pdf.setTextColor(230, 0, 115); // Rosa
            pdf.text('Dra. Jaqueline Nobre Moratore', 105, 20, { align: 'center' });
            
            pdf.setFontSize(14);
            pdf.text('Odontologia Especializada', 105, 30, { align: 'center' });
            
            pdf.setFontSize(18);
            pdf.text('FORMULÁRIO DE ANAMNESE', 105, 45, { align: 'center' });
            
            // Linha
            pdf.setDrawColor(230, 0, 115);
            pdf.setLineWidth(0.5);
            pdf.line(20, 50, 190, 50);
            
            // Dados pessoais
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0);
            let y = 60;
            
            pdf.text(`Nome: ${formData.nome || ''}`, 20, y);
            y += 10;
            pdf.text(`RG: ${formData.rg || ''}`, 20, y);
            y += 10;
            pdf.text(`CPF: ${formData.cpf || ''}`, 20, y);
            y += 10;
            pdf.text(`Telefone: ${formData.telefone || ''}`, 20, y);
            y += 10;
            pdf.text(`Email: ${formData.email || ''}`, 20, y);
            
            // Rodapé
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 280, { align: 'center' });
            
            // Converter para base64
            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            resolve(pdfBase64);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            reject(error);
        }
    });
}

async function sendToGoogleScript(formData, pdfData) {
    console.log('Enviando para Google Apps Script...');
    
    const payload = {
        ...formData,
        pdf: pdfData,
        action: 'saveAnamnese'
    };
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Resposta do GAS:', data);
        return data;
        
    } catch (error) {
        console.error('Erro ao enviar para GAS:', error);
        throw new Error('Falha na comunicação com o servidor. Verifique a conexão.');
    }
}

// ============================================
// DOWNLOAD DO PDF
// ============================================

function setupPdfDownload() {
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (lastPdfBlob) {
                downloadPdfBlob(lastPdfBlob, `anamnese_${Date.now()}.pdf`);
            } else {
                showErrorMessage('Nenhum PDF disponível para download');
            }
        });
    }
}

function downloadPdfBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

async function base64ToBlob(base64, contentType) {
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
// MENSAGENS
// ============================================

function showSuccessMessage(message) {
    hideAllMessages();
    const el = document.getElementById('successMessage');
    el.querySelector('span').textContent = message;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth' });
}

function showErrorMessage(message) {
    hideAllMessages();
    const el = document.getElementById('errorMessage');
    document.getElementById('errorText').textContent = message;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth' });
}

function showLoadingMessage() {
    hideAllMessages();
    document.getElementById('loadingMessage').style.display = 'block';
}

function hideLoadingMessage() {
    document.getElementById('loadingMessage').style.display = 'none';
}

function hideAllMessages() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('loadingMessage').style.display = 'none';
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function resetForm() {
    document.getElementById('anamneseForm').reset();
    if (signaturePad) signaturePad.clear();
    lastPdfBlob = null;
    document.getElementById('downloadPdfBtn').style.display = 'none';
    hideAllMessages();
    
    // Resetar campos condicionais
    document.querySelectorAll('.conditional-question').forEach(el => {
        el.classList.remove('active');
    });
    
    console.log('Formulário resetado');
}

// ============================================
// FUNÇÕES DE DEBUG (para usar no console)
// ============================================

// Testar conexão manualmente
window.testGAS = async function() {
    console.log('Testando GAS...');
    return await testConnection();
};

// Ver dados coletados
window.showFormData = function() {
    console.log('Dados do formulário:', collectFormData());
};

// Limpar formulário
window.clearForm = function() {
    resetForm();
    console.log('Formulário limpo');
};
