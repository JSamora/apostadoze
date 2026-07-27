const DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbxxjoFddFM8AcaCS42YHie1wwNMTmw8YqNobmsUrQZWWgr1FqUKMdKuCV8YQl0fhm9K-A/exec";

let bancaInicial = 100.00;
let apostas = [];

document.getElementById('data-aposta').valueAsDate = new Date();

function inicializarDatasMesAtual() {
    let hoje = new Date();
    let ano = hoje.getFullYear();
    let mes = String(hoje.getMonth() + 1).padStart(2, '0');
    let primeiroDia = `${ano}-${mes}-01`;
    let ultimoDiaObj = new Date(ano, hoje.getMonth() + 1, 0);
    let ultimoDia = `${ano}-${mes}-${String(ultimoDiaObj.getDate()).padStart(2, '0')}`;

    document.getElementById('grafico-data-inicio').value = primeiroDia;
    document.getElementById('grafico-data-fim').value = ultimoDia;
}
inicializarDatasMesAtual();

async function carregarDadosDoDrive() {
    let icon = document.getElementById('icon-sync');
    if (icon) icon.classList.add('fa-spin');
    
    try {
        let resposta = await fetch(DRIVE_API_URL);
        let dados = await resposta.json();
        if (Array.isArray(dados)) {
            apostas = dados;
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
        await fetch(DRIVE_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apostas)
        });
    } catch (erro) {
        console.error("Erro ao guardar dados no Drive:", erro);
    }
}

function mudarAba(aba) {
    document.getElementById('secao-registo').classList.add('hidden');
    document.getElementById('secao-historico').classList.add('hidden');
    document.getElementById('secao-extrato').classList.add('hidden');
    document.getElementById('secao-graficos').classList.add('hidden');

    document.getElementById('secao-registo').classList.remove('flex');
    document.getElementById('secao-historico').classList.remove('flex');
    document.getElementById('secao-extrato').classList.remove('flex');
    document.getElementById('secao-graficos').classList.remove('flex');

    document.getElementById('tab-registo').className = "px-1 py-1 font-semibold text-slate-400 hover:text-slate-200 transition truncate";
    document.getElementById('tab-historico').className = "px-1 py-1 font-semibold text-slate-400 hover:text-slate-200 transition truncate";
    document.getElementById('tab-extrato').className = "px-1 py-1 font-semibold text-slate-400 hover:text-slate-200 transition truncate";
    document.getElementById('tab-graficos').className = "px-1 py-1 font-semibold text-slate-400 hover:text-slate-200 transition truncate";

    document.getElementById('nav-btn-registo').className = "flex flex-col items-center hover:text-slate-200 text-slate-400";
    document.getElementById('nav-btn-historico').className = "flex flex-col items-center hover:text-slate-200 text-slate-400";
    document.getElementById('nav-btn-extrato').className = "flex flex-col items-center hover:text-slate-200 text-slate-400";
    document.getElementById('nav-btn-graficos').className = "flex flex-col items-center hover:text-slate-200 text-slate-400";

    if (aba === 'registo') {
        let el = document.getElementById('secao-registo');
        el.classList.remove('hidden');
        el.classList.add('flex');
        document.getElementById('tab-registo').className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        document.getElementById('nav-btn-registo').className = "flex flex-col items-center text-emerald-400";
    } else if (aba === 'historico') {
        let el = document.getElementById('secao-historico');
        el.classList.remove('hidden');
        el.classList.add('flex');
        document.getElementById('tab-historico').className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        document.getElementById('nav-btn-historico').className = "flex flex-col items-center text-emerald-400";
        atualizarListaHistoricoCompleto();
    } else if (aba === 'extrato') {
        let el = document.getElementById('secao-extrato');
        el.classList.remove('hidden');
        el.classList.add('flex');
        document.getElementById('tab-extrato').className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        document.getElementById('nav-btn-extrato').className = "flex flex-col items-center text-emerald-400";
        preencherAnosFiltro();
        atualizarExtrato();
    } else if (aba === 'graficos') {
        let el = document.getElementById('secao-graficos');
        el.classList.remove('hidden');
        el.classList.add('flex');
        document.getElementById('tab-graficos').className = "px-1 py-1 font-semibold text-emerald-400 border-b-2 border-emerald-400 transition truncate";
        document.getElementById('nav-btn-graficos').className = "flex flex-col items-center text-emerald-400";
        atualizarGraficoLinhas();
    }
}

function calcularBancaTotal() {
    let bancaCalculada = bancaInicial;
    apostas.forEach(aposta => {
        if (aposta.estado === "Venceu") {
            bancaCalculada += (aposta.valor * aposta.odd) - aposta.valor;
        } else if (aposta.estado === "Perdeu") {
            bancaCalculada -= aposta.valor;
        }
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

function atualizarInterface() {
    let bancaCalculada = calcularBancaTotal();
    let apostasComIndex = apostas.map((a, idx) => ({ ...a, originalIndex: idx }));
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

    document.getElementById("banca-atual").innerText = bancaCalculada.toFixed(2) + " €";
    document.getElementById("lista-recentes").innerHTML = htmlRecentes;
    document.getElementById("contador-recentes").innerText = apostasRecentes.length + (apostasRecentes.length === 1 ? " registo" : " registos");
}

function atualizarListaHistoricoCompleto() {
    let apostasComIndex = apostas.map((a, idx) => ({ ...a, originalIndex: idx }));
    apostasComIndex.sort((a, b) => new Date(b.data) - new Date(a.data));

    let htmlHistorico = "";
    if (apostasComIndex.length === 0) {
        htmlHistorico = `<div class="text-center py-5 text-slate-500 text-xs italic">Ainda não existem apostas registadas.</div>`;
    } else {
        apostasComIndex.forEach(item => {
            htmlHistorico += gerarHtmlApostaCard(item, item.originalIndex);
        });
    }

    document.getElementById("lista-historico-completo").innerHTML = htmlHistorico;
    document.getElementById("contador-historico").innerText = apostasComIndex.length + (apostasComIndex.length === 1 ? " registo" : " registos");
}

function preencherAnosFiltro() {
    let anos = new Set();
    apostas.forEach(a => {
        if (a.data) anos.add(a.data.split('-')[0]);
    });
    let selectAno = document.getElementById('filtro-ano');
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
    let filtroAno = document.getElementById('filtro-ano').value;
    let filtroMes = document.getElementById('filtro-mes').value;
    let filtroSemana = document.getElementById('filtro-semana').value;

    let saldoAcumuladoGlobal = bancaInicial;
    let saldoAnualCalc = 0;
    let saldoMensalCalc = 0;
    let saldoSemanalCalc = 0;

    let movimentosFiltrados = [];
    let apostasOrdenadas = [...apostas].sort((a, b) => new Date(a.data) - new Date(b.data));

    apostasOrdenadas.forEach((aposta) => {
        if (aposta.estado === "Pendente") return;

        let [ano, mes, dia] = aposta.data.split('-');
        let semana = obterSemanaDoMes(aposta.data);

        let impacto = 0;
        let creditoNum = 0;
        let debitoNum = 0;

        if (aposta.estado === "Venceu") {
            let lucro = (aposta.valor * aposta.odd) - aposta.valor;
            impacto = lucro;
            creditoNum = lucro;
        } else if (aposta.estado === "Perdeu") {
            impacto = -aposta.valor;
            debitoNum = aposta.valor;
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
                data: aposta.data,
                descricao: `${aposta.modalidade}: ${aposta.equipaA} vs ${aposta.equipaB}`,
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

    document.getElementById("tabela-extrato").innerHTML = htmlExtrato;
    document.getElementById("extrato-contador").innerText = dados.movimentos.length + (dados.movimentos.length === 1 ? " movimento" : " movimentos");

    document.getElementById("saldo-anual").innerText = (dados.saldoAnual >= 0 ? "+" : "") + dados.saldoAnual.toFixed(2) + " €";
    document.getElementById("saldo-anual").className = `text-xs font-bold mt-0.5 ${dados.saldoAnual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

    document.getElementById("saldo-mensal").innerText = (dados.saldoMensal >= 0 ? "+" : "") + dados.saldoMensal.toFixed(2) + " €";
    document.getElementById("saldo-mensal").className = `text-xs font-bold mt-0.5 ${dados.saldoMensal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

    document.getElementById("saldo-semanal").innerText = (dados.saldoSemanal >= 0 ? "+" : "") + dados.saldoSemanal.toFixed(2) + " €";
    document.getElementById("saldo-semanal").className = `text-xs font-bold mt-0.5 ${dados.saldoSemanal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
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
    let apostasOrdenadas = [...apostas].sort((a, b) => new Date(a.data) - new Date(b.data));

    apostasOrdenadas.forEach(a => {
        if (a.data < dataInicioStr) {
            if (a.estado === "Venceu") saldoCorrente += (a.valor * a.odd) - a.valor;
            else if (a.estado === "Perdeu") saldoCorrente -= a.valor;
        }
    });

    let pontosGrafico = [];
    let minBanca = bancaInicial;
    let maxBanca = bancaInicial;

    let impactoPorData = {};
    apostasOrdenadas.forEach(a => {
        if (a.data >= dataInicioStr && a.data <= dataFimStr) {
            let impacto = 0;
            if (a.estado === "Venceu") impacto = (a.valor * a.odd) - a.valor;
            else if (a.estado === "Perdeu") impacto = -a.valor;

            if (!impactoPorData[a.data]) impactoPorData[a.data] = 0;
            impactoPorData[a.data] += impacto;
        }
    });

    let datasComAposta = Object.keys(impactoPorData).sort();

    if (datasComAposta.length === 0) {
        container.innerHTML = `<div class="w-full text-center text-slate-500 text-xs italic my-auto">Sem apostas registadas neste intervalo.</div>`;
        labelsContainer.innerHTML = `<span>${dataInicioStr}</span><span>${dataFimStr}</span>`;
        return;
    }

    datasComAposta.forEach(dataStr => {
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
        apostas.push({ modalidade, equipaA, equipaB, valor, odd, estado, data });
    } else {
        apostas[editIndex] = { modalidade, equipaA, equipaB, valor, odd, estado, data };
        document.getElementById("edit-index").value = "-1";
        document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-plus-circle"></i> Registar Nova Aposta`;
        document.getElementById("btn-salvar").innerText = "Concluir e Registar";
    }

    document.getElementById("equipa-a").value = "";
    document.getElementById("equipa-b").value = "";
    document.getElementById("valor-aposta").value = "";
    document.getElementById("odd-aposta").value = "";
    document.getElementById("estado-aposta").value = "Pendente";
    document.getElementById("modalidade-aposta").value = "Futebol";

    await guardarDadosNoDrive();
    atualizarInterface();
}

function editarAposta(index) {
    let a = apostas[index];
    document.getElementById("modalidade-aposta").value = a.modalidade;
    document.getElementById("equipa-a").value = a.equipaA;
    document.getElementById("equipa-b").value = a.equipaB;
    document.getElementById("valor-aposta").value = a.valor;
    document.getElementById("odd-aposta").value = a.odd;
    document.getElementById("estado-aposta").value = a.estado;
    document.getElementById("data-aposta").value = a.data;
    document.getElementById("edit-index").value = index;

    document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> A Editar Aposta #${index + 1}`;
    document.getElementById("btn-salvar").innerText = "Atualizar Registo";
    mudarAba('registo');
}

async function apagarAposta(index) {
    if (confirm("Tem certeza que deseja apagar este registo?")) {
        apostas.splice(index, 1);
        await guardarDadosNoDrive();
        atualizarInterface();
    }
}

function abrirConfigBanca() {
    let novoValor = prompt("Introduza o valor inicial da Banca:", bancaInicial);
    if (novoValor !== null && !isNaN(parseFloat(novoValor))) {
        bancaInicial = parseFloat(novoValor);
        atualizarInterface();
    }
}

document.getElementById('secao-registo').classList.add('flex');
carregarDadosDoDrive();
