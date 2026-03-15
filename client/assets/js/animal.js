const API = '/api';
const specieEmojis = { Cachorro:'🐶', Gato:'🐱', Coelho:'🐰', Pássaro:'🐦', Hamster:'🐹', Peixe:'🐠', Réptil:'🦎', Outro:'🐾' };
let editPetId = null;

// ── UI helpers ──
function showToast(msg, isErr = false){
    const t = document.getElementById('toastMsg');
    document.getElementById('toastText').textContent = msg;
    t.style.background = isErr ? '#E8613C' : 'var(--green)';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function setLoading(on){
    const btn = document.querySelector('.btn-save');
    btn.disabled = on;
    btn.innerHTML = on
      ? '<span class="spinner-border spinner-border-sm"></span> Salvando...'
      : '<i class="bi bi-check-circle"></i> Salvar Animal';
}

function selectSpecie(btn){
    document.querySelectorAll('.specie-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('especie').value = btn.dataset.value;
    document.getElementById('especieError').style.display = 'none';
}

function selectPorte(btn){
    document.querySelectorAll('.porte-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('porte').value = btn.dataset.value;
}

// ── Carrega tutores no select ──
async function loadTutoresList(){
    try {
        const r = await fetch(`${API}/tutores`);
        const tutores = await r.json();
        const sel = document.getElementById('tutorId');
        // manter opção padrão
        sel.innerHTML = '<option value="">Selecione o tutor...</option>';
        tutores.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.nome} – ${t.telefone || ''}`;
        sel.appendChild(opt);
        });
    } catch {
        showToast('Erro ao carregar tutores.', true);
    }
}

function onTutorChange(){
    const id = document.getElementById('tutorId').value;
    const editBtn  = document.getElementById('btnEditarTutor');
    const stepLink = document.getElementById('stepTutorLink');
    if(id){
        const url = `tutores?edit=${id}`;
        editBtn.href  = url;
        stepLink.href = url;
        editBtn.style.display = '';
    } else {
        editBtn.style.display = 'none';
        stepLink.href = 'tutores.html';
    }
}

// ── Renderiza lista lateral ──
function renderPetList(pets){
    const list = document.getElementById('petList');
    document.getElementById('totalPets').textContent = pets.length;
    if (!pets.length){
        list.innerHTML = '<div class="no-pets"><i class="bi bi-paw"></i>Nenhum pet cadastrado ainda.</div>';
        return;
    }
    list.innerHTML = pets.map(p => `
      <div class="pet-item ${String(p.id) === String(editPetId) ? 'active' : ''}" onclick="loadPet(${p.id})">
        <div class="pet-avatar" style="background:#E8F5E9">${specieEmojis[p.especie]||'🐾'}</div>
        <div class="pet-info">
          <div class="name">${p.nome}</div>
          <div class="meta">${p.especie}${p.porte?' · '+p.porte:''}${p.tutor_nome?' · '+p.tutor_nome:''}</div>
        </div>
        <button onclick="deletePet(event,${p.id})"
          style="background:none;border:none;color:#ddd;margin-left:auto;cursor:pointer;font-size:1.1rem;"
          title="Remover"><i class="bi bi-trash3"></i></button>
      </div>`).join('');
}

// ── Busca lista de pets do servidor ──
async function fetchPetList(){
    try {
        const r = await fetch(`${API}/animais`);
        const data = await r.json();
        renderPetList(data);
    } catch {
        showToast('Erro ao carregar animais.', true);
    }
}

// ── Preenche formulário com dados do animal ──
function fillPetForm(p){
    editPetId = p.id;
    document.getElementById('tutorId').value      = p.tutor_id      || '';
    document.getElementById('petNome').value      = p.nome          || '';
    document.getElementById('raca').value         = p.raca          || '';
    document.getElementById('cor').value          = p.cor           || '';
    document.getElementById('sexo').value         = p.sexo          || '';
    document.getElementById('petNasc').value      = p.nascimento    || '';
    document.getElementById('castrado').value     = p.castrado      || '';
    document.getElementById('peso').value         = p.peso          || '';
    document.getElementById('microchip').value    = p.microchip     || '';
    document.getElementById('medicamentos').value = p.medicamentos  || '';
    document.getElementById('ultimaVacina').value = p.ultima_vacina || '';
    document.getElementById('proximaVacina').value= p.proxima_vacina|| '';
    document.getElementById('temperamento').value = p.temperamento  || '';
    document.getElementById('reacaoBanho').value  = p.reacao_banho  || '';
    document.getElementById('petObs').value       = p.obs           || '';
    document.getElementById('especie').value      = p.especie       || '';
    document.getElementById('porte').value        = p.porte         || '';
    document.querySelectorAll('.specie-btn').forEach(b =>
      b.classList.toggle('selected', b.dataset.value === p.especie));
    document.querySelectorAll('.porte-btn').forEach(b =>
      b.classList.toggle('selected', b.dataset.value === p.porte));
    const condicoes = p.condicoes ? p.condicoes.split(',') : [];
    document.querySelectorAll('[name="cond"]').forEach(c =>
      c.checked = condicoes.includes(c.value));
    onTutorChange();
}

// ── Carrega animal por ID do banco ──
async function loadPet(id){
    try {
        const r = await fetch(`${API}/animais/${id}`);
        if (!r.ok) throw new Error();
        const p = await r.json();
        fillPetForm(p);
        await fetchPetList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
        showToast('Erro ao carregar animal.', true);
    }
}

// ── Deleta animal ──
async function deletePet(e, id){
    e.stopPropagation();
    if (!confirm('Remover este animal?')) return;
    try {
        const r = await fetch(`${API}/animais/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error();
        if (String(editPetId) === String(id)) clearPetForm();
        showToast('Animal removido.');
        fetchPetList();
    } catch {
        showToast('Erro ao remover animal.', true);
    }
}

// ── Limpa formulário ──
function clearPetForm(){
    document.getElementById('petForm').reset();
    document.getElementById('petForm').classList.remove('was-validated');
    document.getElementById('especie').value = '';
    document.getElementById('porte').value   = '';
    document.querySelectorAll('.specie-btn, .porte-btn').forEach(b=>b.classList.remove('selected'));
    editPetId = null;
    fetchPetList();
}

// ── Submit ──
document.getElementById('petForm').addEventListener('submit', async function(e){
    e.preventDefault();
    this.classList.add('was-validated');

    const especie = document.getElementById('especie').value;
    if (!especie){ document.getElementById('especieError').style.display='block'; return; }
    if (!this.checkValidity()) return;

    const condicoes = [...document.querySelectorAll('[name="cond"]:checked')].map(c => c.value);

    const payload = {
        tutor_id:      document.getElementById('tutorId').value,
        especie,
        nome:          document.getElementById('petNome').value.trim(),
        raca:          document.getElementById('raca').value.trim(),
        cor:           document.getElementById('cor').value.trim(),
        sexo:          document.getElementById('sexo').value,
        nascimento:    document.getElementById('petNasc').value,
        porte:         document.getElementById('porte').value,
        castrado:      document.getElementById('castrado').value,
        peso:          document.getElementById('peso').value || null,
        microchip:     document.getElementById('microchip').value.trim(),
        condicoes,
        medicamentos:  document.getElementById('medicamentos').value.trim(),
        ultima_vacina: document.getElementById('ultimaVacina').value,
        proxima_vacina:document.getElementById('proximaVacina').value,
        temperamento:  document.getElementById('temperamento').value,
        reacao_banho:  document.getElementById('reacaoBanho').value,
        obs:           document.getElementById('petObs').value.trim(),
    };

    setLoading(true);
    try {
        const isEdit = editPetId !== null;
        const url    = isEdit ? `${API}/animais/${editPetId}` : `${API}/animais`;
        const method = isEdit ? 'PUT' : 'POST';

        const r = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!r.ok){ showToast(data.error || 'Erro ao salvar.', true); return; }

        showToast(isEdit ? '✅ Animal atualizado!' : '✅ Animal salvo com sucesso!');
        this.reset();
        this.classList.remove('was-validated');
        document.getElementById('especie').value = '';
        document.getElementById('porte').value   = '';
        document.querySelectorAll('.specie-btn, .porte-btn').forEach(b=>b.classList.remove('selected'));
        editPetId = null;
        fetchPetList();
    } catch {
        showToast('Erro de conexão com o servidor.', true);
    } finally {
        setLoading(false);
    }
});

// ── Init ──
loadTutoresList();
fetchPetList();