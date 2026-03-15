// ── CPF mask ──
document.getElementById('cpf').addEventListener('input', function(){
    let v = this.value.replace(/\D/g,'').slice(0,11);
    if(v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
    else if(v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/,'$1.$2.$3');
    else if(v.length > 3) v = v.replace(/(\d{3})(\d{3})/,'$1.$2');
    this.value = v;
});

// ── Phone mask ──
document.getElementById('telefone').addEventListener('input', function(){
    let v = this.value.replace(/\D/g,'').slice(0,11);
    if(v.length > 7) v = v.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/,'($1) $2 $3-$4');
    else if(v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
    else if(v.length > 2) v = v.replace(/(\d{2})(\d+)/,'($1) $2');
    this.value = v;
});

// ── CEP mask ──
document.getElementById('cep').addEventListener('input', function(){
    let v = this.value.replace(/\D/g,'').slice(0,8);
    if(v.length > 5) v = v.replace(/(\d{5})(\d+)/,'$1-$2');
    this.value = v;
});

// ── CEP lookup ──
function buscarCepHandler(){
    const cep = document.getElementById('cep').value.replace(/\D/g,'');
    if(cep.length !== 8){ showToast('CEP inválido!', true); return; }

    const btn = document.getElementById('buscarCep');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(r=>r.json())
        .then(d => {
            if(d.erro){ showToast('CEP não encontrado.', true); return; }

            document.getElementById('logradouro').value = d.logradouro || '';
            document.getElementById('bairro').value     = d.bairro     || '';
            document.getElementById('cidade').value     = d.localidade || '';
            document.getElementById('estado').value     = d.uf         || '';

            showToast('Endereço preenchido!');
        })
        .catch(()=>showToast('Erro ao buscar CEP.', true))
        .finally(()=>{ btn.innerHTML = '<i class="bi bi-search"></i>'; });
}

// Eventos de click para buscar o cep
document.getElementById('buscarCep').addEventListener('click', buscarCepHandler);
document.getElementById('cep').addEventListener('focusout', buscarCepHandler);

// ── API helpers ──
const API = '/api';
let editId = null; // ID do tutor em edição (vindo do banco)

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
      : '<i class="bi bi-check-circle"></i> Salvar Tutor';
}

// ── Renderiza a lista lateral ──
function renderList(tutores){
    const list = document.getElementById('tutorList');
    document.getElementById('totalCount').textContent = tutores.length;
    if (!tutores.length) {
      list.innerHTML = '<div class="no-tutores"><i class="bi bi-person-plus"></i>Nenhum tutor cadastrado ainda.</div>';
      return;
    }

    list.innerHTML = tutores.map(t => `
      <div class="tutor-item ${String(t.id) === String(editId) ? 'active' : ''}" onclick="loadTutor(${t.id})">
        <div class="tutor-avatar">${t.nome.charAt(0).toUpperCase()}</div>
        <div class="tutor-info">
          <div class="name">${t.nome}</div>
          <div class="meta"><i class="bi bi-telephone"></i> ${t.telefone || '–'}</div>
        </div>
        <button onclick="deleteTutor(event, ${t.id})"
          style="background:none;border:none;color:#ddd;margin-left:auto;cursor:pointer;font-size:1.1rem;"
          title="Remover"><i class="bi bi-trash3"></i></button>
      </div>
    `).join('');
}

// ── Busca lista do servidor ──
async function fetchList(){
    try {
      const r = await fetch(`${API}/tutores`);
      const data = await r.json();
      renderList(data.tutores);
    } catch(e) {
      showToast('Erro ao carregar tutores.', true);
    }
}

// ── Preenche formulário com dados do tutor ──
function fillForm(dadosTutor){
    console.log(dadosTutor)
    const t = dadosTutor.tutor;
    editId = t.id;
    document.getElementById('nome').value        = t.nome        || '';
    document.getElementById('cpf').value         = t.cpf         || '';
    document.getElementById('email').value       = t.email       || '';
    document.getElementById('telefone').value    = t.telefone    || '';
    document.getElementById('nascimento').value  = t.nascimento  || '';
    document.getElementById('genero').value      = t.genero      || '';
    document.getElementById('cep').value         = t.cep         || '';
    document.getElementById('logradouro').value  = t.logradouro  || '';
    document.getElementById('numero').value      = t.numero      || '';
    document.getElementById('complemento').value = t.complemento || '';
    document.getElementById('bairro').value      = t.bairro      || '';
    document.getElementById('cidade').value      = t.cidade      || '';
    document.getElementById('estado').value      = t.estado      || '';
    document.getElementById('origem').value      = t.origem      || '';
    document.getElementById('obs').value         = t.obs         || '';
}

// ── Carrega tutor por ID do banco ──
async function loadTutor(id){
    try {
      const r = await fetch(`${API}/tutores/${id}`);
      if (!r.ok) throw new Error('Não encontrado');
      const t = await r.json();
      fillForm(t);
      await fetchList(); // re-render com active correto
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {
      showToast('Erro ao carregar tutor.', true);
    }
}

// ── Deleta tutor ──
async function deleteTutor(e, id){
    e.stopPropagation();
    if (!confirm('Remover este tutor? Seus pets também serão removidos.')) return;
    try {
      const r = await fetch(`${API}/del_tutores/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      if (String(editId) === String(id)) clearForm();
      showToast('Tutor removido.');
      fetchList();
    } catch {
      showToast('Erro ao remover tutor.', true);
    }
}

// ── Limpa formulário ──
function clearForm(){
    document.getElementById('tutorForm').reset();
    document.getElementById('tutorForm').classList.remove('was-validated');
    editId = null;
    fetchList();
}

// ── Submit (criar ou atualizar) ──
document.getElementById('tutorForm').addEventListener('submit', async function(e){
    e.preventDefault();
    this.classList.add('was-validated');
    if (!this.checkValidity()) return;

    const payload = {
      nome:        document.getElementById('nome').value.trim(),
      cpf:         document.getElementById('cpf').value.trim(),
      email:       document.getElementById('email').value.trim(),
      telefone:    document.getElementById('telefone').value.trim(),
      nascimento:  document.getElementById('nascimento').value,
      genero:      document.getElementById('genero').value,
      cep:         document.getElementById('cep').value.trim(),
      logradouro:  document.getElementById('logradouro').value.trim(),
      numero:      document.getElementById('numero').value.trim(),
      complemento: document.getElementById('complemento').value.trim(),
      bairro:      document.getElementById('bairro').value.trim(),
      cidade:      document.getElementById('cidade').value.trim(),
      estado:      document.getElementById('estado').value,
      origem:      document.getElementById('origem').value,
      obs:         document.getElementById('obs').value.trim(),
    };

    setLoading(true);
    try {
      const isEdit = editId !== null;
      const url    = isEdit ? `${API}/att_tutores/${editId}` : `${API}/cad_tutores`;
      const method = isEdit ? 'PUT' : 'POST';

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await r.json();

      if(data?.error && data.error.includes('already exists')){
        showToast('O cpf informado já está sendo ultilizado, por favor verifique o cpf ou entre em contato com o suporte.', true);
        return;
      }
      
      if (!r.ok) {
        showToast(data.error || 'Erro ao salvar.', true);
        return;
      }

      showToast(isEdit ? '✅ Tutor atualizado!' : '✅ Tutor salvo com sucesso!');
      this.reset();
      this.classList.remove('was-validated');
      editId = null;
      fetchList();
    } catch {
      showToast('Erro de conexão com o servidor.', true);
    } finally {
      setLoading(false);
    }
});

// ── Init ──
fetchList();

// ── Auto-load tutor se ?edit=ID vier na URL ──
const urlParams = new URLSearchParams(window.location.search);
const editFromUrl = urlParams.get('edit');
if (editFromUrl) {
    loadTutor(editFromUrl).then(() => {
      showToast('Tutor carregado para edição!');
      setTimeout(() => {
        document.getElementById('tutorForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    });
}