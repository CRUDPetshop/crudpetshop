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
		petsCache.forEach(p => {
			const opt = document.createElement('option');
			opt.value = p.id;
			opt.textContent = `${specieEmojis[p.especie]||'🐾'} ${p.nome} (${p.especie}${p.porte?' · '+p.porte:''})`;
			petSel.appendChild(opt);
		});
	} catch { showToast('Erro ao carregar pets.', true); }
	updateSummary();
});

// ── Ao selecionar pet, exibe card ──
document.getElementById('agPet').addEventListener('change', function(){
	const p = petsCache.find(p => String(p.id) === String(this.value));
	const disp = document.getElementById('petDisplay');
	if (p) {
		disp.style.display = 'block';
		disp.innerHTML = `<div class="pet-display">
		<div class="pet-display-avatar">${specieEmojis[p.especie]||'🐾'}</div>
		<div class="pet-display-info">
			<div class="name">${p.nome}</div>
			<div class="meta">${p.especie}${p.raca?' · '+p.raca:''}${p.porte?' · '+p.porte:''}${p.sexo?' · '+p.sexo:''}</div>
		</div>
		</div>`;
		document.getElementById('sumPet').textContent = p.nome;
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

// ── Agendamentos: estado e filtro ──
let allAgendamentos = [];
let activeFilter = 'todos';

function badgeClass(status){
	if (!status) return 'badge-Confirmado';
	if (status.includes('ndamento')) return 'badge-Andamento';
	if (status.includes('ncluido') || status.includes('ncluído')) return 'badge-Concluido';
	if (status.includes('ancelado')) return 'badge-Cancelado';
	return 'badge-Confirmado';
}

function renderAgendamentos(list){
	const el = document.getElementById('historyList');
	document.getElementById('agCount').textContent = list.length;
	if (!list.length){
		el.innerHTML = '<div class="ag-empty"><i class="bi bi-calendar-x"></i>Nenhum agendamento encontrado.</div>';
		return;
	}
	el.innerHTML = list.map(ag => {
		const d = new Date((ag.data||'').substring(0,10)+'T12:00:00');
		const dataFmt = isNaN(d) ? ag.data : d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
		const emoji = specieEmojis[ag.animal_especie] || '🐾';
		const bc = badgeClass(ag.status);
		const addons = (ag.addons).replace(/[{}"]/g, '').split(',');

		return `
			<div class="ag-card">
				<div class="ag-emoji">${emoji}</div>
				<div class="ag-info">
				<div class="ag-title">${ag.animal_nome||'—'} &mdash; ${ag.servico}</div>
				<div class="ag-sub">📅 ${dataFmt} às ${ag.horario} &nbsp;·&nbsp; 👤 ${ag.tutor_nome||'—'}</div>
				${addons != '' ? `<div class="ag-sub" style="margin-top:.15rem">➕ ${addons.join(', ')}.</div>` : ''}
				</div>
				<div class="ag-right">
				<span class="badge-status ${bc}">${ag.status||'Confirmado'}</span>
				<div class="ag-total">R$ ${Number(ag.total||0).toFixed(2)}</div>
				<div class="ag-actions">
					<button class="ag-btn ag-btn-edit" onclick="openEdit(${ag.id||ag.id_agendamento})">
					<i class="bi bi-pencil"></i> Editar
					</button>
					<button class="ag-btn ag-btn-delete" onclick="deleteAg(${ag.id||ag.id_agendamento})">
					<i class="bi bi-trash3"></i>
					</button>
				</div>
				</div>
			</div>
		`;
	}).join('');
}

function filterAg(filter, btn){
	activeFilter = filter;
	document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	const filtered = filter === 'todos'
		? allAgendamentos
		: allAgendamentos.filter(ag => (ag.status||'Confirmado').includes(filter));
	renderAgendamentos(filtered);
}

async function fetchHistory(){
	try {
		const r = await fetch(`${API}/agendamentos`);
		allAgendamentos = await r.json();
		const filtered = activeFilter === 'todos'
		? allAgendamentos
		: allAgendamentos.filter(ag => (ag.status||'').includes(activeFilter));
		renderAgendamentos(filtered);
	} catch { /* silently ignore */ }
}

// ── EDIT MODAL ──
function openEdit(id){
	const ag = allAgendamentos.find(a => (a.id||a.id_agendamento) == id);
	if (!ag) return;
		document.getElementById('editAgId').value      = id;
		document.getElementById('editStatus').value    = ag.status || 'Confirmado';
		document.getElementById('editPagamento').value = ag.pagamento || '';
		document.getElementById('editObs').value       = ag.obs || '';
		document.getElementById('editModal').classList.add('open');
	}

	function closeModal(){
	document.getElementById('editModal').classList.remove('open');
}

// Fecha modal clicando fora
document.getElementById('editModal').addEventListener('click', function(e){
	if (e.target === this) closeModal();
});

async function saveEdit(){
	const id  = document.getElementById('editAgId').value;
	const payload = {
		status:    document.getElementById('editStatus').value,
		pagamento: document.getElementById('editPagamento').value,
		obs:       document.getElementById('editObs').value,
	};
	const btn = document.querySelector('.btn-modal-save');
	btn.disabled = true;
	btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
	try {
		const r = await fetch(`${API}/att_agendamento/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!r.ok) throw new Error();
		closeModal();
		showToast('✅ Agendamento atualizado!');
		await fetchHistory();
	} catch {
		showToast('Erro ao atualizar agendamento.', true);
	} finally {
		btn.disabled = false;
		btn.innerHTML = '<i class="bi bi-check-circle"></i> Salvar alterações';
	}
}

// ── DELETE ──
async function deleteAg(id){
	if (!confirm('Remover este agendamento?')) return;
	try {
		const r = await fetch(`${API}/del_agendamento/${id}`, { method: 'DELETE' });
		if (!r.ok) throw new Error();
		showToast('Agendamento removido.');
		await fetchHistory();
	} catch {
		showToast('Erro ao remover agendamento.', true);
	}
}

// ── Init ──
loadTutores();
fetchHistory();