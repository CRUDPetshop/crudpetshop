const API = '/api';
const specieEmojis = { Cachorro:'🐶', Gato:'🐱', Coelho:'🐰', Pássaro:'🐦', Hamster:'🐹', Peixe:'🐠', Réptil:'🦎', Outro:'🐾' };
let petsCache = [];

function showToast(msg, isErr = false){
  const t = document.getElementById('toastMsg');
  document.getElementById('toastText').textContent = msg;
  t.style.background = isErr ? '#E8613C' : 'var(--green)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Carrega tutores ──
async function loadTutores(){
  try {
    const r = await fetch(`${API}/tutores`);
    const tutores = await r.json();
    const sel = document.getElementById('agTutor');
    sel.innerHTML = '<option value="">Selecione o tutor...</option>';
    tutores.tutores.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.nome;
      sel.appendChild(opt);
    });
  } catch { showToast('Erro ao carregar tutores.', true); }
}

// ── Ao selecionar tutor, carrega seus pets ──
document.getElementById('agTutor').addEventListener('change', async function(){
  const petSel = document.getElementById('agPet');
  petSel.innerHTML = '<option value="">Selecione o pet...</option>';
  document.getElementById('petDisplay').style.display = 'none';
  document.getElementById('sumPet').textContent = '—';
  petsCache = [];
  if (!this.value) return;
  try {
    const r = await fetch(`${API}/pet_tutor/${this.value}`);
    petsCache = await r.json();
	if(petsCache){
		const opt = document.createElement('option');
		opt.value = petsCache.id;
		opt.textContent = `${specieEmojis[petsCache.especie]||'🐾'} ${petsCache.nome} (${petsCache.especie}${petsCache.porte?' · '+petsCache.porte:''})`;
		petSel.appendChild(opt);
	}else{
		showToast('Tutor selecionado náo tem nenhum pet cadastrado.', true);
	}
  } catch { showToast('Erro ao carregar pets.', true); }
  updateSummary();
});

// ── Ao selecionar pet, exibe card ──
document.getElementById('agPet').addEventListener('change', function(){
  const disp = document.getElementById('petDisplay');
  if (petsCache) {
    disp.style.display = 'block';
    disp.innerHTML = `<div class="pet-display">
      <div class="pet-display-avatar">${specieEmojis[petsCache.especie]||'🐾'}</div>
      <div class="pet-display-info">
        <div class="name">${petsCache.nome}</div>
        <div class="meta">${petsCache.especie}${petsCache.raca?' · '+petsCache.raca:''}${petsCache.porte?' · '+petsCache.porte:''}${petsCache.sexo?' · '+petsCache.sexo:''}</div>
      </div>
    </div>`;
    document.getElementById('sumPet').textContent = petsCache.nome;
  } else {
    disp.style.display = 'none';
    document.getElementById('sumPet').textContent = '—';
  }
  updateSummary();
});

// ── Data mínima ──
document.getElementById('agData').min = new Date().toISOString().split('T')[0];
document.getElementById('agData').addEventListener('change', updateSummary);

function selectService(el){
  document.querySelectorAll('.service-option').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('servicoPrincipal').value = el.dataset.service;
  document.getElementById('servicoError').style.display = 'none';
  calcTotal(); updateSummary();
}

function selectTime(el){
  if (el.classList.contains('unavailable')) return;
  document.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('agHorario').value = el.textContent.trim();
  document.getElementById('horarioError').style.display = 'none';
  updateSummary();
}

function calcTotal(){
  const sel = document.querySelector('.service-option.selected');
  let total = sel ? parseInt(sel.dataset.price) : 0;
  document.querySelectorAll('[name="addon"]:checked').forEach(a => total += parseInt(a.dataset.price));
  document.getElementById('sumTotal').textContent = `R$ ${total}`;
  const addons = [...document.querySelectorAll('[name="addon"]:checked')].map(a=>a.value);
  document.getElementById('sumAddonsWrap').style.display = addons.length ? '' : 'none';
  if (addons.length) document.getElementById('sumAddons').textContent = addons.join(', ');
}

function updateSummary(){
  const sel = document.querySelector('.service-option.selected');
  document.getElementById('sumServico').textContent = sel ? sel.dataset.service : '—';
  const dataVal = document.getElementById('agData').value;
  document.getElementById('sumData').textContent = dataVal
    ? new Date(dataVal+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'})
    : '—';
  document.getElementById('sumHorario').textContent = document.getElementById('agHorario').value || '—';
}

document.querySelectorAll('[name="addon"]').forEach(a => a.addEventListener('change', () => { calcTotal(); updateSummary(); }));

// ── Submit: salva agendamento na API ──
document.getElementById('agendForm').addEventListener('submit', async function(e){
  e.preventDefault();
  this.classList.add('was-validated');

  let valid = true;
  if (!document.getElementById('servicoPrincipal').value){
    document.getElementById('servicoError').style.display = 'block'; valid = false;
  }
  if (!document.getElementById('agHorario').value){
    document.getElementById('horarioError').style.display = 'block'; valid = false;
  }
  if (!this.checkValidity() || !valid) return;

  const tutorId  = document.getElementById('agTutor').value;
  const petId    = document.getElementById('agPet').value;
  const servico  = document.getElementById('servicoPrincipal').value;
  const data     = document.getElementById('agData').value;
  const horario  = document.getElementById('agHorario').value;
  const addons   = [...document.querySelectorAll('[name="addon"]:checked')].map(a=>a.value);
  const total    = parseFloat(document.getElementById('sumTotal').textContent.replace('R$ ','')) || 0;
  const pagamento    = document.getElementById('pagamento').value;
  const notificacao  = document.getElementById('notificacao').value;
  const obs          = document.getElementById('agObs').value;

  const payload = { tutor_id: tutorId || null, animal_id: petId || null,
    servico, addons, data, horario, pagamento, notificacao, obs, total, status: 'Confirmado' };

  const saveBtn = this.querySelector('.btn-save');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Confirmando...';

  try {
    const r = await fetch(`${API}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const ag = await r.json();
    if (!r.ok){ showToast(ag.error || 'Erro ao agendar.', true); return; }

    // Show confirm screen
    document.getElementById('formBody').style.display = 'none';
    const cs = document.getElementById('confirmScreen');
    cs.style.display = 'block';
    const pet = petsCache.find(p => String(p.id) === String(petId));
    const d = new Date(data+'T12:00:00');
    cs.querySelector('#confirmDetails').innerHTML = `
      <div style="display:grid; gap:.6rem">
        <div><b>🐾 Pet:</b> ${pet?.nome||ag.animal_nome||'—'} (${pet?.especie||ag.animal_especie||''})</div>
        <div><b>👤 Tutor:</b> ${ag.tutor_nome || '—'}</div>
        <div><b>✂️ Serviço:</b> ${servico}</div>
        ${addons.length ? `<div><b>➕ Adicionais:</b> ${addons.join(', ')}</div>` : ''}
        <div><b>📅 Data:</b> ${d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div>
        <div><b>🕐 Horário:</b> ${horario}</div>
        <div><b>💰 Total:</b> R$ ${total}</div>
        ${pagamento ? `<div><b>💳 Pagamento:</b> ${pagamento}</div>` : ''}
      </div>`;

    await fetchHistory();
  } catch {
    showToast('Erro de conexão com o servidor.', true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="bi bi-calendar-check-fill"></i> Confirmar Agendamento';
  }
});

function resetAgendamento(){
  document.getElementById('agendForm').reset();
  document.getElementById('agendForm').classList.remove('was-validated');
  document.getElementById('formBody').style.display = '';
  document.getElementById('confirmScreen').style.display = 'none';
  document.querySelectorAll('.service-option').forEach(s=>s.classList.remove('selected'));
  document.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('selected'));
  document.getElementById('servicoPrincipal').value = '';
  document.getElementById('agHorario').value = '';
  document.getElementById('petDisplay').style.display = 'none';
  document.getElementById('sumPet').textContent = '—';
  document.getElementById('sumServico').textContent = '—';
  document.getElementById('sumData').textContent = '—';
  document.getElementById('sumHorario').textContent = '—';
  document.getElementById('sumTotal').textContent = 'R$ 0';
  petsCache = [];
}

// ── Histórico via API ──
async function fetchHistory(){
  try {
    const r = await fetch(`${API}/tutores`);
    const list = await r.json();
    if (!list.length) return;
    document.getElementById('historyCard').style.display = '';
    document.getElementById('historyList').innerHTML = list.map(ag => {
      const d = new Date(ag.data+'T12:00:00');
      return `
        <div style="display:flex;align-items:center;gap:1rem;padding:.9rem 1rem;border-radius:12px;border:1px solid rgba(28,74,50,.08);margin-bottom:.6rem;background:white">
          <div style="font-size:1.8rem">${specieEmojis[ag.animal_especie]||'🐾'}</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:.92rem">${ag.animal_nome||'—'} – ${ag.servico}</div>
            <div style="font-size:.78rem;color:#888">${d.toLocaleDateString('pt-BR')} às ${ag.horario} · ${ag.tutor_nome||'—'}</div>
          </div>
          <div style="text-align:right">
            <span style="background:#E8F5E9;color:var(--green);font-size:.75rem;font-weight:700;padding:.2rem .6rem;border-radius:50px">${ag.status}</span>
            <div style="font-weight:700;font-size:.88rem;color:var(--green);margin-top:.2rem">R$ ${ag.total||0}</div>
          </div>
        </div>`;
    }).join('');
  } catch { /* silently ignore */ }
}

// ── Init ──
loadTutores();
fetchHistory();