// URL oficial do Google Apps Script (Webhook / Exec)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzguUt8QaomXrh_CBGiwRKBDAMTkNKKrSxe7qMZuKT1pexKT9H7idvOuZwJ4-mEwXnDcg/exec";

// Estado inicial da aplicação estruturado como objeto
let state = {
    apostas: [],
    raspadinhas: [],
    transacoes: [],
    orcamento: 0
};

// Chave para armazenamento local no browser
const LOCAL_STORAGE_KEY = 'apostas_do_ze_dados';

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', async () => {
    console.log("A iniciar a aplicação Apostas do Zé (Modo Estável Híbrido)...");
    
    // 1. Carrega primeiro os dados locais para a interface aparecer instantaneamente
    carregarDadosLocais();
    
    // 2. Tenta sincronizar de imediato com a nuvem em segundo plano[cite: 1]
    await carregarDadosDaNuvem();
    
    // 3. Renderiza a interface
    renderApp();
});

// Carrega os dados guardados no localStorage do browser
function carregarDadosLocais() {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (dadosSalvos) {
        try {
            const parsed = JSON.parse(dadosSalvos);
            state = {
                apostas: parsed.apostas || [],
                raspadinhas: parsed.raspadinhas || [],
                transacoes: parsed.transacoes || [],
                orcamento: parsed.orcamento || 0
            };
        } catch (e) {
            console.error("Erro ao interpretar dados locais:", e);
        }
    }
}

// Guarda no localStorage, atualiza a interface e envia automaticamente para a Nuvem
async function guardarDados() {
    // Guarda localmente para garantir que nunca se perde nada no browser
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    
    // Atualiza imediatamente a interface visual
    renderApp();
    
    // Envia para o Google Drive em background[cite: 1]
    await guardarDadosNaNuvem();
}

// Sincroniza dados da Nuvem (Google Drive)[cite: 1]
async function carregarDadosDaNuvem() {
    try {
        const resposta = await fetch(WEB_APP_URL);
        const dadosNuvem = await resposta.json();
        
        if (dadosNuvem && !dadosNuvem.error && typeof dadosNuvem === 'object') {
            state = {
                apostas: dadosNuvem.apostas || [],
                raspadinhas: dadosNuvem.raspadinhas || [],
                transacoes: dadosNuvem.transacoes || [],
                orcamento: dadosNuvem.orcamento || 0
            };
            
            // Grava no localStorage a versão mais recente da nuvem
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
            renderApp();
            console.log("Dados sincronizados com sucesso a partir da nuvem!");
        }
    } catch (erro) {
        console.error("Aviso: Não foi possível ligar à nuvem. A usar dados locais.", erro);
    }
}

// Envia os dados atuais para o Google Apps Script gravar no Google Drive[cite: 1]
async function guardarDadosNaNuvem() {
    try {
        const payload = JSON.stringify(state);
        const urlComDados = `${WEB_APP_URL}?salvar=${encodeURIComponent(payload)}`;
        
        const resposta = await fetch(urlComDados);
        const resultado = await resposta.json();
        
        if (resultado.status === "success") {
            console.log("Dados enviados para o Google Drive com sucesso!");
        } else {
            console.error("Erro reportado pelo servidor:", resultado.error);
        }
    } catch (erro) {
        console.error("Erro ao guardar dados na nuvem:", erro);
    }
}

// ==========================================
// Funções de Gestão de Dados (Ações da App)
// ==========================================

function adicionarAposta(modalidade, equipaA, equipaB, valor, odd, estado, data) {
    state.apostas.push({ 
        id: Date.now(), 
        modalidade, 
        equipaA, 
        equipaB, 
        valor: Number(valor), 
        odd: Number(odd), 
        estado, 
        data 
    });
    guardarDados();
}

function adicionarRaspadinha(nome, custo, premio, data) {
    state.raspadinhas.push({ 
        id: Date.now(), 
        nome, 
        custo: Number(custo), 
        premio: Number(premio), 
        data 
    });
    guardarDados();
}

function adicionarTransacao(tipo, valor, data) { // 'deposito' ou 'levantamento'
    state.transacoes.push({ 
        id: Date.now(), 
        tipo, 
        valor: Number(valor), 
        data 
    });
    guardarDados();
}

function limparDadosLocaisETotais() {
    if (confirm("Tens a certeza que pretendes limpar todos os dados?")) {
        state = { apostas: [], raspadinhas: [], transacoes: [], orcamento: 0 };
        guardarDados();
    }
}

// ==========================================
// Renderização da Interface Visual
// ==========================================

function renderApp() {
    const container = document.getElementById('app-container');
    if (!container) return;

    let totalApostas = state.apostas.reduce((acc, curr) => acc + curr.valor, 0);
    let totalRaspadinhas = state.raspadinhas.reduce((acc, curr) => acc + curr.custo, 0);
    let totalPremiosRaspadinhas = state.raspadinhas.reduce((acc, curr) => acc + curr.premio, 0);
    let totalDepositos = state.transacoes.filter(t => t.tipo === 'deposito').reduce((acc, curr) => acc + curr.valor, 0);
    let totalLevantamentos = state.transacoes.filter(t => t.tipo === 'levantamento').reduce((acc, curr) => acc + curr.valor, 0);

    container.innerHTML = `
        <div class="p-6 bg-slate-900 text-white rounded-xl shadow-xl max-w-xl mx-auto space-y-4">
            <h2 class="text-2xl font-bold border-b border-slate-700 pb-2">Painel - Apostas do Zé</h2>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="bg-slate-800 p-3 rounded-lg">
                    <p class="text-slate-400">📊 Apostas (${state.apostas.length})</p>
                    <p class="text-lg font-semibold">${totalApostas.toFixed(2)}€</p>
                </div>
                <div class="bg-slate-800 p-3 rounded-lg">
                    <p class="text-slate-400">🎟️ Raspadinhas (${state.raspadinhas.length})</p>
                    <p class="text-lg font-semibold">${totalRaspadinhas.toFixed(2)}€ (Prémio: ${totalPremiosRaspadinhas.toFixed(2)}€)</p>
                </div>
                <div class="bg-slate-800 p-3 rounded-lg col-span-2">
                    <p class="text-slate-400">💰 Movimentos Financeiros</p>
                    <p class="text-sm">Depósitos: ${totalDepositos.toFixed(2)}€ | Levantamentos: ${totalLevantamentos.toFixed(2)}€</p>
                </div>
            </div>

            <div class="flex space-x-3 pt-2">
                <button onclick="carregarDadosDaNuvem()" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition">
                    🔄 Sincronizar Nuvem
                </button>
                <button onclick="limparDadosLocaisETotais()" class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition">
                    🗑️ Limpar Tudo
                </button>
            </div>
        </div>
    `;
}
