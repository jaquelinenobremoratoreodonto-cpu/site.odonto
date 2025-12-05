/**
 * SCRIPT PRINCIPAL DO PORTAL DE ANAMNESE
 * Dra. Jaqueline Nobre Moratore
 * 
 * Este script controla toda a lógica do formulário, validações,
 * navegação entre seções, geração de PDF e comunicação com Google Apps Script.
 */

// Configurações globais
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzKdkrUwavgxWv9M22Kb0NQ56dJIAftnGYppPqQOuhW9UAbZXqCYiZcIs29guXyL-GT/exec', // URL do Google Apps Script
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
    signaturePad: null,
    formData: {},
    signatureData: null
};

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    // Configurar máscaras para campos
    setupInputMasks();
    
    // Configurar navegação entre seções
    setupSectionNavigation();
    
    // Configurar campos condicionais
    setupConditionalFields();
    
    // Configurar assinatura digital
    setupSignaturePad();
    
    // Configurar envio do formulário
    setupFormSubmission();
    
    // Configurar modal de confirmação
    setupModal();
    
    // Atualizar nome na confirmação de identidade
    updateConfirmationName();
    
    // Configurar validações em tempo real
    setupRealTimeValidation();
}

/**
 * Configura máscaras para campos de telefone e CPF
 */
function setupInputMasks() {
    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
        
        e.target.value = value;
    });

    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        
        e.target.value = value;
    });
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
 * @param {number} sectionNumber - Número da seção (1-4)
 */
function navigateToSection(sectionNumber) {
    // Validar seção atual antes de sair
    if (!validateCurrentSection()) {
        return;
    }
    
    // Se estamos indo para a seção 4, preencher o resumo
    if (sectionNumber === 4) {
        fillReviewSummary();
    }
    
    // Atualizar estado
    AppState.currentSection = sectionNumber;
    
    // Atualizar visual da seção ativa
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(`section${sectionNumber}`).classList.add('active');
    
    // Atualizar barra de progresso
    updateProgressBar(sectionNumber);
    
    // Atualizar passos ativos
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    document.querySelector(`.step[data-step="${sectionNumber}"]`).classList.add('active');
    
    // Rolar para o topo da seção
    window.scrollTo({
        top: document.querySelector('.form-container').offsetTop - 20,
        behavior: 'smooth'
    });
}

/**
 * Valida os campos da seção atual
 * @returns {boolean} - True se a seção é válida
 */
function validateCurrentSection() {
    const currentSection = document.getElementById(`section${AppState.currentSection}`);
    const requiredInputs = currentSection.querySelectorAll('input[required], select[required]');
    
    let isValid = true;
    
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            highlightInvalidField(input);
        } else {
            removeHighlightInvalidField(input);
        }
        
        // Validações específicas por tipo de campo
        if (input.type === 'email' && input.value) {
            if (!isValidEmail(input.value)) {
                isValid = false;
                highlightInvalidField(input, 'Email inválido');
            }
        }
        
        if (input.id === 'telefone' && input.value) {
            if (!isValidPhone(input.value)) {
                isValid = false;
                highlightInvalidField(input, 'Telefone inválido');
            }
        }
        
        if (input.id === 'cpf' && input.value) {
            if (!isValidCPF(input.value)) {
                isValid = false;
                highlightInvalidField(input, 'CPF inválido');
            }
        }
    });
    
    // Validação específica para a seção 4 (assinatura)
    if (AppState.currentSection === 4) {
        const signatureCanvas = document.getElementById('signatureCanvas');
        const signatureEmpty = signatureCanvas.getContext('2d')
            .getImageData(0, 0, signatureCanvas.width, signatureCanvas.height)
            .data.every(channel => channel === 255 || channel === 0);
        
        if (signatureEmpty) {
            isValid = false;
            showNotification('Por favor, forneça sua assinatura digital', 'warning');
        }
    }
    
    if (!isValid) {
        showNotification('Por favor, preencha todos os campos obrigatórios corretamente', 'error');
    }
    
    return isValid;
}

/**
 * Destaca um campo inválido
 */
function highlightInvalidField(input, message = 'Campo obrigatório') {
    input.style.borderColor = 'var(--error-color)';
    input.style.boxShadow = '0 0 0 3px rgba(244, 67, 54, 0.1)';
    
    // Remover mensagem de erro existente
    const existingError = input.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Adicionar mensagem de erro
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--error-color)';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    
    input.parentNode.appendChild(errorElement);
}

/**
 * Remove destaque de campo inválido
 */
function removeHighlightInvalidField(input) {
    input.style.borderColor = '';
    input.style.boxShadow = '';
    
    // Remover mensagem de erro
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Configura campos condicionais (aparecem quando seleciona "Sim")
 */
function setupConditionalFields() {
    // Encontrar todos os botões de rádio que controlam campos condicionais
    document.querySelectorAll('input[type="radio"][data-toggle]').forEach(radio => {
        radio.addEventListener('change', function() {
            const targetId = this.getAttribute('data-toggle');
            const targetElement = document.getElementById(targetId);
            
            if (this.value === 'Sim') {
                targetElement.classList.remove('hidden');
                // Adicionar required ao campo condicional
                const input = targetElement.querySelector('input, select, textarea');
                if (input) input.required = true;
            } else {
                targetElement.classList.add('hidden');
                // Remover required e limpar valor
                const input = targetElement.querySelector('input, select, textarea');
                if (input) {
                    input.required = false;
                    input.value = '';
                }
            }
        });
    });
}

/**
 * Configura a área de assinatura digital
 */
function setupSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    
    // Configurar estilo do canvas
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#333333';
    
    // Estado da assinatura
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let paths = [];
    let currentPath = [];
    
    // Função para começar a desenhar
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
        currentPath = [{x: lastX, y: lastY}];
    }
    
    // Função para desenhar
    function draw(e) {
        if (!isDrawing) return;
        
        e.preventDefault();
        
        const [x, y] = getCoordinates(e);
        
        // Desenhar linha
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Atualizar coordenadas
        [lastX, lastY] = [x, y];
        
        // Salvar ponto no caminho atual
        currentPath.push({x, y});
    }
    
    // Função para parar de desenhar
    function stopDrawing() {
        if (!isDrawing) return;
        
        isDrawing = false;
        
        // Salvar caminho se tiver pontos
        if (currentPath.length > 1) {
            paths.push([...currentPath]);
        }
    }
    
    // Obter coordenadas do evento (mouse ou touch)
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        
        if (e.type.includes('touch')) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return [
            clientX - rect.left,
            clientY - rect.top
        ];
    }
    
    // Event listeners para mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Event listeners para touch
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startDrawing(e);
    });
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        draw(e);
    });
    canvas.addEventListener('touchend', stopDrawing);
    
    // Botão para limpar assinatura
    document.getElementById('clearSignature').addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths = [];
        currentPath = [];
    });
    
    // Botão para desfazer último traço
    document.getElementById('undoSignature').addEventListener('click', function() {
        if (paths.length > 0) {
            // Remover último caminho
            paths.pop();
            
            // Limpar canvas e redesenhar todos os caminhos
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            paths.forEach(path => {
                if (path.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    
                    for (let i = 1; i < path.length; i++) {
                        ctx.lineTo(path[i].x, path[i].y);
                    }
                    
                    ctx.stroke();
                }
            });
        }
    });
    
    // Salvar assinatura no AppState quando for usar
    AppState.signaturePad = {
        canvas: canvas,
        ctx: ctx,
        getSignatureDataURL: function() {
            return canvas.toDataURL('image/png');
        },
        isEmpty: function() {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return imageData.data.every(channel => channel === 255 || channel === 0);
        }
    };
}

/**
 * Preenche o resumo das informações na seção 4
 */
function fillReviewSummary() {
    const reviewContent = document.getElementById('reviewContent');
    const form = document.getElementById('anamneseForm');
    const formData = new FormData(form);
    
    let html = '';
    
    // Dados Pessoais
    html += '<div class="review-item">';
    html += '<h4>Dados Pessoais</h4>';
    html += `<p><strong>Nome Completo:</strong> ${formData.get('nomeCompleto') || 'Não informado'}</p>`;
    html += `<p><strong>Data de Nascimento:</strong> ${formatDate(formData.get('dataNascimento')) || 'Não informado'}</p>`;
    html += `<p><strong>Gênero:</strong> ${formData.get('genero') || 'Não informado'}</p>`;
    html += `<p><strong>Telefone:</strong> ${formData.get('telefone') || 'Não informado'}</p>`;
    html += `<p><strong>Endereço:</strong> ${formData.get('endereco') || 'Não informado'}</p>`;
    html += `<p><strong>Profissão:</strong> ${formData.get('profissao') || 'Não informado'}</p>`;
    html += `<p><strong>RG:</strong> ${formData.get('rg') || 'Não informado'}</p>`;
    html += `<p><strong>CPF:</strong> ${formData.get('cpf') || 'Não informado'}</p>`;
    html += '</div>';
    
    // Saúde Geral
    html += '<div class="review-item">';
    html += '<h4>Saúde Geral</h4>';
    html += `<p><strong>Tratamento Médico:</strong> ${formData.get('tratamentoMedico') || 'Não informado'}`;
    if (formData.get('tratamentoMedico') === 'Sim') {
        html += ` - ${formData.get('tratamentoQual') || ''}`;
    }
    html += '</p>';
    
    html += `<p><strong>Medicação:</strong> ${formData.get('tomaMedicacao') || 'Não informado'}`;
    if (formData.get('tomaMedicacao') === 'Sim') {
        html += ` - ${formData.get('medicacaoQual') || ''}`;
    }
    html += '</p>';
    
    // Adicionar mais campos de saúde geral conforme necessário
    html += `<p><strong>Autoriza Uso de Imagem:</strong> ${formData.get('autorizaImagem') || 'Não informado'}</p>`;
    html += '</div>';
    
    // Saúde Bucal
    html += '<div class="review-item">';
    html += '<h4>Saúde Bucal</h4>';
    html += `<p><strong>Frequência de Escovação:</strong> ${formData.get('frequenciaEscovacao') || 'Não informado'}</p>`;
    html += `<p><strong>Uso de Fio Dental:</strong> ${formData.get('usoFioDental') || 'Não informado'}</p>`;
    html += `<p><strong>Creme Dental:</strong> ${formData.get('cremeDental') || 'Não informado'}</p>`;
    html += `<p><strong>Escova a Língua:</strong> ${formData.get('escovaLingua') || 'Não informado'}</p>`;
    html += `<p><strong>Marca da Escova:</strong> ${formData.get('marcaEscova') || 'Não informado'}</p>`;
    html += `<p><strong>Morde Objetos:</strong> ${formData.get('mordeObjetos') || 'Não informado'}</p>`;
    html += `<p><strong>Range os Dentes:</strong> ${formData.get('rangeDentes') || 'Não informado'}</p>`;
    html += `<p><strong>Rói as Unhas:</strong> ${formData.get('roiUnhas') || 'Não informado'}</p>`;
    html += '</div>';
    
    reviewContent.innerHTML = html;
    
    // Atualizar nome na confirmação de identidade
    updateConfirmationName();
}

/**
 * Atualiza o nome na confirmação de identidade
 */
function updateConfirmationName() {
    const nomeCompleto = document.getElementById('nomeCompleto').value;
    if (nomeCompleto) {
        document.getElementById('nomeConfirma').textContent = nomeCompleto;
    }
}

/**
 * Configura o envio do formulário
 */
function setupFormSubmission() {
    const form = document.getElementById('anamneseForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar todas as seções
        let allValid = true;
        for (let i = 1; i <= AppState.totalSections; i++) {
            AppState.currentSection = i;
            if (!validateCurrentSection()) {
                allValid = false;
                navigateToSection(i);
                break;
            }
        }
        
        if (!allValid) {
            showNotification('Por favor, corrija os erros no formulário antes de enviar', 'error');
            return;
        }
        
        // Verificar assinatura
        if (AppState.signaturePad.isEmpty()) {
            showNotification('Por favor, forneça sua assinatura digital', 'warning');
            navigateToSection(4);
            return;
        }
        
        // Verificar confirmação de identidade
        const confirmacao = document.getElementById('confirmacaoIdentidade');
        if (!confirmacao.checked) {
            showNotification('Por favor, confirme sua identidade marcando a caixa de confirmação', 'warning');
            return;
        }
        
        // Mostrar carregamento
        const submitBtn = document.getElementById('submitForm');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;
        
        try {
            // Coletar dados do formulário
            const formData = collectFormData();
            
            // Gerar PDF localmente para download imediato
            const pdfBlob = await generatePDF(formData);
            
            // Enviar dados para o Google Apps Script
            const response = await sendToGoogleScript(formData, pdfBlob);
            
            if (response.success) {
                // Salvar PDF localmente
                savePDFLocally(pdfBlob, formData);
                
                // Mostrar modal de sucesso
                showSuccessModal();
            } else {
                throw new Error(response.message || 'Erro ao enviar formulário');
            }
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            showNotification(`Erro ao enviar: ${error.message}`, 'error');
        } finally {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Botão de editar informações
    document.getElementById('editForm').addEventListener('click', function() {
        navigateToSection(1);
    });
}

/**
 * Coleta todos os dados do formulário
 * @returns {Object} - Dados do formulário
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
    
    // Adicionar assinatura
    data.assinatura = AppState.signaturePad.getSignatureDataURL();
    
    return data;
}

/**
 * Gera PDF com os dados do formulário
 * @param {Object} formData - Dados do formulário
 * @returns {Promise<Blob>} - PDF como Blob
 */
async function generatePDF(formData) {
    // Usaremos jsPDF para gerar o PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(CONFIG.PDF_OPTIONS);
    
    // Configurações
    const margin = 20;
    let yPos = margin;
    const lineHeight = 8;
    const pageHeight = doc.internal.pageSize.height;
    
    // Adicionar cabeçalho
    doc.setFillColor(240, 98, 146); // Rosa
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Formulário de Anamnese', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Dra. Jaqueline Nobre Moratore', 105, 30, { align: 'center' });
    
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
        `Nome: ${formData.nomeCompleto}`,
        `Data de Nascimento: ${formatDate(formData.dataNascimento)}`,
        `Gênero: ${formData.genero}`,
        `Telefone: ${formData.telefone}`,
        `Endereço: ${formData.endereco}`,
        `Profissão: ${formData.profissao}`,
        `RG: ${formData.rg}`,
        `CPF: ${formData.cpf}`
    ];
    
    personalFields.forEach(field => {
        if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
        }
        doc.text(field, margin, yPos);
        yPos += lineHeight;
    });
    
    // Adicionar dados de saúde
    yPos += lineHeight;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SAÚDE GERAL', margin, yPos);
    yPos += lineHeight * 1.5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const healthFields = [
        `Tratamento Médico: ${formData.tratamentoMedico}${formData.tratamentoMedico === 'Sim' ? ` - ${formData.tratamentoQual}` : ''}`,
        `Medicação: ${formData.tomaMedicacao}${formData.tomaMedicacao === 'Sim' ? ` - ${formData.medicacaoQual}` : ''}`,
        `Cirurgia: ${formData.cirurgia}${formData.cirurgia === 'Sim' ? ` - ${formData.cirurgiaQual}` : ''}`,
        `Alergia a Medicamentos: ${formData.alergiaMedicamento}${formData.alergiaMedicamento === 'Sim' ? ` - ${formData.alergiaMedicamentoQual}` : ''}`,
        `Problemas Cardíacos: ${formData.alteracaoCardiologica}${formData.alteracaoCardiologica === 'Sim' ? ` - ${formData.alteracaoCardiologicaQual}` : ''}`,
        `Diabético: ${formData.diabetico}`,
        `Autoriza Uso de Imagem: ${formData.autorizaImagem}`
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
        `Frequência de Escovação: ${formData.frequenciaEscovacao}`,
        `Uso de Fio Dental: ${formData.usoFioDental}`,
        `Creme Dental: ${formData.cremeDental}`,
        `Escova a Língua: ${formData.escovaLingua}`,
        `Marca da Escova: ${formData.marcaEscova}`,
        `Morde Objetos: ${formData.mordeObjetos}`,
        `Range os Dentes: ${formData.rangeDentes}`,
        `Rói as Unhas: ${formData.roiUnhas}`
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
    yPos += lineHeight;
    doc.text(`Data de Preenchimento: ${formatDate(new Date().toISOString())}`, margin, yPos);
    
    // Adicionar assinatura (se houver espaço)
    yPos += lineHeight * 2;
    if (formData.assinatura) {
        try {
            // Converter data URL da assinatura para imagem
            const signatureImg = new Image();
            signatureImg.src = formData.assinatura;
            
            // Adicionar assinatura ao PDF
            doc.addImage(signatureImg, 'PNG', margin, yPos, 80, 30);
            yPos += 35;
            doc.text('Assinatura do Paciente', margin, yPos);
        } catch (error) {
            console.error('Erro ao adicionar assinatura ao PDF:', error);
        }
    }
    
    // Gerar blob do PDF
    const pdfBlob = doc.output('blob');
    return pdfBlob;
}

/**
 * Salva PDF localmente
 */
function savePDFLocally(pdfBlob, formData) {
    // Criar link de download
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Nome do arquivo: nomecompleto.rg.data.pdf
    const nomeArquivo = `${formData.nomeCompleto.replace(/\s+/g, '_')}.${formData.rg}.${new Date().toISOString().split('T')[0]}.pdf`;
    link.download = nomeArquivo;
    
    // Simular clique para download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Envia dados para o Google Apps Script
 */
async function sendToGoogleScript(formData, pdfBlob) {
    // Converter blob para base64
    const pdfBase64 = await blobToBase64(pdfBlob);
    
    // Preparar dados para envio
    const payload = {
        ...formData,
        pdfBase64: pdfBase64,
        pdfNome: `${formData.nomeCompleto}.${formData.rg}.${new Date().toISOString().split('T')[0]}.pdf`
    };
    
    // Enviar para Google Apps Script
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requer no-cors para web apps
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    // Nota: Com 'no-cors' não podemos ler a resposta diretamente
    // O Google Apps Script precisa lidar com o processamento
    return { success: true };
}

/**
 * Converte Blob para Base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Configura o modal de confirmação
 */
function setupModal() {
    const modal = document.getElementById('successModal');
    const closeBtns = document.querySelectorAll('#closeModal, #closeModalBtn, .modal-close');
    const downloadBtn = document.getElementById('downloadPdf');
    
    // Fechar modal
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    // Fechar ao clicar fora do modal
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Botão de download no modal
    downloadBtn.addEventListener('click', function() {
        // O download já foi feito durante o envio
        // Aqui poderíamos oferecer um novo download se necessário
        this.innerHTML = '<i class="fas fa-check"></i> PDF Baixado';
        this.disabled = true;
    });
}

/**
 * Mostra o modal de sucesso
 */
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
    
    // Atualizar botão de download
    const downloadBtn = document.getElementById('downloadPdf');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Baixar PDF';
    downloadBtn.disabled = false;
}

/**
 * Atualiza a barra de progresso
 */
function updateProgressBar(currentSection) {
    const progressBar = document.querySelector('.progress-bar');
    const percentage = ((currentSection - 1) / (AppState.totalSections - 1)) * 100;
    progressBar.style.width = `${percentage}%`;
}

/**
 * Configura validação em tempo real
 */
function setupRealTimeValidation() {
    // Validar campos enquanto o usuário digita
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                highlightInvalidField(this);
            } else {
                removeHighlightInvalidField(this);
            }
        });
        
        // Atualizar nome na confirmação em tempo real
        if (input.id === 'nomeCompleto') {
            input.addEventListener('input', updateConfirmationName);
        }
    });
}

/**
 * Mostra notificação para o usuário
 */
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--error-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--success-color)'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        z-index: 1001;
        max-width: 400px;
        animation: fadeIn 0.3s ease;
    `;
    
    // Estilos do conteúdo
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Botão de fechar
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
    `;
    
    // Adicionar ao documento
    document.body.appendChild(notification);
    
    // Fechar notificação após 5 segundos
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
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
    const re = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    return re.test(phone);
}

function isValidCPF(cpf) {
    // Remover caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validar CPF (algoritmo básico)
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
