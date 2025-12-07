/**
 * SISTEMA DE ANAMNESE - FRONTEND SUPER SIMPLIFICADO
 * Comunicação garantida com Google Apps Script
 */

// CONFIGURAÇÃO - IMPORTANTE: Cole sua URL aqui
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoQMjVEWmQV_MoqoTZZ6p0Hwb6TTSM1Tt4eC9dTMgYHuE_xJtGkBhRYAEuuC9dyr10/exec";

// Variáveis globais
let currentSection = 1;
const totalSections = 5;
let signaturePad = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema carregado');
    
    // Navegação básica
    document.getElementById('prevBtn').addEventListener('click', goToPrevSection);
    document.getElementById('nextBtn').addEventListener('click', goToNextSection);
    document.getElementById('anamneseForm').addEventListener('submit', handleSubmit);
    
    // Assinatura
    initSignaturePad();
    
    // Botão de download
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdf);
    
    // Atualizar interface
    updateUI();
});

// Navegação
function goToPrevSection() {
    if (currentSection > 1) {
        currentSection--;
        updateUI();
    }
}

function goToNextSection() {
    if (currentSection < totalSections) {
        currentSection++;
        updateUI();
    }
}

function updateUI() {
    // Mostrar/ocultar seções
    for (let i = 1; i <= totalSections; i++) {
        document.getElementById(`section${i}`).classList.toggle('active', i === currentSection);
    }
    
    // Atualizar barra de progresso
    const progress = ((currentSection - 1) / (totalSections - 1)) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('currentStep').textContent = `Passo ${currentSection} de ${totalSections}`;
    
    // Atualizar botões
    document.getElementById('prevBtn').style.display = currentSection === 1 ? 'none' : 'flex';
    document.getElementById('nextBtn').style.display = currentSection === totalSections ? 'none' : 'flex';
    document.getElementById('submitBtn').style.display = currentSection === totalSections ? 'flex' : 'none';
    
    // Atualizar consentimento na seção 5
    if (currentSection === 5) {
        const nome = document.getElementById('nome').value || '[Nome Completo]';
        const rg = document.getElementById('rg').value || '[Número do RG]';
        document.getElementById('consentName').textContent = nome;
        document.getElementById('consentRG').textContent = rg;
        document.getElementById('consentDate').textContent = new Date().toLocaleDateString('pt-BR');
    }
}

// Assinatura
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    signaturePad = new SignaturePad(canvas);
    
    document.getElementById('clearSignature').addEventListener('click', function() {
        signaturePad.clear();
    });
}

// Envio do formulário
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('Enviando formulário...');
    
    // Validar assinatura
    if (!signaturePad || signaturePad.isEmpty()) {
        alert('Por favor, forneça sua assinatura digital');
        return;
    }
    
    // Verificar URL
    if (GOOGLE_SCRIPT_URL.includes('SUA_URL_AQUI')) {
        alert('Configure a URL do Google Apps Script no código');
        return;
    }
    
    // Mostrar carregamento
    showMessage('loading', 'Processando seu formulário...');
    
    try {
        // Coletar dados
        const formData = new FormData(document.getElementById('anamneseForm'));
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Adicionar assinatura
        data.assinatura = signaturePad.toDataURL('image/jpeg', 0.5);
        data.dataPreenchimentoFormatada = new Date().toLocaleString('pt-BR');
        data.action = 'saveAnamnese';
        
        // Gerar PDF simples
        const pdfData = await generateSimplePdf(data);
        data.pdf = pdfData;
        
        // Enviar para GAS
        console.log('Enviando para GAS...');
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('Resposta:', result);
        
        if (result.success) {
            showMessage('success', result.message);
            document.getElementById('downloadPdfBtn').style.display = 'block';
            
            // Salvar URL do PDF para download
            if (result.pdfUrl) {
                document.getElementById('downloadPdfBtn').dataset.pdfUrl = result.pdfUrl;
            }
            
            // Resetar após 5 segundos
            setTimeout(() => {
                document.getElementById('anamneseForm').reset();
                signaturePad.clear();
                document.getElementById('downloadPdfBtn').style.display = 'none';
                currentSection = 1;
                updateUI();
                showMessage('none', '');
            }, 5000);
            
        } else {
            throw new Error(result.message || 'Erro no servidor');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        showMessage('error', `Erro: ${error.message}`);
    }
}

// Gerar PDF simples
function generateSimplePdf(data) {
    return new Promise((resolve) => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        pdf.setFontSize(16);
        pdf.setTextColor(230, 0, 115);
        pdf.text('Dra. Jaqueline Nobre Moratore', 105, 20, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.text('Odontologia Especializada', 105, 30, { align: 'center' });
        
        pdf.setFontSize(18);
        pdf.text('FORMULÁRIO DE ANAMNESE', 105, 45, { align: 'center' });
        
        pdf.setDrawColor(230, 0, 115);
        pdf.setLineWidth(0.5);
        pdf.line(20, 50, 190, 50);
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        
        let y = 60;
        pdf.text(`Nome: ${data.nome || ''}`, 20, y); y += 10;
        pdf.text(`RG: ${data.rg || ''}`, 20, y); y += 10;
        pdf.text(`CPF: ${data.cpf || ''}`, 20, y); y += 10;
        pdf.text(`Telefone: ${data.telefone || ''}`, 20, y); y += 10;
        pdf.text(`Email: ${data.email || ''}`, 20, y); y += 10;
        pdf.text(`Data Nascimento: ${data.dataNascimento || ''}`, 20, y); y += 10;
        pdf.text(`Endereço: ${data.endereco || ''}`, 20, y); y += 10;
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 280, { align: 'center' });
        
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        resolve(pdfBase64);
    });
}

// Download do PDF
function downloadPdf() {
    const pdfUrl = this.dataset.pdfUrl;
    if (pdfUrl) {
        window.open(pdfUrl, '_blank');
    } else {
        alert('URL do PDF não disponível');
    }
}

// Mensagens
function showMessage(type, text) {
    const messages = ['success', 'error', 'loading'];
    messages.forEach(msg => {
        document.getElementById(`${msg}Message`).style.display = 'none';
    });
    
    if (type !== 'none') {
        const element = document.getElementById(`${type}Message`);
        element.style.display = 'block';
        if (text) {
            const span = element.querySelector('span');
            if (span) span.textContent = text;
        }
    }
}

// Testar conexão
window.testConnection = async function() {
    console.log('Testando conexão...');
    
    if (GOOGLE_SCRIPT_URL.includes('SUA_URL_AQUI')) {
        alert('Configure a URL primeiro');
        return;
    }
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'testConnection' })
        });
        
        const data = await response.json();
        alert(data.success ? '✅ ' + data.message : '❌ ' + data.message);
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
};
