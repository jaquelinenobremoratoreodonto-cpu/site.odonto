// ============================================
// Ficha de Anamnese - Lógica do formulário
// Dra. Jaqueline Nobre Moratore
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('anamnese-form');
  const steps = Array.from(document.querySelectorAll('.step'));
  const progressFill = document.getElementById('progress-fill');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnSubmit = document.getElementById('btn-submit');
  const formError = document.getElementById('form-error');
  const successScreen = document.getElementById('success-screen');
  const declNome = document.getElementById('decl-nome');
  const nomeInput = form.querySelector('input[name="nome"]');

  let currentStep = 0;

  function updateProgress() {
    const pct = ((currentStep + 1) / steps.length) * 100;
    progressFill.style.width = pct + '%';
  }

  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle('active', i === index));
    btnPrev.classList.toggle('hidden', index === 0);
    btnNext.classList.toggle('hidden', index === steps.length - 1);
    btnSubmit.classList.toggle('hidden', index !== steps.length - 1);
    updateProgress();
    window.scrollTo({ top: form.offsetTop - 40, behavior: 'smooth' });
  }

  function validateStep(index) {
    const inputs = steps[index].querySelectorAll('input[required], select[required], textarea[required]');
    for (const el of inputs) {
      if (!el.value || (el.type === 'checkbox' && !el.checked)) {
        el.focus();
        showError('Por favor, preencha todos os campos obrigatórios (*) antes de continuar.');
        return false;
      }
    }
    hideError();
    return true;
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.classList.remove('hidden');
  }
  function hideError() { formError.classList.add('hidden'); }

  btnNext.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
      if (currentStep === steps.length - 1) {
        declNome.textContent = nomeInput.value || '[nome do paciente]';
      }
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  // Conditional fields (show text input when "Sim" selected)
  document.querySelectorAll('[data-conditional]').forEach(group => {
    const targetName = group.getAttribute('data-conditional');
    const targetField = form.querySelector(`[name="${targetName}"]`);
    group.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'Sim' && radio.checked) {
          targetField.classList.remove('hidden');
        } else if (radio.checked) {
          targetField.classList.add('hidden');
          targetField.value = '';
        }
      });
    });
  });

  // ===================== Signature Pad =====================
  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let hasSignature = false;

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = '#d94e87';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e) {
    drawing = true; hasSignature = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  }
  function moveDraw(e) {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  }
  function endDraw() { drawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', moveDraw);
  canvas.addEventListener('touchend', endDraw);

  document.getElementById('clear-signature').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
  });

  // ===================== Submit =====================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    if (!document.getElementById('confirm-truth').checked) {
      showError('Você precisa confirmar que as informações são verdadeiras.');
      return;
    }
    if (!hasSignature) {
      showError('Por favor, assine no campo de assinatura antes de enviar.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      if (data[key]) {
        data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
      } else {
        data[key] = value;
      }
    });
    data.assinaturaImagem = canvas.toDataURL('image/png');
    data.dataEnvio = new Date().toISOString();

    try {
      const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.status === 'success') {
        form.classList.add('hidden');
        successScreen.classList.remove('hidden');
      } else {
        throw new Error(result.message || 'Erro desconhecido');
      }
    } catch (err) {
      showError('Ocorreu um erro ao enviar a ficha. Tente novamente ou contate a clínica. (' + err.message + ')');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar Ficha';
    }
  });

  showStep(0);
});
