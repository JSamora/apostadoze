// ==========================================
// APOSTAS DO ZÉ - SCRIPT PRINCIPAL UNIFICADO
// ==========================================

let dadosApp = {
    saldoInicial: 100.00,
    apostas: [],
    raspadinhas: [],
    movimentosCaixa: [] // Depósitos e Levantamentos
};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosLocais();
    preencherDataAtual();
    renderizarTudo();
});

function preencherDataAtual() {
    const hoje = new Date().toISOString().split('T')[0];
    const elAposta = document.getElementById('data-aposta');
    const elRaspadinha = document.getElementById('raspadinha-data');
    const elCaixa = document.getElementById('modal-caixa-data');
    if (elAposta && !elAposta.value) elAposta.value = hoje;
    if (elRaspadinha && !elRaspadinha.value) elRaspadinha.value = hoje;
    if (elCaixa && !elCaixa.value) elCaixa.value = hoje;
}

// Gestão de Abas
const abasValidas = ['registo', 'raspadinhas', 'historico', 'extrato', 'graficos'];
function mudarAba(abaDestino) {
    abasValidas.forEach(aba => {
        const secao = document.getElementById(`secao-${aba}`);
        const btnTopo = document.getElementById(`tab-${aba}`);
        const btnRodape = document.getElementById(`nav-btn-${aba}`);

        if (aba === abaDestino) {
            if (secao) secao.classList.remove('hidden');
            if (btnTopo) {
                btnTopo.classList.add('text-emerald-400', 'border-b-2', 'border-emerald-400');
                btnTopo.classList.remove('text-slate-400');
            }
            if (btnRodape) {
                btnRodape.classList.add('text-emerald-400');
                btnRodape.classList.remove('text-slate-400');
            }
        } else {
            if (secao) secao.classList.add('hidden');
            if (btnTopo) {
                btnTopo.classList.remove('text-emerald-400', 'border-b-2', 'border-emerald-400');
                btnTopo.classList.add('text-slate-400');
            }
            if (btnRodape) {
                btnRodape.classList.remove('text-emerald-400');
                btnRodape.classList.add('text-slate-400');
            }
        }
    });
}

// Armazenamento Local (Offline-First)
function carregarDadosLocais() {
    const salvo = localStorage.getItem('apostas_do_ze_dados');
    if (salvo) {
        try {
            const parsed = JSON.parse(salvo);
            dadosApp.saldoInicial = parsed.saldoInicial ?? 100.00;
            dadosApp.apostas = parsed.apostas || [];
            dadosApp.raspadinhas = parsed.raspadinhas || [];
            dadosApp.movimentosCaixa = parsed.movimentosCaixa || [];
        } catch (e) {
            console.error('Erro ao carregar dados locais:', e);
        }
    }
}

function guardarDadosLocais() {
    localStorage.setItem('apostas_do_ze_dados', JSON.stringify(dadosApp));
}

// Simulação de Sincronização com o Drive / Nuvem
function carregarDadosDoDrive() {
    const icon = document.getElementById('icon-sync');
    if (icon) icon.classList.add('fa-spin');
    
    setTimeout(() => {
        carregarDadosLocais();
        renderizarTudo();
        if (icon) icon.classList.remove('fa-spin');
        alert('Dados sincronizados com sucesso!');
    }, 800);
}

// Definições / Banca / Saldo Inicial
function abrirConfigBanca() {
    const novoSaldo = prompt('Insira o valor do Saldo Inicial base (€):', dadosApp.saldoInicial);
    if (novoSaldo !== null) {
        const val = parseFloat(novoSaldo);
        if (!isNaN(val) && val >= 0) {
            dadosApp.saldoInicial = val;
            guardarDadosLocais();
            renderizarTudo();
            alert('Saldo inicial atualizado com sucesso!');
        } else {
            alert('Valor inválido.');
        }
    }
}

// Controlo do Modal de Depósito e Levantamento
function abrirModalCaixa(tipo) {
    const modal = document.getElementById('modal-caixa');
    const titulo = document.getElementById('modal-caixa-titulo');
    const inputTipo = document.getElementById('modal-caixa-tipo');
    const inputValor = document.getElementById('modal-caixa-valor');
    
    inputValor.value = '';
    preencherDataAtual();
    inputTipo.value = tipo;

    if (tipo === 'deposito') {
        titulo.innerHTML = '<i class="fa-solid fa-arrow-down text-emerald-400"></i> Registar Depósito';
    } else {
        titulo.innerHTML = '<i class="fa-solid fa-arrow-up text-rose-400"></i> Registar Levantamento';
    }

    if (modal) modal.classList.remove('hidden');
}

function fecharModalCaixa() {
    const modal = document.getElementById('modal-caixa');
    if (modal) modal.classList.add('hidden');
}

function confirmarMovimentoCaixa() {
    const tipo = document.getElementById('modal-caixa-tipo').value;
    const valor = parseFloat(document.getElementById('modal-caixa-valor').value);
    const data = document.getElementById('modal-caixa-data').value || new Date().toISOString().split('T')[0];

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

    guardarDadosLocais();
    fecharModalCaixa();
    renderizarTudo();
    alert(`${tipo === 'deposito' ? 'Depósito' : 'Levantamento'} registado com sucesso!`);
}

function apagarMovimentoCaixa(index) {
    if (confirm('Tem a certeza que pretende apagar este movimento de caixa?')) {
        dadosApp.movimentosCaixa.splice(index, 1);
        guardarDadosLocais();
        renderizarTudo();
    }
}

// -----------------------------------------
// GESTÃO DE APOSTAS
// -----------------------------------------
function guardarAposta() {
    const modalidade = document.getElementById('modalidade-aposta').value;
    const estado = document.getElementById('estado-aposta').value;
    const equipaA = document.getElementById('equipa-a').value.trim();
    const equipaB = document.getElementById('equipa-b').value.trim();
    const valor = parseFloat(document.getElementById('valor-aposta').value);
    const odd = parseFloat(document.getElementById('odd-aposta').value);
    const data = document.getElementById('data-aposta').value || new Date().toISOString().split('T')[0];
    const editIndex = parseInt(document.getElementById('edit-index').value);

    if (!equipaA || !equipaB || isNaN(valor) || valor <= 0 || isNaN(odd) || odd <= 1) {
        alert('Por favor, preencha todos os campos corretamente (ODD deve ser superior a 1.0).');
        return;
    }

    const apostaObj = {
        tipo: 'aposta',
        modalidade,
        estado,
        equipaA,
        equipaB,
        valor,
        odd,
        data,
        retornoPotencial: valor * odd
    };

    if (editIndex > -1) {
        dadosApp.apostas[editIndex] = apostaObj;
        document.getElementById('edit-index').value = -1;
        document.getElementById('form-title').innerHTML = '<i class="fa-solid fa-plus-circle"></i> Registar Nova Aposta';
        document.getElementById('btn-salvar').innerText = 'Concluir e Registar';
    } else {
        dadosApp.apostas.push(apostaObj);
    }

    guardarDadosLocais();
    limparFormularioAposta();
    renderizarTudo();
    alert('Aposta guardada com sucesso!');
}

function limparFormularioAposta() {
    document.getElementById('equipa-a').value = '';
    document.getElementById('equipa-b').value = '';
    document.getElementById('valor-aposta').value = '';
    document.getElementById('odd-aposta').value = '';
    preencherDataAtual();
}

function editarAposta(index) {
    const a = dadosApp.apostas[index];
    if (!a) return;
    document.getElementById('modalidade-aposta').value = a.modalidade;
    document.getElementById('estado-aposta').value = a.estado;
    document.getElementById('equipa-a').value = a.equipaA;
    document.getElementById('equipa-b').value = a.equipaB;
    document.getElementById('valor-aposta').value = a.valor;
    document.getElementById('odd-aposta').value = a.odd;
    document.getElementById('data-aposta').value = a.data;
    document.getElementById('edit-index').value = index;
    
    document.getElementById('form-title').innerHTML = '<i class="fa-solid fa-pen"></i> Editar Aposta';
    document.getElementById('btn-salvar').innerText = 'Atualizar Aposta';
    mudarAba('registo');
}

function apagarAposta(index) {
    if (confirm('Tem a certeza que pretende apagar esta aposta?')) {
        dadosApp.apostas.splice(index, 1);
        guardarDadosLocais();
        renderizarTudo();
    }
}

// -----------------------------------------
// GESTÃO DE RASPADINHAS
// -----------------------------------------
function toggleValorPremio() {
    const estado = document.getElementById('raspadinha-estado').value;
    const container = document.getElementById('container-premio');
    if (estado === 'Premiado') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function guardarRaspadinha() {
    const nome = document.getElementById('raspadinha-nome').value.trim();
    const custo = parseFloat(document.getElementById('raspadinha-custo').value);
    const estado = document.getElementById('raspadinha-estado').value;
    const premio = estado === 'Premiado' ? (parseFloat(document.getElementById('raspadinha-premio').value) || 0) : 0;
    const data = document.getElementById('raspadinha-data').value || new Date().toISOString().split('T')[0];

    if (!nome || isNaN(custo) || custo <= 0) {
        alert('Por favor, insira o nome e um custo válido para a raspadinha.');
        return;
    }

    dadosApp.raspadinhas.push({
        tipo: 'raspadinha',
        nome,
        custo,
        estado,
        premio,
        data
    });

    guardarDadosLocais();
    document.getElementById('raspadinha-nome').value = '';
    document.getElementById('raspadinha-custo').value = '';
    document.getElementById('raspadinha-premio').value = '';
    document.getElementById('raspadinha-estado').value = 'Perdido';
    toggleValorPremio();
    preencherDataAtual();
    renderizarTudo();
    alert('Raspadinha registada com sucesso!');
}

function apagarRaspadinha(index) {
    if (confirm('Pretende apagar o registo desta raspadinha?')) {
        dadosApp.raspadinhas.splice(index, 1);
        guardarDadosLocais();
        renderizarTudo();
    }
}

// -----------------------------------------
// RENDERIZAÇÃO E CÁLCULOS GLOBAIS
// -----------------------------------------
function renderizarTudo() {
    calcularBancaTotal();
    renderizarRecentes();
    renderizarRaspadinhasRecentes();
    renderizarHistoricoCompleto();
    povoarAnosFiltro();
    atualizarExtrato();
    atualizarGraficoLinhas();
}

function calcularBancaTotal() {
    let banca = dadosApp.saldoInicial;

    // Processar apostas
    dadosApp.apostas.forEach(a => {
        if (a.estado === 'Venceu') {
            banca += (a.valor * a.odd) - a.valor; // Lucro líquido
        } else if (a.estado === 'Perdeu') {
            banca -= a.valor;
        }
    });

    // Processar raspadinhas
    dadosApp.raspadinhas.forEach(r => {
        banca -= r.custo;
        if (r.estado === 'Premiado') {
            banca += r.premio;
        }
    });

    // Processar movimentos de caixa
    dadosApp.movimentosCaixa.forEach(m => {
        if (m.subtipo === 'deposito') banca += m.valor;
        if (m.subtipo === 'levantamento') banca -= m.valor;
    });

    const elBanca = document.getElementById('banca-atual');
    if (elBanca) {
        elBanca.innerText = `${banca.toFixed(2)} €`;
    }
}

function renderizarRecentes() {
    const container = document.getElementById('lista-recentes');
    const contador = document.getElementById('contador-recentes');
    if (!container) return;

    container.innerHTML = '';
    const hoje = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);

    const recentes = dadosApp.apostas.map((a, index) => ({ ...a, originalIndex: index }))
        .filter(a => new Date(a.data) >= seteDiasAtras)
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    if (contador) contador.innerText = `${recentes.length} registos`;

    if (recentes.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-slate-500 text-xs italic">Sem apostas recentes nos últimos 7 dias.</div>';
        return;
    }

    recentes.forEach(a => {
        let corEstado = 'bg-amber-500/20 text-amber-300';
        let textoRes = 'Pendente';
        if (a.estado === 'Venceu') {
            corEstado = 'bg-emerald-500/20 text-emerald-300';
            textoRes = `+${(a.valor * a.odd - a.valor).toFixed(2)} €`;
        } else if (a.estado === 'Perdeu') {
            corEstado = 'bg-rose-500/20 text-rose-300';
            textoRes = `-${a.valor.toFixed(2)} €`;
        }

        const card = document.createElement('div');
        card.className = 'bg-slate-900 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center text-xs';
        card.innerHTML = `
            <div>
                <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">${a.modalidade}</span>
                    <span class="font-semibold text-white">${a.equipaA} vs ${a.equipaB}</span>
                </div>
                <p class="text-[10px] text-slate-400">Data: ${a.data} | Aposta: ${a.valor.toFixed(2)} € | ODD: ${a.odd}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${corEstado}">${textoRes}</span>
                <button onclick="editarAposta(${a.originalIndex})" class="text-slate-400 hover:text-emerald-400 p-1"><i class="fa-solid fa-pen"></i></button>
                <button onclick="apagarAposta(${a.originalIndex})" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderizarRaspadinhasRecentes() {
    const container = document.getElementById('lista-raspadinhas');
    const contador = document.getElementById('contador-raspadinhas');
    if (!container) return;

    container.innerHTML = '';
    const lista = dadosApp.raspadinhas.map((r, index) => ({ ...r, originalIndex: index }))
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    if (contador) contador.innerText = `${lista.length} registos`;

    if (lista.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-slate-500 text-xs italic">Sem registos de raspadinhas.</div>';
        return;
    }

    lista.forEach(r => {
        let corRes = r.estado === 'Premiado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300';
        let descRes = r.estado === 'Premiado' ? `Prémio: +${r.premio.toFixed(2)} €` : `Custo: -${r.custo.toFixed(2)} €`;

        const card = document.createElement('div');
        card.className = 'bg-slate-900 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center text-xs';
        card.innerHTML = `
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
        `;
        container.appendChild(card);
    });
}

function renderizarHistoricoCompleto() {
    const container = document.getElementById('lista-historico-completo');
    const contador = document.getElementById('contador-historico');
    if (!container) return;

    container.innerHTML = '';
    
    // Unificar apostas, raspadinhas e movimentos de caixa para o histórico
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

    todos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-slate-900 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center text-xs';
        
        if (item.originType === 'aposta') {
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-1.5 mb-0.5">
                        <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Aposta (${item.modalidade})</span>
                        <span class="font-semibold text-white">${item.equipaA} vs ${item.equipaB}</span>
                    </div>
                    <p class="text-[10px] text-slate-400">${item.data} | Valor: ${item.valor.toFixed(2)} € | ODD: ${item.odd} | Estado: <span class="text-slate-200">${item.estado}</span></p>
                </div>
                <button onclick="apagarAposta(${item.originIndex})" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            `;
        } else if (item.originType === 'raspadinha') {
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-1.5 mb-0.5">
                        <span class="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">Raspadinha</span>
                        <span class="font-semibold text-white">${item.nome}</span>
                    </div>
                    <p class="text-[10px] text-slate-400">${item.data} | Custo: ${item.custo.toFixed(2)} € | Estado: <span class="text-slate-200">${item.estado}</span> ${item.estado === 'Premiado' ? `(Prémio: ${item.premio.toFixed(2)}€)` : ''}</p>
                </div>
                <button onclick="apagarRaspadinha(${item.originIndex})" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            `;
        } else {
            const isDep = item.subtipo === 'deposito';
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-1.5 mb-0.5">
                        <span class="text-[9px] ${isDep ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} px-1.5 py-0.5 rounded uppercase">${item.subtipo}</span>
                        <span class="font-semibold text-white">Movimento de Caixa</span>
                    </div>
                    <p class="text-[10px] text-slate-400">${item.data} | Valor: <span class="${isDep ? 'text-emerald-400' : 'text-rose-400'} font-bold">${isDep ? '+' : '-'}${item.valor.toFixed(2)} €</span></p>
                </div>
                <button onclick="apagarMovimentoCaixa(${item.originIndex})" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash"></i></button>
            `;
        }
        container.appendChild(card);
    });
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
    if (!tbody) return;

    const filtroAno = document.getElementById('filtro-ano').value;
    const filtroMes = document.getElementById('filtro-mes').value;
    const filtroSemana = document.getElementById('filtro-semana').value;

    let transacoes = [];

    dadosApp.apostas.forEach(a => {
        if (a.estado === 'Perdido') {
            transacoes.push({ data: a.data, desc: `Aposta Perdida: ${a.equipaA} vs ${a.equipaB}`, debito: a.valor, credito: 0 });
        } else if (a.estado === 'Venceu') {
            transacoes.push({ data: a.data, desc: `Aposta Vencida: ${a.equipaA} vs ${a.equipaB}`, debito: 0, credito: (a.valor * a.odd) - a.valor });
        }
    });

    dadosApp.raspadinhas.forEach(r => {
        transacoes.push({ data: r.data, desc: `Raspadinha: ${r.nome} (Custo)`, debito: r.custo, credito: 0 });
        if (r.estado === 'Premiado' && r.premio > 0) {
            transacoes.push({ data: r.data, desc: `Prémio Raspadinha: ${r.nome}`, debito: 0, credito: r.premio });
        }
    });

    dadosApp.movimentosCaixa.forEach(m => {
        if (m.subtipo === 'deposito') {
            transacoes.push({ data: m.data, desc: `Depósito de Capital`, debito: 0, credito: m.valor });
        } else if (m.subtipo === 'levantamento') {
            transacoes.push({ data: m.data, desc: `Levantamento de Capital`, debito: m.valor, credito: 0 });
        }
    });

    transacoes.sort((a, b) => new Date(a.data) - new Date(b.data));

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

    tbody.innerHTML = '';
    let acumulado = dadosApp.saldoInicial;
    let movimentosTotais = 0;

    filtradas.forEach(t => {
        movimentosTotais++;
        acumulado += (t.credito - t.debito);

        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-700/50 hover:bg-slate-700/30';
        tr.innerHTML = `
            <td class="py-2 px-1">
                <div class="font-medium text-white">${t.desc}</div>
                <div class="text-[9px] text-slate-400">${t.data}</div>
            </td>
            <td class="py-2 px-1 text-rose-400 font-semibold">${t.debito > 0 ? `-${t.debito.toFixed(2)} €` : '-'}</td>
            <td class="py-2 px-1 text-emerald-400 font-semibold">${t.credito > 0 ? `+${t.credito.toFixed(2)} €` : '-'}</td>
            <td class="py-2 px-1 text-right font-bold text-slate-200">${acumulado.toFixed(2)} €</td>
        `;
        tbody.appendChild(tr);
    });

    if (contadorExtrato) contadorExtrato.innerText = `${movimentosTotais} movimentos`;

    atualizarSaldosTemporais(transacoes);
}

function atualizarSaldosTemporais(transacoes) {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear().toString();
    const mesAtual = hoje.getMonth() + 1;

    let saldoAnual = 0;
    let saldoMensal = 0;
    let saldoSemanal = 0;

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);

    transacoes.forEach(t => {
        if (!t.data) return;
        const [ano, mes, dia] = t.data.split('-');
        const tDate = new Date(t.data);
        const diff = t.credito - t.debito;

        if (ano === anoAtual) {
            saldoAnual += diff;
            if (parseInt(mes) === mesAtual) {
                saldoMensal += diff;
            }
        }
        if (tDate >= seteDiasAtras) {
            saldoSemanal += diff;
        }
    });

    const elAnual = document.getElementById('saldo-anual');
    const elMensal = document.getElementById('saldo-mensal');
    const elSemanal = document.getElementById('saldo-semanal');

    if (elAnual) {
        elAnual.innerText = `${saldoAnual >= 0 ? '+' : ''}${saldoAnual.toFixed(2)} €`;
        elAnual.className = `text-xs font-bold mt-0.5 ${saldoAnual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elMensal) {
        elMensal.innerText = `${saldoMensal >= 0 ? '+' : ''}${saldoMensal.toFixed(2)} €`;
        elMensal.className = `text-xs font-bold mt-0.5 ${saldoMensal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elSemanal) {
        elSemanal.innerText = `${saldoSemanal >= 0 ? '+' : ''}${saldoSemanal.toFixed(2)} €`;
        elSemanal.className = `text-xs font-bold mt-0.5 ${saldoSemanal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
}

function gerarPdfExtrato() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Extrato - Apostas do Zé", 14, 20);
    doc.setFontSize(10);
    doc.text(`Saldo Inicial Base: ${dadosApp.saldoInicial.toFixed(2)} EUR`, 14, 28);
    
    let y = 38;
    doc.text("Data | Descrição | Débito | Crédito", 14, y);
    doc.line(14, y + 2, 196, y + 2);
    
    let acumulado = dadosApp.saldoInicial;
    let transacoes = [];

    dadosApp.apostas.forEach(a => {
        if (a.estado === 'Perdido') transacoes.push({ data: a.data, desc: `Aposta Perdida: ${a.equipaA} vs ${a.equipaB}`, debito: a.valor, credito: 0 });
        if (a.estado === 'Venceu') transacoes.push({ data: a.data, desc: `Aposta Vencida: ${a.equipaA} vs ${a.equipaB}`, debito: 0, credito: (a.valor * a.odd) - a.valor });
    });
    dadosApp.raspadinhas.forEach(r => {
        transacoes.push({ data: r.data, desc: `Raspadinha: ${r.nome}`, debito: r.custo, credito: 0 });
        if (r.estado === 'Premiado') transacoes.push({ data: r.data, desc: `Prémio Raspadinha: ${r.nome}`, debito: 0, credito: r.premio });
    });
    dadosApp.movimentosCaixa.forEach(m => {
        if (m.subtipo === 'deposito') transacoes.push({ data: m.data, desc: `Depósito de Capital`, debito: 0, credito: m.valor });
        if (m.subtipo === 'levantamento') transacoes.push({ data: m.data, desc: `Levantamento de Capital`, debito: m.valor, credito: 0 });
    });
    
    transacoes.sort((a, b) => new Date(a.data) - new Date(b.data));

    transacoes.forEach(t => {
        y += 8;
        if (y > 280) { doc.addPage(); y = 20; }
        acumulado += (t.credito - t.debito);
        doc.text(`${t.data} | ${t.desc} | -${t.debito.toFixed(2)} | +${t.credito.toFixed(2)}`, 14, y);
    });

    doc.save("extrato-apostas-do-ze.pdf");
}

// -----------------------------------------
// GRÁFICOS DE LINHAS DA BANCA
// -----------------------------------------
function atualizarGraficoLinhas() {
    const container = document.getElementById('grafico-linhas-svg-container');
    const eixoX = document.getElementById('grafico-eixo-x-labels');
    if (!container || !eixoX) return;

    container.innerHTML = '';
    eixoX.innerHTML = '';

    let transacoes = [];
    dadosApp.apostas.forEach(a => {
        if (a.estado === 'Perdido') transacoes.push({ data: a.data, val: -a.valor });
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

    let pontosPorDia = {};
    let runningBanca = dadosApp.saldoInicial;
    
    pontosPorDia[transacoes.length > 0 ? transacoes[0].data : new Date().toISOString().split('T')[0]] = runningBanca;

    transacoes.forEach(t => {
        runningBanca += t.val;
        pontosPorDia[t.data] = runningBanca;
    });

    const datas = Object.keys(pontosPorDia);
    if (datas.length === 0) {
        container.innerHTML = '<div class="w-full text-center text-slate-500 text-[10px] pb-4">Sem dados suficientes para gerar gráfico.</div>';
        return;
    }

    const valores = Object.values(pontosPorDia);
    const minVal = Math.min(...valores, dadosApp.saldoInicial) * 0.95;
    const maxVal = Math.max(...valores, dadosApp.saldoInicial) * 1.05;
    const amplitude = maxVal - minVal || 1;

    let svgHTML = `<svg class="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">`;
    
    const ySaldoInicial = 120 - ((dadosApp.saldoInicial - minVal) / amplitude) * 110;
    svgHTML += `<line x1="0" y1="${ySaldoInicial}" x2="300" y2="${ySaldoInicial}" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.8"/>`;

    let coords = [];
    datas.forEach((d, i) => {
        const x = (i / (datas.length - 1 || 1)) * 280 + 10;
        const val = pontosPorDia[d];
        const y = 120 - ((val - minVal) / amplitude) * 110;
        coords.push({ x, y, val, data: d });
    });

    if (coords.length > 1) {
        let pathD = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
            pathD += ` L ${coords[i].x} ${coords[i].y}`;
        }
        svgHTML += `<path d="${pathD}" fill="none" stroke="#34d399" stroke-width="2.5" />`;
    }

    coords.forEach(c => {
        svgHTML += `<circle cx="${c.x}" cy="${c.y}" r="3" fill="#10b981" stroke="#0f172a" stroke-width="1.5"/>`;
    });

    svgHTML += `</svg>`;
    container.innerHTML = svgHTML;

    if (datas.length > 0) {
        eixoX.innerHTML = `<span>${datas[0]}</span><span>${datas[datas.length - 1]}</span>`;
    }
}
