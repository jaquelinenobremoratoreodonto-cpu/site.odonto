/**
 * Dental Health History Form - Main JavaScript
 * Handles form navigation, validation, conditional questions, and PDF submission
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
        
        this.init();
    }
    
    init() {
        // Set current date
        document.getElementById('data_preenchimento').value = new Date().toLocaleDateString('pt-BR');
        
        // Initialize signature canvas
        this.initSignatureCanvas();
        
        // Show first section
        this.showSection(0);
        
        // Event listeners
        this.addEventListeners();
        
        // Initialize conditional questions
        this.initConditionalQuestions();
    }
    
    initSignatureCanvas() {
        // Set canvas background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#000000';
        
        // Mouse events
        this.signatureCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.signatureCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.signatureCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.signatureCanvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.signatureCanvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
        this.signatureCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.signatureCanvas.addEventListener('touchend', () => this.stopDrawing());
        
        // Clear signature button
        document.getElementById('clearSignature').addEventListener('click', () => this.clearSignature());
    }
    
    startDrawing(e) {
        const rect = this.signatureCanvas.getBoundingClientRect();
        this.isDrawing = true;
        [this.lastX, this.lastY] = [e.clientX - rect.left, e.clientY - rect.top];
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
        // Save signature as base64
        const signatureData = this.signatureCanvas.toDataURL('image/png');
        document.getElementById('assinatura_eletronica').value = signatureData;
    }
    
    clearSignature() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
        document.getElementById('assinatura_eletronica').value = '';
    }
    
    initConditionalQuestions() {
        // Find all yes/no radio groups
        const radioGroups = document.querySelectorAll('input[type="radio"]');
        
        radioGroups.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const target = e.target;
                const showId = target.dataset.show;
                const hideId = target.dataset.hide;
                
                if (showId) {
                    const field = document.getElementById(showId);
                    if (field && target.value === 'sim') {
                        field.classList.add('active');
                        const input = field.querySelector('input, textarea');
                        if (input) input.required = true;
                    }
                }
                
                if (hideId) {
                    const field = document.getElementById(hideId);
                    if (field && target.value === 'nao') {
                        field.classList.remove('active');
                        const input = field.querySelector('input, textarea');
                        if (input) input.required = false;
                        input.value = ''; // Clear the field
                    }
                }
            });
            
            // Trigger change event on page load to set initial state
            if (radio.checked) {
                radio.dispatchEvent(new Event('change'));
            }
        });
    }
    
    showSection(n) {
        // Hide all sections
        this.formSections.forEach(section => section.classList.remove('active'));
        
        // Show current section
        this.formSections[n].classList.add('active');
        
        // Update progress bar
        const progress = ((n + 1) / this.formSections.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // Update navigation buttons
        this.updateNavigationButtons(n);
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
        
        for (let input of inputs) {
            if (!input.value.trim()) {
                input.focus();
                this.showError(input, 'Este campo é obrigatório');
                return false;
            }
            
            // Special validations
            if (input.type === 'email' && !this.isValidEmail(input.value)) {
                this.showError(input, 'Email inválido');
                return false;
            }
            
            if (input.id === 'cpf' && !this.validateCPF(input.value)) {
                this.showError(input, 'CPF inválido');
                return false;
            }
        }
        
        return true;
    }
    
    showError(input, message) {
        // Remove existing error
        this.removeError(input);
        
        // Create error element
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        error.style.color = 'var(--error-red)';
        error.style.fontSize = '0.875rem';
        error.style.marginTop = '0.25rem';
        
        input.parentNode.appendChild(error);
        input.classList.add('error');
        
        // Auto-remove error on input
        input.addEventListener('input', () => this.removeError(input), { once: true });
    }
    
    removeError(input) {
        const error = input.parentNode.querySelector('.error-message');
        if (error) error.remove();
        input.classList.remove('error');
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11) return false;
        
        // CPF validation algorithm
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = sum % 11;
        let digit1 = remainder < 2 ? 0 : 11 - remainder;
        
        if (digit1 !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = sum % 11;
        let digit2 = remainder < 2 ? 0 : 11 - remainder;
        
        return digit2 === parseInt(cpf.charAt(10));
    }
    
    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Add timestamp
        data.timestamp = new Date().toISOString();
        
        // Format date for filename
        const date = new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${
            (date.getMonth() + 1).toString().padStart(2, '0')}-${
            date.getFullYear()}`;
        
        // Create filename
        data.filename = `${data.nome.replace(/\s+/g, '_')}_${data.cpf}_${formattedDate}.pdf`;
        
        return data;
    }
    
    async submitForm() {
        if (!this.validateCurrentSection()) {
            return;
        }
        
        // Show loading indicator
        document.getElementById('loadingIndicator').style.display = 'flex';
        
        try {
            const formData = this.collectFormData();
            
            // Send data to Google Apps Script
            const response = await fetch('https://script.google.com/macros/s/AKfycbygITsKIcgSCwMyzQlKSkj4mlJ1HgJbRNc1PLiatZhaXIbf0wKxEWBDPtpUa2qigswp/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccessModal();
            } else {
                throw new Error(result.error || 'Erro ao processar formulário');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao enviar formulário: ' + error.message);
        } finally {
            document.getElementById('loadingIndicator').style.display = 'none';
        }
    }
    
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.style.display = 'flex';
        
        document.getElementById('closeModal').addEventListener('click', () => {
            modal.style.display = 'none';
            this.form.reset();
            this.clearSignature();
            this.currentStep = 0;
            this.showSection(0);
        }, { once: true });
    }
    
    addEventListeners() {
        // Next button
        document.getElementById('nextBtn').addEventListener('click', () => {
            if (this.validateCurrentSection()) {
                this.currentStep++;
                this.showSection(this.currentStep);
            }
        });
        
        // Previous button
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.currentStep--;
            this.showSection(this.currentStep);
        });
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });
        
        // Real-time CPF formatting
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.substring(0, 11);
                
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                
                e.target.value = value;
            });
        }
        
        // Real-time phone formatting
        const phoneInput = document.getElementById('telefone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.substring(0, 11);
                
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                } else {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                }
                
                e.target.value = value;
            });
        }
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnamneseForm();
});
