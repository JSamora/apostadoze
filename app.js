// ==========================================
// APOSTAS DO ZÉ - SCRIPT PRINCIPAL UNIFICADO
// ==========================================

const DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbzM70jBc3LfZm0FOikdPgsVs-jSjdIScdI_Y44f_mU0zDCX9EFmdUeBY5usN91mfh5vkw/exec";

let dadosApp = {
    saldoInicial: 100.00,
    apostas: [],
    raspadinhas: [],
    movimentosCaixa: []
};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    preencherDataAtual();
    inicializarDatasMesAtual();
    carregarDadosDoDrive();
});

function preencherDataAtual() {
    const hoje = new Date().toISOString().split('T')[0];
    const elAposta = document.getElementById('data-aposta');
    const elRaspadinha = document.getElementById('raspadinha-data');
    const elSub = document.getElementById('modal-sub-data');
    if (elAposta && !elAposta.value) elAposta.value = hoje;
    if (elRaspadinha && !elRaspadinha.value) elRaspadinha.value = hoje;
    if (elSub && !elSub.value) elSub.value = hoje;
}

function inicializarDatasMesAtual() {
    let hoje = new Date();
    let ano = hoje.getFullYear();
    let mes = String(hoje.getMonth() + 1).padStart(2, '0');
    let primeiroDia = `${ano}-${mes}-01`;
    let ultimoDiaObj = new Date(ano, hoje.getMonth() + 1, 0);
    let ultimoDia = `${ano}-${mes}-${String(ultimoDiaObj.getDate()).padStart(2, '0')}`;

    const elInicio = document.getElementById('grafico-data-inicio');
    const elFim = document.getElementById('grafico-data-fim');
    if (elInicio && !elInicio.value) elInicio.value = primeiroDia;
    if (elFim && !elFim.value) elFim.value = ultimoDia;
}

// -----------------------------------------
// GESTÃO DE ABAS (CORRIGIDA E COMPLETA)
// -----------------------------------------
const abasValidas = ['registo', 'raspadinhas', 'historico', 'extrato', 'graficos'];

function mudarAba(abaDestino) {
    abasValidas.forEach(aba => {
        const secao = document.getElementById(`secao-${aba}`);
        const btnTopo = document.getElementById(`tab-${aba}`);
        const btnRodape = document.getElementById(`nav-btn-${aba}`);

        if (aba === abaDestino) {
            if (secao) {
                secao.classList.remove('hidden');
                secao.classList.add('flex');
            }
            if (btnTopo) {
                btnTopo.className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
            }
            if (btnRodape) {
                btnRodape.className = "flex flex-col items-center text-emerald-400";
            }
        } else {
            if (secao) {
                secao.classList.add('hidden');
                secao.classList.remove('flex');
            }
            if (btnTopo) {
                btnTopo.className = "px-1 py-1 font-semibold text-slate-400 hover:text-slate-200 transition truncate";
            }
            if (btnRodape) {
                btnRodape.className = "flex flex-col items-center hover:text-slate-200 text-slate-400";
            }
        }
    });

    // Ações específicas ao abrir certas abas
    if (abaDestino === 'historico') {
        renderizarHistoricoCompleto();
    } else if (abaDestino === 'extrato') {
        povoarAnosFiltro();
        atualizarExtrato();
    } else if (abaDestino === 'graficos') {
        atualizarGraficoLinhas();
    }
}

// -----------------------------------------
// SINCRONIZAÇÃO COM O DRIVE / NUVEM
// -----------------------------------------
async function carregarDadosDoDrive() {
    let icon = document.getElementById('icon-sync');
    if (icon) icon.classList.add('fa-spin');
    
    try {
        let resposta = await fetch(DRIVE_API_URL);
        let dados = await resposta.json();
        
        if (Array.isArray(dados)) {
            dadosApp.apostas = dados;
        } else if (dados) {
            dadosApp.saldoInicial = dados.saldoInicial ?? 100.00;
            dadosApp.apostas = dados.apostas || [];
            dadosApp.raspadinhas = dados.raspadinhas || [];
            dadosApp.movimentosCaixa = dados.movimentosCaixa || [];
        }
    } catch (erro) {
        console.error("Erro ao carregar dados do Drive:", erro);
    } finally {
        if (icon) icon.classList.remove('fa-spin');
        renderizarTudo();
    }
}

async function guardarDadosNoDrive() {
    try {
        await fetch(DRIVE_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosApp)
        });
    } catch (erro) {
        console.error("Erro ao guardar dados no Drive:", erro);
    }
}

// -----------------------------------------
// GESTÃO DE DEFINIÇÕES E CAIXA (ENGRENAGEM)
// -----------------------------------------
function abrirConfigBanca() {
    const modal = document.getElementById('modal-definicoes');
    const inputSaldo = document.getElementById('input-saldo-inicial');
    if (inputSaldo) inputSaldo.value = dadosApp.saldoInicial;
    if (modal) modal.classList.remove('hidden');
}

function fecharConfigBanca() {
    const modal = document.getElementById('modal-definicoes');
    if (modal) modal.classList.add('hidden');
}

async function atualizarSaldoInicial() {
    const val = parseFloat(document.getElementById('input-saldo-inicial').value);
    if (!isNaN(val) && val >= 0) {
        dadosApp.saldoInicial = val;
        await guardarDadosNoDrive();
        renderizarTudo();
        alert('Saldo inicial atualizado com sucesso!');
        fecharConfigBanca();
    } else {
        alert('Por favor, insira um valor válido.');
    }
}

function abrirModalCaixaSub(tipo) {
    fecharConfigBanca();
    const modal = document.getElementById('modal-caixa-sub');
    const titulo = document.getElementById('modal-sub-titulo');
    const inputTipo = document.getElementById('modal-sub-tipo');
    const inputValor = document.getElementById('modal-sub-valor');
    
    if (inputValor) inputValor.value = '';
    preencherDataAtual();
    if (inputTipo) inputTipo.value = tipo;

    if (titulo) {
        if (tipo === 'deposito') {
            titulo.innerHTML = '<i class="fa-solid fa-arrow-down text-emerald-400"></i> Registar Depósito';
        } else {
            titulo.innerHTML = '<i class="fa-solid fa-arrow-up text-rose-400"></i> Registar Levantamento';
        }
    }

    if (modal) modal.classList.remove('hidden');
}

function voltarConfigCaixa() {
    const modalSub = document.getElementById('modal-caixa-sub');
    if (modalSub) modalSub.classList.add('hidden');
    abrirConfigBanca();
}

async function confirmarMovimentoCaixaSub() {
    const tipo = document.getElementById('modal-sub-tipo').value;
    const valor = parseFloat(document.getElementById('modal-sub-valor').value);
    const data = document.getElementById('modal-sub-data').value || new Date().toISOString().split('T')[0];

    if (isNaN(valor) || valor <= 0) {
        alert('Por favor, insira um valor válido.');
        return;
    }

    dadosApp.movimentosCaixa.push({
        tipo: 'caixa',
        subtipo: tipo,
        valor: valor,
        data: data
    });

    await guardarDadosNoDrive();
    const modalSub = document.getElementById('modal-caixa-sub');
    if (modalSub) modalSub.classList.add('hidden');
    renderizarTudo();
    alert(`${tipo === 'deposito' ? 'Depósito' : 'Levantamento'} registado com sucesso!`);
}

// -----------------------------------------
// CÁLCULOS E RENDERIZAÇÃO GLOBAL
// -----------------------------------------
function renderizarTudo() {
    calcularBancaTotal();
    renderizarRecentes();
    renderizarRaspadinhasRecentes();
    renderizarHistoricoCompleto();
    atualizarExtrato();
}

function calcularBancaTotal() {
    let banca = dadosApp.saldoInicial;

    dadosApp.apostas.forEach(a => {
        if (a.estado === 'Venceu') {
            banca += (a.valor * a.odd) - a.valor;
        } else if (a.estado === 'Perdeu') {
            banca -= a.valor;
        }
    });

    dadosApp.raspadinhas.forEach(r => {
        banca -= r.custo;
        if (r.estado === 'Premiado') {
            banca += r.premio;
        }
    });

    dadosApp.movimentosCaixa.forEach(m => {
        if (m.subtipo === 'deposito') banca += m.valor;
        if (m.subtipo === 'levantamento') banca -= m.valor;
    });

    const elBanca = document.getElementById('banca-atual');
    if (elBanca) {
        elBanca.innerText = `${banca.toFixed(2)} €`;
    }
    return banca;
}

function gerarHtmlApostaCard(aposta, originalIndex) {
    let badgeClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    let valorGanhoPerdidoStr = "---";

    if (aposta.estado === "Venceu") {
        badgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        let lucro = (aposta.valor * aposta.odd) - aposta.valor;
        valorGanhoPerdidoStr = `<span class="text-emerald-400 font-bold">+${lucro.toFixed(2)} €</span>`;
    } else if (aposta.estado === "Perdeu") {
        badgeClass = "bg-rose-500/20 text-rose-400 border-rose-500/30";
        valorGanhoPerdidoStr = `<span class="text-rose-400 font-bold">-${aposta.valor.toFixed(2)} €</span>`;
    }

    return `
        <div class="bg-slate-800 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center shrink-0">
            <div>
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] bg-slate-700 px-1 py-0.5 rounded text-slate-300 font-medium">${aposta.modalidade}</span>
                    <span class="text-xs font-bold text-white">${aposta.equipaA} vs ${aposta.equipaB}</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full border ${badgeClass}">${aposta.estado}</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Data: ${aposta.data}</span>
                    <span>Aposta: <b>${aposta.valor.toFixed(2)} €</b></span>
                    <span>ODD: <b>${aposta.odd.toFixed(2)}</b></span>
                    <span>Resultado: <b>${valorGanhoPerdidoStr}</b></span>
                </div>
            </div>
            <div class="flex gap-1">
                <button onclick="editarAposta(${originalIndex})" class="bg-slate-700 hover:bg-slate-600 text-slate-200 p-1.5 rounded-lg text-xs" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button onclick="apagarAposta(${originalIndex})" class="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 p-1.5 rounded-lg text-xs" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;
}

function renderizarRecentes() {
    const container = document.getElementById('lista-recentes');
    const contador = document.getElementById('contador-recentes');
    if (!container) return;

    let apostasComIndex = dadosApp.apostas.map((a, idx) => ({ ...a, originalIndex: idx }));
    apostasComIndex.sort((a, b) => new Date(b.data) - new Date(a.data));

    let hoje = new Date();
    let limiteDias = new Date();
    limiteDias.setDate(hoje.getDate() - 7);
    let apostasRecentes = apostasComIndex.filter(a => new Date(a.data) >= limiteDias);

    let htmlRecentes = "";
    if (apostasRecentes.length === 0) {
        htmlRecentes = `<div class="text-center py-4 text-slate-500 text-xs italic">Ainda não existem apostas nos últimos 7 dias.</div>`;
    } else {
        apostasRecentes.forEach(item => {
            htmlRecentes += gerarHtmlApostaCard(item, item.originalIndex);
        });
    }

    container.innerHTML = htmlRecentes;
    if (contador) contador.innerText = apostasRecentes.length + (apostasRecentes.length === 1 ? " registo" : " registos");
}

function renderizarRaspadinhasRecentes() {
    const container = document.getElementById('lista-raspadinhas');
    const contador = document.getElementById('contador-raspadinhas');
    if (!container) return;

    let lista = dadosApp.raspadinhas.map((r, i) => ({ ...r, originalIndex: i }))
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    if (contador) contador.innerText = `${lista.length} registos`;

    if (lista.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-slate-500 text-xs italic">Sem registos de raspadinhas.</div>';
        return;
    }

    let html = "";
    lista.forEach(r => {
        let corRes = r.estado === 'Premiado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300';
        let descRes = r.estado === 'Premiado' ? `Prémio: +${r.premio.toFixed(2)} €` : `Custo: -${r.custo.toFixed(2)} €`;

        html += `
            <div class="bg-slate-900 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center text-xs">
                <div>
                    <div class="flex items-center gap-1.5 mb-0.5">
                        <span class="text-[9px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">Raspadinha</span>
                        <span class="font-semibold text-white">${r.nome}</span>
                    </div>
                    <p class="text-[10px] text-slate-400">Data: ${r.data} | Custo: ${r.custo.toFixed(2)} €</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${corRes}">${descRes}</span>
                    <button onclick="apagarRaspadinha(${r.originalIndex})" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderizarHistoricoCompleto() {
    const container = document.getElementById('lista-historico-completo');
    const contador = document.getElementById('contador-historico');
    if (!container) return;
    
    let todos = [
        ...dadosApp.apostas.map((a, i) => ({ ...a, originType: 'aposta', originIndex: i })),
        ...dadosApp.raspadinhas.map((r, i) => ({ ...r, originType: 'raspadinha', originIndex: i })),
        ...dadosApp.movimentosCaixa.map((m, i) => ({ ...m, originType: 'caixa', originIndex: i }))
    ].sort((a, b) => new Date(b.data) - new Date(a.data));

    if (contador) contador.innerText = `${todos.length} registos`;

    if (todos.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-slate-500 text-xs italic">Histórico vazio.</div>';
        return;
    }

    let html = "";
    todos.forEach(item => {
        if (item.originType === 'aposta') {
            html += gerarHtmlApostaCard(item, item.originIndex);
        } else if (item.originType === 'raspadinha') {
            html += `
                <div class="bg-slate-900 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">Raspadinha</span>
                            <span class="font-semibold text-white">${item.nome}</span>
                        </div>
                        <p class="text-[10px] text-slate-400">${item.data} | Custo: ${item.custo.toFixed(2)} € | Estado: <span class="text-slate-200">${item.estado}</span></p>
                    </div>
                    <button onclick="apagarRaspadinha(${item.originIndex})" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
                </div>`;
        } else {
            const isDep = item.subtipo === 'deposito';
            html += `
                <div class="bg-slate-900 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="text-[9px] ${isDep ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} px-1.5 py-0.5 rounded uppercase">${item.subtipo}</span>
                            <span class="font-semibold text-white">Movimento de Caixa</span>
                        </div>
                        <p class="text-[10px] text-slate-400">${item.data} | Valor: <span class="${isDep ? 'text-emerald-400' : 'text-rose-400'} font-bold">${isDep ? '+' : '-'}${item.valor.toFixed(2)} €</span></p>
                    </div>
                    <button onclick="apagarMovimentoCaixa(${item.originIndex})" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
                </div>`;
        }
    });
    container.innerHTML = html;
}

// -----------------------------------------
// APOSTAS E RASPADINHAS (CRUD)
// -----------------------------------------
async function guardarAposta() {
    let modalidade = document.getElementById("modalidade-aposta").value;
    let equipaA = document.getElementById("equipa-a").value.trim();
    let equipaB = document.getElementById("equipa-b").value.trim();
    let valor = parseFloat(document.getElementById("valor-aposta").value);
    let odd = parseFloat(document.getElementById("odd-aposta").value);
    let estado = document.getElementById("estado-aposta").value;
    let data = document.getElementById("data-aposta").value;
    let editIndex = parseInt(document.getElementById("edit-index").value);

    if (!equipaA || !equipaB || isNaN(valor) || isNaN(odd) || !data) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    const apostaObj = { tipo: 'aposta', modalidade, equipaA, equipaB, valor, odd, estado, data };

    if (editIndex === -1) {
        dadosApp.apostas.push(apostaObj);
    } else {
        dadosApp.apostas[editIndex] = apostaObj;
        document.getElementById("edit-index").value = "-1";
        document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-plus-circle"></i> Registar Nova Aposta`;
        document.getElementById("btn-salvar").innerText = "Concluir e Registar";
    }

    document.getElementById("equipa-a").value = "";
    document.getElementById("equipa-b").value = "";
    document.getElementById("valor-aposta").value = "";
    document.getElementById("odd-aposta").value = "";
    preencherDataAtual();

    await guardarDadosNoDrive();
    renderizarTudo();
    alert('Aposta guardada com sucesso!');
}

function editarAposta(index) {
    let a = dadosApp.apostas[index];
    document.getElementById("modalidade-aposta").value = a.modalidade;
    document.getElementById("equipa-a").value = a.equipaA;
    document.getElementById("equipa-b").value = a.equipaB;
    document.getElementById("valor-aposta").value = a.valor;
    document.getElementById("odd-aposta").value = a.odd;
    document.getElementById("estado-aposta").value = a.estado;
    document.getElementById("data-aposta").value = a.data;
    document.getElementById("edit-index").value = index;

    document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-pen"></i> Editar Aposta`;
    document.getElementById("btn-salvar").innerText = "Atualizar Aposta";
    mudarAba('registo');
}

async function apagarAposta(index) {
    if (confirm("Tem certeza que deseja apagar este registo?")) {
        dadosApp.apostas.splice(index, 1);
        await guardarDadosNoDrive();
        renderizarTudo();
    }
}

function toggleValorPremio() {
    const estado = document.getElementById('raspadinha-estado').value;
    const container = document.getElementById('container-premio');
    if (container) {
        if (estado === 'Premiado') container.classList.remove('hidden');
        else container.classList.add('hidden');
    }
}

async function guardarRaspadinha() {
    const nome = document.getElementById('raspadinha-nome').value.trim();
    const custo = parseFloat(document.getElementById('raspadinha-custo').value);
    const estado = document.getElementById('raspadinha-estado').value;
    const premio = estado === 'Premiado' ? (parseFloat(document.getElementById('raspadinha-premio').value) || 0) : 0;
    const data = document.getElementById('raspadinha-data').value || new Date().toISOString().split('T')[0];

    if (!nome || isNaN(custo) || custo <= 0) {
        alert('Por favor, insira o nome e um custo válido para a raspadinha.');
        return;
    }

    dadosApp.raspadinhas.push({ tipo: 'raspadinha', nome, custo, estado, premio, data });

    await guardarDadosNoDrive();
    document.getElementById('raspadinha-nome').value = '';
    document.getElementById('raspadinha-custo').value = '';
    document.getElementById('raspadinha-premio').value = '';
    document.getElementById('raspadinha-estado').value = 'Perdido';
    toggleValorPremio();
    preencherDataAtual();
    renderizarTudo();
    alert('Raspadinha registada com sucesso!');
}

async function apagarRaspadinha(index) {
    if (confirm('Pretende apagar o registo desta raspadinha?')) {
        dadosApp.raspadinhas.splice(index, 1);
        await guardarDadosNoDrive();
        renderizarTudo();
    }
}

async function apagarMovimentoCaixa(index) {
    if (confirm('Tem a certeza que pretende apagar este movimento de caixa?')) {
        dadosApp.movimentosCaixa.splice(index, 1);
        await guardarDadosNoDrive();
        renderizarTudo();
    }
}

// -----------------------------------------
// EXTRATO E FILTROS TEMPORAIS
// -----------------------------------------
function povoarAnosFiltro() {
    const selectAno = document.getElementById('filtro-ano');
    if (!selectAno) return;
    
    let anosSet = new Set();
    dadosApp.apostas.forEach(a => { if (a.data) anosSet.add(a.data.split('-')[0]); });
    dadosApp.raspadinhas.forEach(r => { if (r.data) anosSet.add(r.data.split('-')[0]); });
    dadosApp.movimentosCaixa.forEach(m => { if (m.data) anosSet.add(m.data.split('-')[0]); });

    const anoAtual = new Date().getFullYear().toString();
    anosSet.add(anoAtual);

    const valorSelecionado = selectAno.value;
    selectAno.innerHTML = '<option value="todos">Todos</option>';
    Array.from(anosSet).sort().reverse().forEach(ano => {
        const opt = document.createElement('option');
        opt.value = ano;
        opt.innerText = ano;
        selectAno.appendChild(opt);
    });
    selectAno.value = anosSet.has(valorSelecionado) ? valorSelecionado : 'todos';
}

function atualizarExtrato() {
    const tbody = document.getElementById('tabela-extrato');
    const contadorExtrato = document.getElementById('extrato-contador');
    
    // Elementos dos Cards de Resumo (Saldo Anual/Global, Mensal, Semanal)
    const elSaldoAnual = document.getElementById('saldo-anual') || document.querySelector('.saldo-anual') || document.getElementById('card-saldo-anual');
    const elSaldoMensal = document.getElementById('saldo-mensal') || document.querySelector('.saldo-mensal') || document.getElementById('card-saldo-mensal');
    const elSaldoSemanal = document.getElementById('saldo-semanal') || document.querySelector('.saldo-semanal') || document.getElementById('card-saldo-semanal');

    if (!tbody) return;

    const filtroAno = document.getElementById('filtro-ano').value;
    const filtroMes = document.getElementById('filtro-mes').value;
    const filtroSemana = document.getElementById('filtro-semana').value;

    let transacoes = [];

    dadosApp.apostas.forEach(a => {
        if (a.estado === 'Perdeu') {
            transacoes.push({ data: a.data, desc: `Aposta Perdida: ${a.equipaA} vs ${a.equipaB}`, debito: a.valor, credito: 0, tipo: 'aposta' });
        } else if (a.estado === 'Venceu') {
            let lucro = (a.valor * a.odd) - a.valor;
            transacoes.push({ data: a.data, desc: `Aposta Vencida: ${a.equipaA} vs ${a.equipaB}`, debito: 0, credito: lucro, tipo: 'aposta' });
        }
    });

    dadosApp.raspadinhas.forEach(r => {
        transacoes.push({ data: r.data, desc: `Raspadinha: ${r.nome} (Custo)`, debito: r.custo, credito: 0, tipo: 'raspadinha' });
        if (r.estado === 'Premiado' && r.premio > 0) {
            transacoes.push({ data: r.data, desc: `Prémio Raspadinha: ${r.nome}`, debito: 0, credito: r.premio, tipo: 'raspadinha' });
        }
    });

    dadosApp.movimentosCaixa.forEach(m => {
        if (m.subtipo === 'deposito') {
            transacoes.push({ data: m.data, desc: `Depósito de Capital`, debito: 0, credito: m.valor, tipo: 'caixa' });
        } else if (m.subtipo === 'levantamento') {
            transacoes.push({ data: m.data, desc: `Levantamento de Capital`, debito: m.valor, credito: 0, tipo: 'caixa' });
        }
    });

    transacoes.sort((a, b) => new Date(a.data) - new Date(b.data));

    // Cálculo dos totais para os cartões de resumo superior (Anual/Global, Mensal, Semanal)
    let totalAnual = 0;
    let totalMensal = 0;
    let totalSemanal = 0;

    const agora = new Date();
    const anoAtualStr = agora.getFullYear().toString();
    const mesAtualNum = agora.getMonth() + 1;
    const diaAtualNum = agora.getDate();
    const semanaAtualNum = diaAtualNum <= 7 ? 1 : diaAtualNum <= 14 ? 2 : diaAtualNum <= 21 ? 3 : 4;

    transacoes.forEach(t => {
        if (!t.data) return;
        const [tAno, tMes, tDia] = t.data.split('-');
        const tVal = t.credito - t.debito;

        // Se o filtro for 'Todos', acumula o global histórico de todos os anos
        if (filtroAno === 'todos' || tAno === filtroAno) {
            totalAnual += tVal;
        }

        const anoAlvo = filtroAno !== 'todos' ? filtroAno : anoAtualStr;
        const mesAlvo = filtroMes !== 'todos' ? parseInt(filtroMes) : mesAtualNum;
        if (tAno === anoAlvo && parseInt(tMes) === mesAlvo) {
            totalMensal += tVal;
        }

        const dNum = parseInt(tDia);
        const tSemana = dNum <= 7 ? 1 : dNum <= 14 ? 2 : dNum <= 21 ? 3 : 4;
        const semanaAlvo = filtroSemana !== 'todas' ? parseInt(filtroSemana) : semanaAtualNum;
        if (tAno === anoAlvo && parseInt(tMes) === mesAlvo && tSemana === semanaAlvo) {
            totalSemanal += tVal;
        }
    });

    if (elSaldoAnual) {
        elSaldoAnual.innerText = `${totalAnual >= 0 ? '+' : ''}${totalAnual.toFixed(2)} €`;
        elSaldoAnual.className = `text-center font-bold text-base ${totalAnual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elSaldoMensal) {
        elSaldoMensal.innerText = `${totalMensal >= 0 ? '+' : ''}${totalMensal.toFixed(2)} €`;
        elSaldoMensal.className = `text-center font-bold text-base ${totalMensal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elSaldoSemanal) {
        elSaldoSemanal.innerText = `${totalSemanal >= 0 ? '+' : ''}${totalSemanal.toFixed(2)} €`;
        elSaldoSemanal.className = `text-center font-bold text-base ${totalSemanal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }

    let filtradas = transacoes.filter(t => {
        if (!t.data) return false;
        const [ano, mes, dia] = t.data.split('-');
        if (filtroAno !== 'todos' && ano !== filtroAno) return false;
        if (filtroMes !== 'todos' && parseInt(mes) !== parseInt(filtroMes)) return false;
        if (filtroSemana !== 'todas') {
            const dNum = parseInt(dia);
            const sem = dNum <= 7 ? 1 : dNum <= 14 ? 2 : dNum <= 21 ? 3 : 4;
            if (sem !== parseInt(filtroSemana)) return false;
        }
        return true;
    });

    let htmlExtrato = `
        <tr class="border-b border-slate-800 bg-slate-900/40">
            <td class="py-1 px-1 text-slate-300 font-medium">Banca Inicial Configurada</td>
            <td class="py-1 px-1 text-slate-500">-</td>
            <td class="py-1 px-1 text-emerald-400">+${dadosApp.saldoInicial.toFixed(2)} €</td>
            <td class="py-1 px-1 text-right font-bold text-white">${dadosApp.saldoInicial.toFixed(2)} €</td>
        </tr>
    `;

    let acumulado = dadosApp.saldoInicial;
    let movimentosTotais = 0;

    filtradas.forEach(t => {
        movimentosTotais++;
        acumulado += (t.credito - t.debito);
        let debitoStr = t.debito > 0 ? `-${t.debito.toFixed(2)} €` : "-";
        let creditoStr = t.credito > 0 ? `+${t.credito.toFixed(2)} €` : "-";

        htmlExtrato += `
            <tr class="border-b border-slate-800">
                <td class="py-1 px-1"><b>${t.data}</b><br><span class="text-[8px] text-slate-400">${t.desc}</span></td>
                <td class="py-1 px-1 text-rose-400">${debitoStr}</td>
                <td class="py-1 px-1 text-emerald-400">${creditoStr}</td>
                <td class="py-1 px-1 text-right font-bold ${acumulado >= dadosApp.saldoInicial ? 'text-emerald-400' : 'text-rose-400'}">${acumulado.toFixed(2)} €</td>
            </tr>
        `;
    });

    tbody.innerHTML = htmlExtrato;
    if (contadorExtrato) contadorExtrato.innerText = `${movimentosTotais} movimentos`;
}

// -----------------------------------------
// GRÁFICOS DE LINHAS DA BANCA
// -----------------------------------------
function atualizarGraficoLinhas() {
    let container = document.getElementById("grafico-linhas-svg-container");
    let labelsContainer = document.getElementById("grafico-eixo-x-labels");
    if (!container || !labelsContainer) return;

    let dataInicioStr = document.getElementById('grafico-data-inicio').value;
    let dataFimStr = document.getElementById('grafico-data-fim').value;

    if (!dataInicioStr || !dataFimStr) {
        container.innerHTML = `<div class="w-full text-center text-slate-500 text-xs italic my-auto">Selecione o intervalo de datas.</div>`;
        return;
    }

    let saldoCorrente = dadosApp.saldoInicial;
    let transacoes = [];

    dadosApp.apostas.forEach(a => {
        if (a.estado === 'Perdeu') transacoes.push({ data: a.data, val: -a.valor });
        if (a.estado === 'Venceu') transacoes.push({ data: a.data, val: (a.valor * a.odd) - a.valor });
    });
    dadosApp.raspadinhas.forEach(r => {
        transacoes.push({ data: r.data, val: -r.custo });
        if (r.estado === 'Premiado') transacoes.push({ data: r.data, val: r.premio });
    });
    dadosApp.movimentosCaixa.forEach(m => {
        transacoes.push({ data: m.data, val: m.subtipo === 'deposito' ? m.valor : -m.valor });
    });

    transacoes.sort((a, b) => new Date(a.data) - new Date(b.data));

    transacoes.forEach(t => {
        if (t.data < dataInicioStr) {
            saldoCorrente += t.val;
        }
    });

    let pontosGrafico = [];
    let minBanca = dadosApp.saldoInicial;
    let maxBanca = dadosApp.saldoInicial;
    let impactoPorData = {};

    transacoes.forEach(t => {
        if (t.data >= dataInicioStr && t.data <= dataFimStr) {
            if (!impactoPorData[t.data]) impactoPorData[t.data] = 0;
            impactoPorData[t.data] += t.val;
        }
    });

    let datasComMovimento = Object.keys(impactoPorData).sort();

    if (datasComMovimento.length === 0) {
        container.innerHTML = `<div class="w-full text-center text-slate-500 text-xs italic my-auto">Sem registos neste intervalo.</div>`;
        labelsContainer.innerHTML = `<span>${dataInicioStr}</span><span>${dataFimStr}</span>`;
        return;
    }

    datasComMovimento.forEach(dataStr => {
        saldoCorrente += impactoPorData[dataStr];
        pontosGrafico.push({ data: dataStr, saldo: saldoCorrente });
        if (saldoCorrente < minBanca) minBanca = saldoCorrente;
        if (saldoCorrente > maxBanca) maxBanca = saldoCorrente;
    });

    minBanca = Math.floor(minBanca / 5) * 5;
    maxBanca = Math.ceil(maxBanca / 5) * 5;
    if (minBanca === maxBanca) maxBanca += 5;

    let spanBanca = maxBanca - minBanca;
    let svgWidth = 360;
    let svgHeight = 110;
    let pontosSvg = "";
    let passosX = pontosGrafico.length > 1 ? svgWidth / (pontosGrafico.length - 1) : svgWidth / 2;

    pontosGrafico.forEach((item, index) => {
        let x = pontosGrafico.length === 1 ? svgWidth / 2 : index * passosX;
        let y = svgHeight - ((item.saldo - minBanca) / spanBanca) * (svgHeight - 16) - 8;
        pontosSvg += `${x},${y} `;
    });

    let yPosBancaInicial = svgHeight - ((dadosApp.saldoInicial - minBanca) / spanBanca) * (svgHeight - 16) - 8;
    let linhasGrelhaSvg = `<line x1="0" y1="${yPosBancaInicial}" x2="${svgWidth}" y2="${yPosBancaInicial}" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="4,4" />`;

    container.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-full overflow-visible">
            ${linhasGrelhaSvg}
            <polyline fill="none" stroke="#10b981" stroke-width="2.5" points="${pontosSvg}" stroke-linecap="round" stroke-linejoin="round" />
            ${pontosGrafico.map((item, index) => {
                let x = pontosGrafico.length === 1 ? svgWidth / 2 : index * passosX;
                let y = svgHeight - ((item.saldo - minBanca) / spanBanca) * (svgHeight - 16) - 8;
                let corPonto = item.saldo < dadosApp.saldoInicial ? '#f43f5e' : '#34d399';
                return `<circle cx="${x}" cy="${y}" r="3.5" fill="${corPonto}" class="cursor-pointer">
                    <title>${item.data}: ${item.saldo.toFixed(2)}€</title>
                </circle>`;
            }).join('')}
        </svg>
    `;
    labelsContainer.innerHTML = `<span>${pontosGrafico[0].data}</span><span>${pontosGrafico[pontosGrafico.length - 1].data}</span>`;
}

// Inicializar aba padrão ativa ao arrancar
mudarAba('registo');
