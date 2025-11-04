class DrinkCounter {
    constructor() {
        this.bebidas = this.carregarBebidas();
        this.registros = this.carregarRegistros();
        this.contadores = {}; // Controla os contadores de cada bebida
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.atualizarTotalHoje();
        this.renderizarCardapio();
        this.renderizarRelatorio();
    }

    setupEventListeners() {
        // Navegação entre abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.mudarAba(e.target.dataset.tab);
            });
        });

        // Formulário de registro
        document.getElementById('registroForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarBebida();
        });

        // Botão limpar
        document.getElementById('btnLimpar').addEventListener('click', () => {
            document.getElementById('registroForm').reset();
        });

        // Atualizar cardápio
        document.getElementById('btnRefreshCardapio').addEventListener('click', () => {
            this.renderizarCardapio();
        });

        // Filtro de data
        document.getElementById('filtroData').addEventListener('change', () => {
            this.renderizarRelatorio();
        });

        // Exportar relatório
        document.getElementById('exportRelatorio').addEventListener('click', () => {
            this.exportarRelatorio();
        });

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleKeyboardShortcuts(e) {
        // Só funciona se não estiver em um input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        switch(e.key) {
            case '1':
                document.querySelector('[data-tab="cardapio"]').click();
                break;
            case '2':
                document.querySelector('[data-tab="registro"]').click();
                break;
            case '3':
                document.querySelector('[data-tab="relatorio"]').click();
                break;
            case 'Escape':
                document.getElementById('btnLimpar').click();
                break;
        }
    }

    mudarAba(aba) {
        // Atualizar botões
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === aba);
            btn.setAttribute('aria-selected', btn.dataset.tab === aba);
        });

        // Mostrar conteúdo da aba
        document.querySelectorAll('.tab-content').forEach(content => {
            const isActive = content.id === aba;
            content.classList.toggle('active', isActive);
            content.hidden = !isActive;
        });

        // Se for para o cardápio, atualiza a lista
        if (aba === 'cardapio') {
            this.renderizarCardapio();
        }
    }

    cadastrarBebida() {
        const formData = new FormData(document.getElementById('registroForm'));
        const nome = document.getElementById('drinkName').value.trim();
        const dosagem = parseInt(document.getElementById('dosagem').value);
        const tipo = document.getElementById('tipoDestilado').value;

        // Validação
        if (!nome || !dosagem || !tipo) {
            this.mostrarFeedback('Preencha todos os campos!', 'error');
            return;
        }

        if (dosagem <= 0 || dosagem > 500) {
            this.mostrarFeedback('Dosagem deve ser entre 1ml e 500ml!', 'error');
            return;
        }

        // Verifica se já existe bebida com mesmo nome
        if (this.bebidas.some(bebida => bebida.nome.toLowerCase() === nome.toLowerCase())) {
            this.mostrarFeedback('Já existe uma bebida com este nome!', 'error');
            return;
        }

        const bebida = {
            id: Date.now(),
            nome: nome,
            dosagem: dosagem,
            tipo: tipo,
            timestamp: new Date().toISOString()
        };

        this.bebidas.unshift(bebida);
        this.salvarBebidas();
        
        // Reset form
        document.getElementById('registroForm').reset();
        
        // Feedback visual e vai para o cardápio
        this.mostrarFeedback('Bebida cadastrada com sucesso!', 'success');
        setTimeout(() => {
            this.mudarAba('cardapio');
        }, 1000);
    }

    renderizarCardapio() {
        const container = document.getElementById('listaCardapio');
        const emptyState = document.getElementById('emptyCardapio');

        if (this.bebidas.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        this.bebidas.forEach(bebida => {
            const card = this.criarCardBebida(bebida);
            container.appendChild(card);
        });
    }

    criarCardBebida(bebida) {
        const card = document.createElement('div');
        card.className = `bebida-card ${bebida.tipo}`;
        
        // Inicializa contador se não existir
        if (!this.contadores[bebida.id]) {
            this.contadores[bebida.id] = 0;
        }

        card.innerHTML = `
            <div class="bebida-header">
                <div class="bebida-info">
                    <h3>${bebida.nome}</h3>
                    <span class="bebida-tipo">${this.formatarTipo(bebida.tipo)}</span>
                </div>
                <div class="bebida-dosagem">
                    <strong>${bebida.dosagem}ml</strong>
                    <div>por dose</div>
                </div>
            </div>
            <div class="bebida-controles">
                <div class="contador-wrapper">
                    <button class="contador-btn negative" data-bebida="${bebida.id}" data-action="decrement" aria-label="Diminuir dose">−</button>
                    <div class="contador-display" id="contador-${bebida.id}">
                        ${this.contadores[bebida.id]} dose(s)
                    </div>
                    <button class="contador-btn" data-bebida="${bebida.id}" data-action="increment" aria-label="Aumentar dose">+</button>
                </div>
                <button class="registrar-btn" data-bebida="${bebida.id}">
                    Registrar ${this.contadores[bebida.id] * bebida.dosagem}ml
                </button>
            </div>
        `;

        // Adiciona event listeners aos botões
        this.adicionarEventListenersCard(card, bebida);

        return card;
    }

    adicionarEventListenersCard(card, bebida) {
        const btnDecrement = card.querySelector('[data-action="decrement"]');
        const btnIncrement = card.querySelector('[data-action="increment"]');
        const btnRegistrar = card.querySelector('.registrar-btn');

        btnDecrement.addEventListener('click', () => {
            this.alterarContador(bebida.id, -1);
            this.atualizarCardBebida(bebida.id);
        });

        btnIncrement.addEventListener('click', () => {
            this.alterarContador(bebida.id, 1);
            this.atualizarCardBebida(bebida.id);
        });

        btnRegistrar.addEventListener('click', () => {
            this.registrarConsumo(bebida.id);
        });
    }

    alterarContador(bebidaId, quantidade) {
        this.contadores[bebidaId] += quantidade;
        
        // Não permite valores negativos
        if (this.contadores[bebidaId] < 0) {
            this.contadores[bebidaId] = 0;
        }
        
        // Limite máximo de 10 doses por vez
        if (this.contadores[bebidaId] > 10) {
            this.contadores[bebidaId] = 10;
            this.mostrarFeedback('Máximo de 10 doses por registro!', 'warning');
        }
    }

    atualizarCardBebida(bebidaId) {
        const display = document.getElementById(`contador-${bebidaId}`);
        const btnRegistrar = document.querySelector(`.registrar-btn[data-bebida="${bebidaId}"]`);
        const bebida = this.bebidas.find(b => b.id == bebidaId);

        if (display && bebida) {
            display.textContent = `${this.contadores[bebidaId]} dose(s)`;
            
            const totalMl = this.contadores[bebidaId] * bebida.dosagem;
            btnRegistrar.textContent = `Registrar ${totalMl}ml`;
            
            // Desabilita o botão se contador for zero
            btnRegistrar.disabled = this.contadores[bebidaId] === 0;
            btnRegistrar.style.opacity = this.contadores[bebidaId] === 0 ? '0.6' : '1';
        }
    }

    registrarConsumo(bebidaId) {
        const bebida = this.bebidas.find(b => b.id == bebidaId);
        const quantidadeDoses = this.contadores[bebidaId];

        if (!bebida || quantidadeDoses === 0) {
            return;
        }

        const totalMl = quantidadeDoses * bebida.dosagem;

        // Cria registros individuais para cada dose
        for (let i = 0; i < quantidadeDoses; i++) {
            const registro = {
                id: Date.now() + i,
                bebidaId: bebida.id,
                bebidaNome: bebida.nome,
                bebidaTipo: bebida.tipo,
                dosagem: bebida.dosagem,
                timestamp: new Date().toISOString()
            };

            this.registros.unshift(registro);
        }

        this.salvarRegistros();
        this.atualizarTotalHoje();
        this.renderizarRelatorio();

        // Feedback visual
        this.mostrarFeedback(`${quantidadeDoses} dose(s) de ${bebida.nome} registrada(s)! Total: ${totalMl}ml`, 'success');

        // Reseta o contador
        this.contadores[bebidaId] = 0;
        this.atualizarCardBebida(bebidaId);
    }

    atualizarTotalHoje() {
        const hoje = new Date().toDateString();
        const total = this.registros
            .filter(reg => new Date(reg.timestamp).toDateString() === hoje)
            .reduce((sum, reg) => sum + reg.dosagem, 0);
        
        const totalElement = document.getElementById('totalValue');
        totalElement.textContent = `${total}ml`;
        
        // Altera a cor baseado no total
        if (total > 300) {
            totalElement.style.color = 'var(--danger)';
        } else if (total > 150) {
            totalElement.style.color = 'var(--warning)';
        } else {
            totalElement.style.color = 'var(--accent)';
        }
    }

    renderizarRelatorio() {
        const filtro = document.getElementById('filtroData').value;
        const registrosFiltrados = this.filtrarRegistros(filtro);
        const agrupados = this.agruparPorData(registrosFiltrados);
        
        const container = document.getElementById('listaRelatorio');
        container.innerHTML = '';

        if (Object.keys(agrupados).length === 0) {
            container.innerHTML = '<div class="vazio">Nenhum registro encontrado</div>';
            this.atualizarResumo([]);
            return;
        }

        for (const [data, registros] of Object.entries(agrupados)) {
            const dataGroup = this.criarGrupoData(data, registros);
            container.appendChild(dataGroup);
        }

        this.atualizarResumo(registrosFiltrados);
    }

    filtrarRegistros(filtro) {
        const agora = new Date();
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);

        switch (filtro) {
            case 'hoje':
                return this.registros.filter(reg => 
                    new Date(reg.timestamp) >= hoje
                );
            case 'ontem':
                return this.registros.filter(reg => {
                    const dataReg = new Date(reg.timestamp);
                    return dataReg >= ontem && dataReg < hoje;
                });
            case 'semana':
                const semanaPassada = new Date(hoje);
                semanaPassada.setDate(semanaPassada.getDate() - 7);
                return this.registros.filter(reg => 
                    new Date(reg.timestamp) >= semanaPassada
                );
            case 'mes':
                const mesPassado = new Date(hoje);
                mesPassado.setMonth(mesPassado.getMonth() - 1);
                return this.registros.filter(reg => 
                    new Date(reg.timestamp) >= mesPassado
                );
            default:
                return [...this.registros];
        }
    }

    agruparPorData(registros) {
        return registros.reduce((grupos, registro) => {
            const data = new Date(registro.timestamp).toDateString();
            if (!grupos[data]) grupos[data] = [];
            grupos[data].push(registro);
            return grupos;
        }, {});
    }

    criarGrupoData(dataString, registros) {
        const data = new Date(dataString);
        const hoje = new Date().toDateString();
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);

        let tituloData;
        if (dataString === hoje) {
            tituloData = 'Hoje';
        } else if (dataString === ontem.toDateString()) {
            tituloData = 'Ontem';
        } else {
            tituloData = data.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
            });
        }

        const totalDia = registros.reduce((sum, reg) => sum + reg.dosagem, 0);

        const dataGroup = document.createElement('div');
        dataGroup.className = 'data-group';

        dataGroup.innerHTML = `
            <div class="data-header">
                <div class="data-title">${tituloData}</div>
                <div class="data-subtitle">
                    ${data.toLocaleDateString('pt-BR')} • Total: ${totalDia}ml
                </div>
            </div>
            <div class="registros-do-dia">
                ${registros.map(reg => this.criarItemRegistro(reg)).join('')}
            </div>
        `;

        return dataGroup;
    }

    criarItemRegistro(registro) {
        const data = new Date(registro.timestamp);
        const hora = data.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        return `
            <div class="registro-item ${registro.bebidaTipo}">
                <div class="registro-info">
                    <div class="registro-hora">${hora}</div>
                    <div class="registro-detalhes">
                        ${registro.bebidaNome} • ${this.formatarTipo(registro.bebidaTipo)}
                    </div>
                </div>
                <div class="registro-dosagem">${registro.dosagem}ml</div>
            </div>
        `;
    }

    formatarTipo(tipo) {
        const tipos = {
            'cachaca': 'Cachaça',
            'vodka': 'Vodka',
            'whiskey': 'Whiskey',
            'tequila': 'Tequila',
            'rum': 'Rum',
            'gin': 'Gin',
            'outro': 'Outro'
        };
        return tipos[tipo] || tipo;
    }

    atualizarResumo(registros) {
        const total = registros.reduce((sum, reg) => sum + reg.dosagem, 0);
        
        // Calcular média por dia
        const dias = new Set(registros.map(reg => 
            new Date(reg.timestamp).toDateString()
        )).size;
        const media = dias > 0 ? Math.round(total / dias) : 0;

        document.getElementById('totalPeriodo').textContent = `${total}ml`;
        document.getElementById('mediaDia').textContent = `${media}ml`;
    }

    exportarRelatorio() {
        if (this.registros.length === 0) {
            this.mostrarFeedback('Nenhum dado para exportar!', 'error');
            return;
        }

        const csv = this.gerarCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dataAtual = new Date().toISOString().split('T')[0];
        
        a.href = url;
        a.download = `drinkcounter-${dataAtual}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.mostrarFeedback('Relatório exportado com sucesso!', 'success');
    }

    gerarCSV() {
        const headers = ['Data', 'Hora', 'Bebida', 'Tipo', 'Dosagem (ml)'];
        const linhas = this.registros.map(reg => {
            const data = new Date(reg.timestamp);
            return [
                data.toLocaleDateString('pt-BR'),
                data.toLocaleTimeString('pt-BR'),
                `"${reg.bebidaNome.replace(/"/g, '""')}"`,
                `"${this.formatarTipo(reg.bebidaTipo)}"`,
                reg.dosagem
            ];
        });
        
        return [headers, ...linhas].map(row => row.join(',')).join('\n');
    }

    mostrarFeedback(mensagem, tipo = 'info') {
        // Remove feedback anterior se existir
        const feedbackAnterior = document.querySelector('.feedback');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }

        // Cria elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = `feedback feedback-${tipo}`;
        feedback.textContent = mensagem;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'error' ? 'var(--danger)' : tipo === 'success' ? 'var(--success)' : tipo === 'warning' ? 'var(--warning)' : 'var(--accent)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(feedback);

        // Remove após 3 segundos
        setTimeout(() => {
            feedback.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 3000);
    }

    carregarBebidas() {
        try {
            const saved = localStorage.getItem('drinkcounter-bebidas');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Erro ao carregar bebidas:', error);
            return [];
        }
    }

    carregarRegistros() {
        try {
            const saved = localStorage.getItem('drinkcounter-registros');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            return [];
        }
    }

    salvarBebidas() {
        try {
            localStorage.setItem('drinkcounter-bebidas', JSON.stringify(this.bebidas));
        } catch (error) {
            console.error('Erro ao salvar bebidas:', error);
            this.mostrarFeedback('Erro ao salvar bebidas!', 'error');
        }
    }

    salvarRegistros() {
        try {
            localStorage.setItem('drinkcounter-registros', JSON.stringify(this.registros));
        } catch (error) {
            console.error('Erro ao salvar registros:', error);
            this.mostrarFeedback('Erro ao salvar registros!', 'error');
        }
    }
}

// Inicializar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DrinkCounter();
});