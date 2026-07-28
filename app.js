// URL oficial do Google Apps Script (Webhook / Exec)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzguUt8QaomXrh_CBGiwRKBDAMTkNKKrSxe7qMZuKT1pexKT9H7idvOuZwJ4-mEwXnDcg/exec";

// Estado inicial da aplicação
let state = {
    apostas: [],
    raspadinhas: [],
    transacoes: [], // depósitos e levantamentos
    orcamento: 0
};

// Chave para armazenamento local no browser
const LOCAL_STORAGE_KEY = 'apostas_do_ze_dados';

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', async () => {
    console.log("A iniciar a aplicação Apostas do Zé...");
    
    // 1. Tenta carregar primeiro os dados locais para resposta imediata
    carregarDadosLocais();
    
    // 2. Sincroniza em segundo plano com o Google Drive para garantir dados atualizados
    await carregarDadosDaNuvem();
    
    // 3. Renderiza a interface
    renderApp();
});

// Carrega do localStorage do browser
function carregarDadosLocais() {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (dadosSalvos) {
        try {
            state = JSON.parse(dadosSalvos);
        } catch (e) {
            console.error("Erro ao interpretar dados locais:", e);
        }
    }
}

// Guarda no localStorage e envia automaticamente para a Nuvem
async function guardarDados() {
    // Guarda localmente no browser
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    
    // Atualiza a interface visual
    renderApp();
    
    // Envia para o Google Drive em background
    await guardarDadosNaNuvem();
}

// Sincroniza dados da Nuvem (Google Drive)
async function carregarDadosDaNuvem() {
    try {
        const resposta = await fetch(WEB_APP_URL);
        const dadosNuvem = await resposta.json();
        
        if (dadosNuvem && !dadosNuvem.error && Object.keys(dadosNuvem).length > 0) {
            // Se os dados da nuvem forem válidos, atualiza o estado local
            state = dadosNuvem;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
            renderApp();
            console.log("Dados sincronizados com sucesso a partir da nuvem!");
        }
    } catch (erro) {
        console.error("Aviso: Não foi possível ligar à nuvem. A usar dados locais.", erro);
    }
}

// Envia os dados atuais para o Google Apps Script gravar no Google Drive
async function guardarDadosNaNuvem() {
    try {
        const payload = JSON.stringify(state);
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Necessário para evitar bloqueios CORS do Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: payload
        });
        console.log("Dados enviados para o Google Drive com sucesso!");
    } catch (erro) {
        console.error("Erro ao guardar dados na nuvem:", erro);
    }
}

// Funções de Gestão de Dados (Exemplos de Ações)

function adicionarAposta(modalidade, equipaA, equipaB, valor, odd, estado, data) {
    state.apostas.push({ id: Date.now(), modalidade, equipaA, equipaB, valor, odd, estado, data });
    guardarDados();
}

function adicionarRaspadinha(nome, custo, premio, data) {
    state.raspadinhas.push({ id: Date.now(), nome, custo, premio, data });
    guardarDados();
}

function adicionarTransacao(tipo, valor, data) { // 'deposito' ou 'levantamento'
    state.transacoes.push({ id: Date.now(), tipo, valor, data });
    guardarDados();
}

// Função para atualizar a interface (renderização básica dos elementos)
function renderApp() {
    const container = document.getElementById('app-container');
    if (!container) return;

    // Exemplo básico de montagem de painel de resumo
    let totalApostas = state.apostas.reduce((acc, curr) => acc + Number(curr.valor), 0);
    let totalRaspadinhas = state.raspadinhas.reduce((acc, curr) => acc + Number(curr.custo), 0);

    container.innerHTML = `
        <div class="p-4 bg-slate-900 text-white rounded-lg shadow-md">
            <h2 class="text-xl font-bold mb-2">Painel - Apostas do Zé</h2>
            <p>📊 Apostas registadas: <strong>${state.apostas.length}</strong> (Total: ${totalApostas}€)</p>
            <p>🎟️ Raspadinhas registadas: <strong>${state.raspadinhas.length}</strong> (Total: ${totalRaspadinhas}€)</p>
            <p>💰 Transações: <strong>${state.transacoes.length}</strong></p>
            <button onclick="carregarDadosDaNuvem()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold">
                🔄 Forçar Sincronização
            </button>
        </div>
    `;
}
