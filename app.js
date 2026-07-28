const DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbzM70jBc3LfZm0FOikdPgsVs-jSjdIScdI_Y44f_mU0zDCX9EFmdUeBY5usN91mfh5vkw/exec";

let bancaInicial = 100.00;
let dadosApp = {
    apostas: [],
    raspadinhas: [],
    transacoes: []
};

document.getElementById('data-aposta').valueAsDate = new Date();
if (document.getElementById('data-raspadinha')) {
    document.getElementById('data-raspadinha').valueAsDate = new Date();
}
if (document.getElementById('data-transacao')) {
    document.getElementById('data-transacao').valueAsDate = new Date();
}

function inicializarDatasMesAtual() {
    let hoje = new Date();
    let ano = hoje.getFullYear();
    let mes = String(hoje.getMonth() + 1).padStart(2, '0');
    let primeiroDia = `${ano}-${mes}-01`;
    let ultimoDiaObj = new Date(ano, hoje.getMonth() + 1, 0);
    let ultimoDia = `${ano}-${mes}-${String(ultimoDiaObj.getDate()).padStart(2, '0')}`;

    if (document.getElementById('grafico-data-inicio')) {
        document.getElementById('grafico-data-inicio').value = primeiroDia;
        document.getElementById('grafico-data-fim').value = ultimoDia;
    }
}
inicializarDatasMesAtual();

async function carregarDadosDoDrive() {
    let icon = document.getElementById('icon-sync');
    if (icon) icon.classList.add('fa-spin');
    
    try {
        let resposta = await fetch(DRIVE_API_URL);
        let dados = await resposta.json();
        
        if (Array.isArray(dados)) {
            dadosApp.apostas = dados;
        } else if (dados) {
            dadosApp.apostas = Array.isArray(dados.apostas) ? dados.apostas : [];
            dadosApp.raspadinhas = Array.isArray(dados.raspadinhas) ? dados.raspadinhas : [];
            dadosApp.transacoes = Array.isArray(dados.transacoes) ? dados.transacoes : [];
            if (typeof dados.bancaInicial === 'number') {
                bancaInicial = dados.bancaInicial;
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar dados do Drive:", erro);
    } finally {
        if (icon) icon.classList.remove('fa-spin');
        atualizarInterface();
    }
}

async function guardarDadosNoDrive() {
    try {
        let payload = {
            bancaInicial: bancaInicial,
            apostas: dadosApp.apostas,
            raspadinhas: dadosApp.raspadinhas,
            transacoes: dadosApp.transacoes
        };

        await fetch(DRIVE_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (erro) {
        console.error("Erro ao guardar dados no Drive:", erro);
    }
}

function mudarAba(aba) {
    const secoes = ['secao-registo', 'secao-historico', 'secao-extrato', 'secao-graficos'];
    secoes.forEach(id => {
        let el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });

    ['tab-registo', 'tab-historico', 'tab-extrato', 'tab-graficos'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.className = "px-1 py-1 font-semibold text-slate-400 hover:text-slate-200 transition truncate";
    });

    ['nav-btn-registo', 'nav-btn-historico', 'nav-btn-extrato', 'nav-btn-graficos'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.className = "flex flex-col items-center hover:text-slate-200 text-slate-400";
    });

    if (aba === 'registo') {
        let el = document.getElementById('secao-registo');
        if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
        let tab = document.getElementById('tab-registo');
        if (tab) tab.className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        let nav = document.getElementById('nav-btn-registo');
        if (nav) nav.className = "flex flex-col items-center text-emerald-400";
    } else if (aba === 'historico') {
        let el = document.getElementById('secao-historico');
        if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
        let tab = document.getElementById('tab-historico');
        if (tab) tab.className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        let nav = document.getElementById('nav-btn-historico');
        if (nav) nav.className = "flex flex-col items-center text-emerald-400";
        atualizarListaHistoricoCompleto();
    } else if (aba === 'extrato') {
        let el = document.getElementById('secao-extrato');
        if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
        let tab = document.getElementById('tab-extrato');
        if (tab) tab.className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        let nav = document.getElementById('nav-btn-extrato');
        if (nav) nav.className = "flex flex-col items-center text-emerald-400";
        preencherAnosFiltro();
        atualizarExtrato();
    } else if (aba === 'graficos') {
        let el = document.getElementById('secao-graficos');
        if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
        let tab = document.getElementById('tab-graficos');
        if (tab) tab.className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        let nav = document.getElementById('nav-btn-graficos');
        if (nav) nav.className = "flex flex-col items-center text-emerald-400";
        atualizarGraficoLinhas();
    }
}

function alternarFormularioRegisto(tipo) {
    const tipos = ['aposta', 'raspadinha', 'transacao'];
    tipos.forEach(t => {
        let form = document.getElementById(`form-${t}`);
        let btn = document.getElementById(`btn-tipo-${t}`);
        if (form) form.classList.add('hidden');
        if (btn) {
            btn.classList.remove('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/50');
            btn.classList.add('bg-slate-800', 'text-slate-400', 'border-slate-700');
        }
    });

    let ativoForm = document.getElementById(`form-${tipo}`);
    let ativoBtn = document.getElementById(`btn-tipo-${tipo}`);
    if (ativoForm) ativoForm.classList.remove('hidden');
    if (ativoBtn) {
        ativoBtn.classList.remove('bg-slate-800', 'text-slate-400', 'border-slate-700');
        ativoBtn.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/50');
    }
}

function calcularBancaTotal() {
    let bancaCalculada = bancaInicial;
    
    dadosApp.apostas.forEach(aposta => {
        if (aposta.estado === "Venceu") {
            bancaCalculada += (aposta.valor * aposta.odd) - aposta.valor;
        } else if (aposta.estado === "Perdeu") {
            bancaCalculada -= aposta.valor;
        }
    });

    dadosApp.raspadinhas.forEach(r => {
        bancaCalculada += (r.premio - r.custo);
    });

    dadosApp.transacoes.forEach(t => {
        if (t.tipo === "Depósito") bancaCalculada += t.valor;
        else if (t.tipo === "Levantamento") bancaCalculada -= t.valor;
    });

    return bancaCalculada;
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

function gerarHtmlRaspadinhaCard(r, originalIndex) {
    let saldo = r.premio - r.custo;
    let badgeClass = saldo > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : (saldo < 0 ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30");
    let saldoStr = saldo > 0 ? `+${saldo.toFixed(2)} €` : `${saldo.toFixed(2)} €`;

    return `
        <div class="bg-slate-800 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center shrink-0">
            <div>
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded font-medium">Raspadinha</span>
                    <span class="text-xs font-bold text-white">${r.nome}</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full border ${badgeClass}">${saldo >= 0 ? 'Lucro' : 'Prejuízo'}</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Data: ${r.data}</span>
                    <span>Custo: <b>${r.custo.toFixed(2)} €</b></span>
                    <span>Prémio: <b>${r.premio.toFixed(2)} €</b></span>
                    <span>Balanço: <b class="${saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${saldoStr}</b></span>
                </div>
            </div>
            <div class="flex gap-1">
                <button onclick="apagarRaspadinha(${originalIndex})" class="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 p-1.5 rounded-lg text-xs" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;
}

function atualizarInterface() {
    let bancaCalculada = calcularBancaTotal();
    
    let apostasComIndex = dadosApp.apostas.map((a, idx) => ({ ...a, originalIndex: idx, tipoItem: 'aposta' }));
    let raspadinhaComIndex = dadosApp.raspadinhas.map((r, idx) => ({ ...r, originalIndex: idx, tipoItem: 'raspadinha' }));
    
    let todosItens = [...apostasComIndex, ...raspadinhaComIndex];
    todosItens.sort((a, b) => new Date(b.data) - new Date(a.data));

    let hoje = new Date();
    let limiteDias = new Date();
    limiteDias.setDate(hoje.getDate() - 7);
    let recentes = todosItens.filter(item => new Date(item.data) >= limiteDias);

    let htmlRecentes = "";
    if (recentes.length === 0) {
        htmlRecentes = `<div class="text-center py-4 text-slate-500 text-xs italic">Ainda não existem registos nos últimos 7 dias.</div>`;
    } else {
        recentes.forEach(item => {
            if (item.tipoItem === 'aposta') {
                htmlRecentes += gerarHtmlApostaCard(item, item.originalIndex);
            } else {
                htmlRecentes += gerarHtmlRaspadinhaCard(item, item.originalIndex);
            }
        });
    }

    let elBanca = document.getElementById("banca-atual");
    let elRecentes = document.getElementById("lista-recentes");
    let elContador = document.getElementById("contador-recentes");

    if (elBanca) elBanca.innerText = bancaCalculada.toFixed(2) + " €";
    if (elRecentes) elRecentes.innerHTML = htmlRecentes;
    if (elContador) elContador.innerText = recentes.length + (recentes.length === 1 ? " registo" : " registos");
}

function atualizarListaHistoricoCompleto() {
    let apostasComIndex = dadosApp.apostas.map((a, idx) => ({ ...a, originalIndex: idx, tipoItem: 'aposta' }));
    let raspadinhaComIndex = dadosApp.raspadinhas.map((r, idx) => ({ ...r, originalIndex: idx, tipoItem: 'raspadinha' }));
    
    let todosItens = [...apostasComIndex, ...raspadinhaComIndex];
    todosItens.sort((a, b) => new Date(b.data) - new Date(a.data));

    let htmlHistorico = "";
    if (todosItens.length === 0) {
        htmlHistorico = `<div class="text-center py-5 text-slate-500 text-xs italic">Ainda não existem registos.</div>`;
    } else {
        todosItens.forEach(item => {
            if (item.tipoItem === 'aposta') {
                htmlHistorico += gerarHtmlApostaCard(item, item.originalIndex);
            } else {
                htmlHistorico += gerarHtmlRaspadinhaCard(item, item.originalIndex);
            }
        });
    }

    let elLista = document.getElementById("lista-historico-completo");
    let elCont = document.getElementById("contador-historico");
    if (elLista) elLista.innerHTML = htmlHistorico;
    if (elCont) elCont.innerText = todosItens.length + (todosItens.length === 1 ? " registo" : " registos");
}

function preencherAnosFiltro() {
    let anos = new Set();
    dadosApp.apostas.forEach(a => { if (a.data) anos.add(a.data.split('-')[0]); });
    dadosApp.raspadinhas.forEach(r => { if (r.data) anos.add(r.data.split('-')[0]); });
    dadosApp.transacoes.forEach(t => { if (t.data) anos.add(t.data.split('-')[0]); });

    let selectAno = document.getElementById('filtro-ano');
    if (!selectAno) return;
    let anoAtualSel = selectAno.value;
    let html = '<option value="todos">Todos</option>';
    anos.forEach(ano => {
        html += `<option value="${ano}">${ano}</option>`;
    });
    selectAno.innerHTML = html;
    selectAno.value = anos.has(anoAtualSel) ? anoAtualSel : 'todos';
}

function obterSemanaDoMes(dataStr) {
    let dia = parseInt(dataStr.split('-')[2]);
    if (dia <= 7) return 1;
    if (dia <= 14) return 2;
    if (dia <= 21) return 3;
    return 4;
}

function obterDadosExtratoFiltrados() {
    let filtroAno = document.getElementById('filtro-ano') ? document.getElementById('filtro-ano').value : 'todos';
    let filtroMes = document.getElementById('filtro-mes') ? document.getElementById('filtro-mes').value : 'todos';
    let filtroSemana = document.getElementById('filtro-semana') ? document.getElementById('filtro-semana').value : 'todas';

    let saldoAcumuladoGlobal = bancaInicial;
    let saldoAnualCalc = 0;
    let saldoMensalCalc = 0;
    let saldoSemanalCalc = 0;

    let movimentosFiltrados = [];
    
    let todosEventos = [];
    dadosApp.apostas.forEach(a => { if (a.estado !== "Pendente") todosEventos.push({ ...a, origem: 'aposta' }); });
    dadosApp.raspadinhas.forEach(r => todosEventos.push({ ...r, origem: 'raspadinha' }));
    dadosApp.transacoes.forEach(t => todosEventos.push({ ...t, origem: 'transacao' }));

    todosEventos.sort((a, b) => new Date(a.data) - new Date(b.data));

    todosEventos.forEach((item) => {
        let [ano, mes, dia] = item.data.split('-');
        let semana = obterSemanaDoMes(item.data);

        let impacto = 0;
        let creditoNum = 0;
        let debitoNum = 0;
        let descricao = "";

        if (item.origem === 'aposta') {
            descricao = `Aposta: ${item.modalidade} (${item.equipaA} vs ${item.equipaB})`;
            if (item.estado === "Venceu") {
                let lucro = (item.valor * item.odd) - item.valor;
                impacto = lucro;
                creditoNum = lucro;
            } else if (item.estado === "Perdeu") {
                impacto = -item.valor;
                debitoNum = item.valor;
            }
        } else if (item.origem === 'raspadinha') {
            descricao = `Raspadinha: ${item.nome}`;
            let balanco = item.premio - item.custo;
            impacto = balanco;
            if (balanco >= 0) creditoNum = balanco;
            else debitoNum = Math.abs(balanco);
        } else if (item.origem === 'transacao') {
            descricao = `Transação: ${item.tipo}`;
            if (item.tipo === "Depósito") {
                impacto = item.valor;
                creditoNum = item.valor;
            } else {
                impacto = -item.valor;
                debitoNum = item.valor;
            }
        }

        saldoAcumuladoGlobal += impacto;

        let matchAno = (filtroAno === 'todos' || ano === filtroAno);
        let matchMes = matchAno && (filtroMes === 'todos' || parseInt(mes) === parseInt(filtroMes));
        let matchSemana = matchMes && (filtroSemana === 'todas' || semana === parseInt(filtroSemana));

        if (matchAno) saldoAnualCalc += impacto;
        if (matchMes) saldoMensalCalc += impacto;
        if (matchSemana) saldoSemanalCalc += impacto;

        if (matchAno && matchMes && matchSemana) {
            movimentosFiltrados.push({
                data: item.data,
                descricao: descricao,
                debito: debitoNum,
                credito: creditoNum,
                acumulado: saldoAcumuladoGlobal
            });
        }
    });

    return {
        movimentos: movimentosFiltrados,
        saldoAnual: saldoAnualCalc,
        saldoMensal: saldoMensalCalc,
        saldoSemanal: saldoSemanalCalc
    };
}

function atualizarExtrato() {
    let dados = obterDadosExtratoFiltrados();
    let htmlExtrato = `
        <tr class="border-b border-slate-800 bg-slate-900/40">
            <td class="py-1 px-1 text-slate-300 font-medium">Banca Inicial Configurada</td>
            <td class="py-1 px-1 text-slate-500">-</td>
            <td class="py-1 px-1 text-emerald-400">+${bancaInicial.toFixed(2)} €</td>
            <td class="py-1 px-1 text-right font-bold text-white">${bancaInicial.toFixed(2)} €</td>
        </tr>
    `;

    dados.movimentos.forEach((m) => {
        let creditoStr = m.credito > 0 ? `+${m.credito.toFixed(2)} €` : "-";
        let debitoStr = m.debito > 0 ? `-${m.debito.toFixed(2)} €` : "-";
        let corTextoAcumulado = m.acumulado >= bancaInicial ? 'text-emerald-400' : 'text-rose-400';

        htmlExtrato += `
            <tr class="border-b border-slate-800">
                <td class="py-1 px-1"><b>${m.data}</b><br><span class="text-[8px] text-slate-400">${m.descricao}</span></td>
                <td class="py-1 px-1 text-rose-400">${debitoStr}</td>
                <td class="py-1 px-1 text-emerald-400">${creditoStr}</td>
                <td class="py-1 px-1 text-right font-bold ${corTextoAcumulado}">${m.acumulado.toFixed(2)} €</td>
            </tr>
        `;
    });

    if (document.getElementById("tabela-extrato")) document.getElementById("tabela-extrato").innerHTML = htmlExtrato;
    if (document.getElementById("extrato-contador")) document.getElementById("extrato-contador").innerText = dados.movimentos.length + (dados.movimentos.length === 1 ? " movimento" : " movimentos");

    let sAnual = document.getElementById("saldo-anual");
    let sMensal = document.getElementById("saldo-mensal");
    let sSemanal = document.getElementById("saldo-semanal");

    if (sAnual) {
        sAnual.innerText = (dados.saldoAnual >= 0 ? "+" : "") + dados.saldoAnual.toFixed(2) + " €";
        sAnual.className = `text-xs font-bold mt-0.5 ${dados.saldoAnual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (sMensal) {
        sMensal.innerText = (dados.saldoMensal >= 0 ? "+" : "") + dados.saldoMensal.toFixed(2) + " €";
        sMensal.className = `text-xs font-bold mt-0.5 ${dados.saldoMensal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (sSemanal) {
        sSemanal.innerText = (dados.saldoSemanal >= 0 ? "+" : "") + dados.saldoSemanal.toFixed(2) + " €";
        sSemanal.className = `text-xs font-bold mt-0.5 ${dados.saldoSemanal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
}

function gerarPdfExtrato() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let dados = obterDadosExtratoFiltrados();
    let filtroAno = document.getElementById('filtro-ano').value;
    let filtroMes = document.getElementById('filtro-mes').value;
    let filtroSemana = document.getElementById('filtro-semana').value;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129);
    doc.text("Apostas do Zé - Extrato de Conta", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}`, 14, 26);
    doc.text(`Filtros Aplicados -> Ano: ${filtroAno} | Mês: ${filtroMes} | Semana: ${filtroSemana}`, 14, 32);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 38, 182, 18, 2, 2, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Saldo Anual: ${dados.saldoAnual >= 0 ? '+' : ''}${dados.saldoAnual.toFixed(2)} EUR`, 18, 49);
    doc.text(`Saldo Mensal: ${dados.saldoMensal >= 0 ? '+' : ''}${dados.saldoMensal.toFixed(2)} EUR`, 78, 49);
    doc.text(`Saldo Semanal: ${dados.saldoSemanal >= 0 ? '+' : ''}${dados.saldoSemanal.toFixed(2)} EUR`, 138, 49);

    let y = 65;
    doc.setFontSize(11);
    doc.text("Movimentos Detalhados", 14, y);
    y += 6;

    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Data / Descrição", 18, y + 5.5);
    doc.text("Débito", 110, y + 5.5);
    doc.text("Crédito", 138, y + 5.5);
    doc.text("Acumulado", 175, y + 5.5, { align: "right" });

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.setTextColor(50, 50, 50);
    doc.text("Banca Inicial Configurada", 18, y + 5);
    doc.text("-", 110, y + 5);
    doc.text(`+${bancaInicial.toFixed(2)} €`, 138, y + 5);
    doc.text(`${bancaInicial.toFixed(2)} €`, 190, y + 5, { align: "right" });
    y += 8;

    dados.movimentos.forEach((m, idx) => {
        if (y > 275) {
            doc.addPage();
            y = 20;
        }

        if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y - 2, 182, 8, 'F');
        }

        doc.setTextColor(30, 30, 30);
        doc.text(`${m.data} - ${m.descricao}`, 18, y + 3);
        
        let debitoStr = m.debito > 0 ? `-${m.debito.toFixed(2)} €` : "-";
        let creditoStr = m.credito > 0 ? `+${m.credito.toFixed(2)} €` : "-";

        doc.text(debitoStr, 110, y + 3);
        doc.text(creditoStr, 138, y + 3);
        doc.text(`${m.acumulado.toFixed(2)} €`, 190, y + 3, { align: "right" });

        y += 8;
    });

    doc.save(`extrato_apostas_${filtroAno}_${filtroMes}.pdf`);
}

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

    let dInicio = new Date(dataInicioStr);
    let dFim = new Date(dataFimStr);

    if (dInicio > dFim) {
        container.innerHTML = `<div class="w-full text-center text-rose-400 text-xs italic my-auto">A data de início deve ser anterior à data de fim.</div>`;
        return;
    }

    let saldoCorrente = bancaInicial;
    
    let todosEventos = [];
    dadosApp.apostas.forEach(a => { if (a.estado !== "Pendente") todosEventos.push({ ...a, origem: 'aposta' }); });
    dadosApp.raspadinhas.forEach(r => todosEventos.push({ ...r, origem: 'raspadinha' }));
    dadosApp.transacoes.forEach(t => todosEventos.push({ ...t, origem: 'transacao' }));
    
    todosEventos.sort((a, b) => new Date(a.data) - new Date(b.data));

    todosEventos.forEach(item => {
        if (item.data < dataInicioStr) {
            if (item.origem === 'aposta') {
                if (item.estado === "Venceu") saldoCorrente += (item.valor * item.odd) - item.valor;
                else if (item.estado === "Perdeu") saldoCorrente -= item.valor;
            } else if (item.origem === 'raspadinha') {
                saldoCorrente += (item.premio - item.custo);
            } else if (item.origem === 'transacao') {
                if (item.tipo === "Depósito") saldoCorrente += item.valor;
                else saldoCorrente -= item.valor;
            }
        }
    });

    let pontosGrafico = [];
    let minBanca = bancaInicial;
    let maxBanca = bancaInicial;

    let impactoPorData = {};
    todosEventos.forEach(item => {
        if (item.data >= dataInicioStr && item.data <= dataFimStr) {
            let impacto = 0;
            if (item.origem === 'aposta') {
                if (item.estado === "Venceu") impacto = (item.valor * item.odd) - item.valor;
                else if (item.estado === "Perdeu") impacto = -item.valor;
            } else if (item.origem === 'raspadinha') {
                impacto = item.premio - item.custo;
            } else if (item.origem === 'transacao') {
                impacto = item.tipo === "Depósito" ? item.valor : -item.valor;
            }

            if (!impactoPorData[item.data]) impactoPorData[item.data] = 0;
            impactoPorData[item.data] += impacto;
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

    let yPosBancaInicial = svgHeight - ((bancaInicial - minBanca) / spanBanca) * (svgHeight - 16) - 8;

    let linhasGrelhaSvg = `
        <line x1="0" y1="${yPosBancaInicial}" x2="${svgWidth}" y2="${yPosBancaInicial}" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="4,4" />
    `;

    for (let val = minBanca; val <= maxBanca; val += 5) {
        if (val === bancaInicial) continue;
        let yPos = svgHeight - ((val - minBanca) / spanBanca) * (svgHeight - 16) - 8;
        linhasGrelhaSvg += `<line x1="0" y1="${yPos}" x2="${svgWidth}" y2="${yPos}" stroke="#334155" stroke-width="0.5" />`;
    }

    let diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let htmlLabels = "";
    if (pontosGrafico.length > 0) {
        let primeiroDiaObj = new Date(pontosGrafico[0].data);
        let ultimoDiaObj = new Date(pontosGrafico[pontosGrafico.length - 1].data);
        let dSemanaInicio = diasSemanaNomes[primeiroDiaObj.getDay()];
        let dSemanaFim = diasSemanaNomes[ultimoDiaObj.getDay()];
        htmlLabels = `<span>${pontosGrafico[0].data.substring(5)} (${dSemanaInicio})</span><span>${pontosGrafico[pontosGrafico.length - 1].data.substring(5)} (${dSemanaFim})</span>`;
    }

    container.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-full overflow-visible">
            ${linhasGrelhaSvg}
            <polyline fill="none" stroke="#10b981" stroke-width="2.5" points="${pontosSvg}" stroke-linecap="round" stroke-linejoin="round" />
            ${pontosGrafico.map((item, index) => {
                let x = pontosGrafico.length === 1 ? svgWidth / 2 : index * passosX;
                let y = svgHeight - ((item.saldo - minBanca) / spanBanca) * (svgHeight - 16) - 8;
                let corPonto = item.saldo < bancaInicial ? '#f43f5e' : '#34d399';
                let dObj = new Date(item.data);
                let dSemana = diasSemanaNomes[dObj.getDay()];
                return `<circle cx="${x}" cy="${y}" r="3.5" fill="${corPonto}" class="cursor-pointer">
                    <title>${item.data} (${dSemana}): ${item.saldo.toFixed(2)}€ (Inicial: ${bancaInicial.toFixed(2)}€)</title>
                </circle>`;
            }).join('')}
        </svg>
    `;
    labelsContainer.innerHTML = htmlLabels;
}

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

    if (editIndex === -1) {
        dadosApp.apostas.push({ modalidade, equipaA, equipaB, valor, odd, estado, data });
    } else {
        dadosApp.apostas[editIndex] = { modalidade, equipaA, equipaB, valor, odd, estado, data };
        document.getElementById("edit-index").value = "-1";
        document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-plus-circle"></i> Registar Novo Evento`;
        document.getElementById("btn-salvar-aposta").innerText = "Concluir e Registar Aposta";
    }

    document.getElementById("equipa-a").value = "";
    document.getElementById("equipa-b").value = "";
    document.getElementById("valor-aposta").value = "";
    document.getElementById("odd-aposta").value = "";
    document.getElementById("estado-aposta").value = "Pendente";

    await guardarDadosNoDrive();
    atualizarInterface();
}

async function guardarRaspadinha() {
    let nome = document.getElementById("nome-raspadinha").value.trim();
    let custo = parseFloat(document.getElementById("custo-raspadinha").value);
    let premio = parseFloat(document.getElementById("premio-raspadinha").value);
    let data = document.getElementById("data-raspadinha").value;

    if (!nome || isNaN(custo) || isNaN(premio) || !data) {
        alert("Por favor, preencha todos os campos da raspadinha corretamente.");
        return;
    }

    dadosApp.raspadinhas.push({ nome, custo, premio, data });

    document.getElementById("nome-raspadinha").value = "";
    document.getElementById("custo-raspadinha").value = "";
    document.getElementById("premio-raspadinha").value = "";

    await guardarDadosNoDrive();
    atualizarInterface();
}

async function guardarTransacao() {
    let tipo = document.getElementById("tipo-transacao").value;
    let valor = parseFloat(document.getElementById("valor-transacao").value);
    let data = document.getElementById("data-transacao").value;

    if (isNaN(valor) || !data) {
        alert("Por favor, preencha os dados da transação corretamente.");
        return;
    }

    dadosApp.transacoes.push({ tipo, valor, data });

    document.getElementById("valor-transacao").value = "";

    await guardarDadosNoDrive();
    atualizarInterface();
}

function editarAposta(index) {
    let a = dadosApp.apostas[index];
    alternarFormularioRegisto('aposta');
    document.getElementById("modalidade-aposta").value = a.modalidade;
    document.getElementById("equipa-a").value = a.equipaA;
    document.getElementById("equipa-b").value = a.equipaB;
    document.getElementById("valor-aposta").value = a.valor;
    document.getElementById("odd-aposta").value = a.odd;
    document.getElementById("estado-aposta").value = a.estado;
    document.getElementById("data-aposta").value = a.data;
    document.getElementById("edit-index").value = index;

    document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> A Editar Aposta #${index + 1}`;
    document.getElementById("btn-salvar-aposta").innerText = "Atualizar Registo";
    mudarAba('registo');
}

async function apagarAposta(index) {
    if (confirm("Tem certeza que deseja apagar este registo de aposta?")) {
        dadosApp.apostas.splice(index, 1);
        await guardarDadosNoDrive();
        atualizarInterface();
    }
}

async function apagarRaspadinha(index) {
    if (confirm("Tem certeza que deseja apagar este registo de raspadinha?")) {
        dadosApp.raspadinhas.splice(index, 1);
        await guardarDadosNoDrive();
        atualizarInterface();
    }
}

function abrirConfigBanca() {
    let novoValor = prompt("Introduza o valor inicial da Banca:", bancaInicial);
    if (novoValor !== null && !isNaN(parseFloat(novoValor))) {
        bancaInicial = parseFloat(novoValor);
        guardarDadosNoDrive();
        atualizarInterface();
    }
}

let secReg = document.getElementById('secao-registo');
if (secReg) secReg.classList.add('flex');
carregarDadosDoDrive();
