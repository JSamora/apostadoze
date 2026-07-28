// URL oficial do Google Apps Script (Webhook / Exec)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzguUt8QaomXrh_CBGiwRKBDAMTkNKKrSxe7qMZuKT1pexKT9H7idvOuZwJ4-mEwXnDcg/exec";

// Estado atual da aplicação em memória
let state = {
    apostas: [],
    raspadinhas: [],
    transacoes: [],
    orcamento: 0
};

// Arranque automático: Assim que a página abre, sincroniza imediatamente com a nuvem
document.addEventListener('DOMContentLoaded', async () => {
    console.log("A iniciar a aplicação Apostas do Zé e a sincronizar com a nuvem...");
    await carregarDadosDaNuvem();
});

// Sincroniza e puxa os dados do Google Drive
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
            renderApp();
            console.log("Dados sincronizados com sucesso a partir da nuvem!");
        }
    } catch (erro) {
        console.error("Erro ao carregar dados da nuvem:", erro);
    }
}

// Envia os dados atualizados para o Google Apps Script gravar no Google Drive
async function guardarDadosNaNuvem() {
    try {
        const payload = JSON.stringify(state);
        const urlComDados = `${WEB_APP_URL}?salvar=${encodeURIComponent(payload)}`;
        
        const resposta = await fetch(urlComDados);
        const resultado = await resposta.json();
        
        if (resultado.status === "success") {
            console.log("Dados guardados na nuvem com sucesso!");
        } else {
            console.error("Erro do servidor ao guardar:", resultado.error);
        }
    } catch (erro) {
        console.error("Erro ao guardar dados na nuvem:", erro);
    }
}

// ==========================================
// Funções de Gestão de Dados (Ações)
// ==========================================

async function adicionarAposta(modalidade, equipaA, equipaB, valor, odd, estado, data) {
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
    await guardarDadosNaNuvem();
    renderApp();
}

async function adicionarRaspadinha(nome, custo, premio, data) {
    state.raspadinhas.push({ 
        id: Date.now(), 
        nome, 
        custo: Number(custo), 
        premio: Number(premio), 
        data 
    });
    await guardarDadosNaNuvem();
    renderApp();
}

async function adicionarTransacao(tipo, valor, data) { // 'deposito' ou 'levantamento'
    state.transacoes.push({ 
        id: Date.now(), 
        tipo, 
        valor: Number(valor), 
        data 
    });
    await guardarDadosNaNuvem();
    renderApp();
}

async function limparDadosNaNuvemETotais() {
    if (confirm("Tens a certeza que pretendes limpar todos os dados na nuvem?")) {
        state = { apostas: [], raspadinhas: [], transacoes: [], orcamento: 0 };
        await guardarDadosNaNuvem();
        renderApp();
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
                    🔄 Sincronizar Agora
                </button>
                <button onclick="limparDadosNaNuvemETotais()" class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition">
                    🗑️ Apagar Tudo
                </button>
            </div>
        </div>
    `;
}
