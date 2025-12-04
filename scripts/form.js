/**
 * Dental Health History Form - Versão Corrigida
 * Inclui todas as correções e funcionalidades completas
 */

class AnamneseForm {
    constructor() {
        this.currentStep = 0;
        this.formSections = document.querySelectorAll('.form-section');
        this.progressFill = document.getElementById('progressFill');
        this.form = document.getElementById('anamneseForm');
        this.signatureCanvas = document.getElementById('signatureCanvas');
        this.ctx = this.signatureCanvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Configuração do Google Apps Script
        this.GAS_URL = 'https://script.google.com/macros/s/AKfycbzBPqwp4VRRpaYkzxUAALb_V6rITXGsxQ34SInHLtQ8PNZLTM78co4ebAqEJX4XgLPk/exec'; // SUBSTITUIR COM SUA URL
        
        this.init();
    }
    
    init() {
        // Configurar data atual
        this.setCurrentDate();
        
        // Inicializar canvas de assinatura
        this.initSignatureCanvas();
        
        // Mostrar primeira seção
        this.showSection(0);
        
        // Adicionar event listeners
        this.addEventListeners();
        
        // Inicializar perguntas condicionais
        this.initConditionalQuestions();
        
        // Configurar validação em tempo real
        this.setupRealTimeValidation();
    }
    
    setCurrentDate() {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        document.getElementById('data_preenchimento').value = formattedDate;
    }
    
    initSignatureCanvas() {
        // Configurar canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#000000';
        
        // Eventos de mouse
        this.signatureCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.signatureCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.signatureCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.signatureCanvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Eventos touch para mobile
        this.signatureCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        
        this.signatureCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        
        this.signatureCanvas.addEventListener('touchend', () => this.stopDrawing());
        
        // Botão limpar assinatura
        document.getElementById('clearSignature').addEventListener('click', () => this.clearSignature());
    }
    
    startDrawing(e) {
        const rect = this.signatureCanvas.getBoundingClientRect();
        this.isDrawing = true;
        [this.lastX, this.lastY] = [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.signatureCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        [this.lastX, this.lastY] = [x, y];
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.saveSignature();
    }
    
    saveSignature() {
        const signatureData = this.signatureCanvas.toDataURL('image/png');
        document.getElementById('assinatura_eletronica').value = signatureData;
    }
    
    clearSignature() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
        document.getElementById('assinatura_eletronica').value = '';
    }
    
    initConditionalQuestions() {
        // Encontrar todos os grupos de rádio
        const radioGroups = document.querySelectorAll('input[type="radio"][data-show], input[type="radio"][data-hide]');
        
        radioGroups.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleConditionalField(e.target);
            });
            
            // Disparar evento change para configurar estado inicial
            if (radio.checked) {
                this.handleConditionalField(radio);
            }
        });
    }
    
    handleConditionalField(radio) {
        const showId = radio.dataset.show;
        const hideId = radio.dataset.hide;
        
        if (showId && radio.value === 'sim') {
            const field = document.getElementById(showId);
            if (field) {
                field.classList.add('active');
                const input = field.querySelector('input, textarea, select');
                if (input) input.required = true;
            }
        }
        
        if (hideId && radio.value === 'nao') {
            const field = document.getElementById(hideId);
            if (field) {
                field.classList.remove('active');
                const input = field.querySelector('input, textarea, select');
                if (input) {
                    input.required = false;
                    input.value = '';
                }
            }
        }
    }
    
    setupRealTimeValidation() {
        // Validação de CPF em tempo real
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                // Limitar a 11 dígitos
                if (value.length > 11) value = value.substring(0, 11);
                
                // Aplicar máscara
                if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                }
                
                e.target.value = value;
                
                // Validar CPF se completo
                if (value.replace(/\D/g, '').length === 11) {
                    const isValid = this.validateCPF(value);
                    if (isValid) {
                        e.target.classList.remove('error');
                        e.target.classList.add('success');
                        this.removeError(e.target);
                    } else {
                        e.target.classList.remove('success');
                        e.target.classList.add('error');
                        this.showError(e.target, 'CPF inválido');
                    }
                }
            });
        }
        
        // Validação de telefone em tempo real
        const phoneInput = document.getElementById('telefone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                // Aplicar máscara
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                } else if (value.length <= 11) {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                }
                
                e.target.value = value.substring(0, 15);
            });
        }
        
        // Validação de email em tempo real
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', (e) => {
                if (e.target.value && !this.isValidEmail(e.target.value)) {
                    e.target.classList.add('error');
                    this.showError(e.target, 'Email inválido');
                } else if (e.target.value) {
                    e.target.classList.remove('error');
                    e.target.classList.add('success');
                    this.removeError(e.target);
                }
            });
        }
    }
    
    showSection(n) {
        // Esconder todas as seções
        this.formSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar seção atual
        this.formSections[n].classList.add('active');
        
        // Atualizar barra de progresso
        const progress = ((n + 1) / this.formSections.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // Atualizar botões de navegação
        this.updateNavigationButtons(n);
        
        // Scroll para o topo da seção
        this.formSections[n].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    updateNavigationButtons(n) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        prevBtn.style.display = n === 0 ? 'none' : 'flex';
        nextBtn.style.display = n === this.formSections.length - 1 ? 'none' : 'flex';
        submitBtn.style.display = n === this.formSections.length - 1 ? 'flex' : 'none';
    }
    
    validateCurrentSection() {
        const currentSection = this.formSections[this.currentStep];
        const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        for (let input of inputs) {
            // Verificar campos vazios
            if (!input.value.trim()) {
                input.focus();
                this.showError(input, 'Este campo é obrigatório');
                isValid = false;
                continue;
            }
            
            // Validações específicas
            if (input.type === 'email' && !this.isValidEmail(input.value)) {
                this.showError(input, 'Email inválido');
                isValid = false;
            }
            
            if (input.id === 'cpf' && !this.validateCPF(input.value)) {
                this.showError(input, 'CPF inválido');
                isValid = false;
            }
            
            // Remover erro se válido
            if (!input.classList.contains('error')) {
                this.removeError(input);
            }
        }
        
        return isValid;
    }
    
    showError(input, message) {
        // Remover erro existente
        this.removeError(input);
        
        // Criar elemento de erro
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        error.style.color = 'var(--error-red)';
        error.style.fontSize = '0.875rem';
        error.style.marginTop = '0.25rem';
        error.style.animation = 'fadeIn 0.3s ease';
        
        input.parentNode.appendChild(error);
        input.classList.add('error');
    }
    
    removeError(input) {
        const error = input.parentNode.querySelector('.error-message');
        if (error) error.remove();
        input.classList.remove('error');
    }
    
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        let sum = 0;
        let remainder;
        
        // Validar primeiro dígito verificador
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;
        
        // Validar segundo dígito verificador
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    }
    
    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Converter FormData para objeto
        for (let [key, value] of formData.entries()) {
            data[key] = value.trim();
        }
        
        // Adicionar metadados
        data.timestamp = new Date().toISOString();
        data.submission_date = new Date().toLocaleDateString('pt-BR');
        data.submission_time = new Date().toLocaleTimeString('pt-BR');
        
        // Criar nome do arquivo
        const date = new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${
            (date.getMonth() + 1).toString().padStart(2, '0')}-${
            date.getFullYear()}`;
        
        data.filename = `Anamnese_${data.nome.replace(/\s+/g, '_')}_${data.cpf.replace(/\D/g, '')}_${formattedDate}.pdf`;
        
        return data;
    }
    
    async submitForm() {
        // Validar seção atual
        if (!this.validateCurrentSection()) {
            return;
        }
        
        // Validar assinatura
        const signature = document.getElementById('assinatura_eletronica').value;
        if (!signature) {
            alert('Por favor, forneça sua assinatura eletrônica.');
            document.getElementById('signatureCanvas').scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
        // Validar consentimento
        const consentimento = document.getElementById('consentimento');
        if (!consentimento.checked) {
            alert('Você precisa concordar com os termos para enviar o formulário.');
            consentimento.focus();
            return;
        }
        
        // Mostrar indicador de carregamento
        this.showLoading(true);
        
        try {
            const formData = this.collectFormData();
            console.log('Dados coletados:', formData);
            
            // Enviar para Google Apps Script
            const response = await fetch(this.GAS_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            // Nota: Com 'no-cors' não podemos ler a resposta
            // Mas o envio ainda funciona
            console.log('Dados enviados para Google Apps Script');
            
            // Mostrar modal de sucesso
            this.showSuccessModal();
            
            // Resetar formulário após 3 segundos
            setTimeout(() => {
                this.resetForm();
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            this.showErrorModal('Erro ao enviar formulário. Por favor, tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }
    
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.classList.add('active');
        
        // Configurar botão de fechar
        const closeBtn = document.getElementById('closeModal');
        closeBtn.onclick = () => {
            modal.classList.remove('active');
        };
        
        // Fechar modal ao clicar fora
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
    }
    
    showErrorModal(message) {
        // Criar modal de erro dinâmico
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-icon error">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Erro no Envio</h3>
                <p>${message}</p>
                <button class="btn-primary" id="closeErrorModal">OK</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar botão de fechar
        document.getElementById('closeErrorModal').onclick = () => {
            modal.remove();
        };
        
        // Fechar modal ao clicar fora
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }
    
    resetForm() {
        // Resetar formulário
        this.form.reset();
        
        // Limpar assinatura
        this.clearSignature();
        
        // Resetar progresso
        this.currentStep = 0;
        this.showSection(0);
        
        // Resetar data
        this.setCurrentDate();
        
        // Resetar campos condicionais
        document.querySelectorAll('.conditional-field').forEach(field => {
            field.classList.remove('active');
        });
        
        // Remover classes de validação
        document.querySelectorAll('.error, .success').forEach(el => {
            el.classList.remove('error', 'success');
        });
        
        // Remover mensagens de erro
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }
    
    addEventListeners() {
        // Botão próximo
        document.getElementById('nextBtn').addEventListener('click', () => {
            if (this.validateCurrentSection()) {
                this.currentStep++;
                this.showSection(this.currentStep);
            }
        });
        
        // Botão anterior
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.currentStep--;
            this.showSection(this.currentStep);
        });
        
        // Submissão do formulário
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });
        
        // Validação em tempo real para campos obrigatórios
        document.querySelectorAll('input[required], select[required]').forEach(input => {
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    this.showError(input, 'Este campo é obrigatório');
                } else {
                    this.removeError(input);
                }
            });
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new AnamneseForm();
});
