// Configuração da API
const API_URL = `${window.location.origin}/api`;

// Estado da aplicação
let editingUserId = null;

// Elementos DOM
const userForm = document.getElementById('userForm');
const userIdInput = document.getElementById('userId');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const refreshBtn = document.getElementById('refreshBtn');
const usersList = document.getElementById('usersList');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');

const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const telefoneInput = document.getElementById('telefone1');
const enderecoInput = document.getElementById('endereco');
const bairroInput = document.getElementById('bairro');
const cidadeInput = document.getElementById('cidade');
const estadoInput = document.getElementById('estado');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    userForm.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    refreshBtn.addEventListener('click', loadUsers);
}

// Carregar usuários
async function loadUsers() {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${API_URL}/pets`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }
        
        const data = await response.json();
        console.log(data)
        displayUsers(data.pets);
        
    } catch (error) {
        showError('Erro ao carregar usuários: ' + error.message);
        console.error('Erro:', error);
    } finally {
        showLoading(false);
    }
}

// Exibir usuários
function displayUsers(usuarios) {
    if (!usuarios || usuarios.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <h3>📭 Nenhum usuário cadastrado</h3>
                <p>Adicione o primeiro usuário usando o formulário acima</p>
            </div>
        `;
        return;
    }
    
    usersList.innerHTML = usuarios.map(user => `
        <div class="user-card" data-id="${user.id_tutor}">
            <div class="user-info">
                <h3>${escapeHtml(user.nome)}</h3>
                <p>✉️ ${escapeHtml(user.email)}</p>
                <p>🏙️ ${escapeHtml(user.cidade)}/${escapeHtml(user.estado)}</p>
                <p>🏠 ${escapeHtml(user.endereco)}</p>
                <p>🏘️ ${escapeHtml(user.bairro)}</p>
                <p>📞 ${escapeHtml(user.telefone1)}</p>
                <p class="user-date">📅 Criado em: ${formatDate(user.criado_em)}</p>
            </div>
            <div class="user-actions">
                <button class="btn btn-edit" onclick="editUser(${user.id_tutor})">
                    ✏️ Editar
                </button>
                <button class="btn btn-delete" onclick="deleteUser(${user.id_tutor})">
                    🗑️ Deletar
                </button>
            </div>
        </div>
    `).join('');
}

// Submeter formulário
async function handleSubmit(e) {
    e.preventDefault();
    
    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const endereco = enderecoInput.value.trim();
    const bairro = bairroInput.value.trim();
    const cidade = cidadeInput.value.trim();
    const estado = estadoInput.value.trim();
    
    if (!nome || !email) {
        showError('Por favor, preencha todos os campos');
        return;
    }
    
    const userData = { nome, email, telefone, endereco, bairro, cidade, estado };
    
    try {
        if (editingUserId) {
            await updateUser(editingUserId, userData);
        } else {
            // await createUser(userData);
            await createPets(userData);
        }
        
        resetForm();
        loadUsers();
        
    } catch (error) {
        showError('Erro ao salvar usuário: ' + error.message);
        console.error('Erro:', error);
    }
}

// Criar usuário
async function createUser(userData) {
    const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
    }
    
    return await response.json();
}

// Criar Entrada de PET
async function createPets(userData) {
    const response = await fetch(`${API_URL}/pets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar pets');
    }
    
    return await response.json();
}

// Atualizar usuário
async function updateUser(id, userData) {
    const response = await fetch(`${API_URL}/pets/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar usuário');
    }
    
    return await response.json();
}

// Editar usuário
async function editUser(id) {
    try {
        const response = await fetch(`${API_URL}/pets/${id}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar usuário');
        }
        
        const data = await response.json();
        const user = data.usuario;
        
        nomeInput.value = user.nome
        emailInput.value = user.email
        telefoneInput.value = user.telefone1
        enderecoInput.value = user.endereco
        bairroInput.value = user.bairro
        cidadeInput.value = user.cidade
        estadoInput.value = user.estado
        userIdInput.value = user.id_tutor;
        
        editingUserId = user.id_tutor;
        
        // Atualizar UI
        submitBtn.textContent = 'Atualizar Usuário';
        cancelBtn.style.display = 'inline-block';
        
        // Scroll para o formulário
        userForm.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        showError('Erro ao carregar usuário: ' + error.message);
        console.error('Erro:', error);
    }
}

// Deletar usuário
async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao deletar usuário');
        }
        
        loadUsers();
        
    } catch (error) {
        showError('Erro ao deletar usuário: ' + error.message);
        console.error('Erro:', error);
    }
}

// Cancelar edição
function cancelEdit() {
    resetForm();
}

// Resetar formulário
function resetForm() {
    userForm.reset();
    userIdInput.value = '';
    editingUserId = null;
    submitBtn.textContent = 'Adicionar Usuário';
    cancelBtn.style.display = 'none';
}

// Funções auxiliares
function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
