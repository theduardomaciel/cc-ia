import type { InferenceResult } from '../types';
import { KnowledgeBase } from './KnowledgeBase';
import { InferenceEngine } from './InferenceEngine';
import { ExplanationSystem } from './ExplanationSystem';
import { NaturalLanguageInterface } from './NaturalLanguageInterface';

export class UIController {
    // private currentTab = 'knowledge';
    private knowledgeBase: KnowledgeBase;
    private inferenceEngine: InferenceEngine;
    private explanationSystem: ExplanationSystem;
    private nlInterface: NaturalLanguageInterface;

    constructor() {
        this.knowledgeBase = new KnowledgeBase();
        this.inferenceEngine = new InferenceEngine(this.knowledgeBase);
        this.explanationSystem = new ExplanationSystem(this.knowledgeBase, this.inferenceEngine);
        this.nlInterface = new NaturalLanguageInterface(
            this.knowledgeBase,
            this.inferenceEngine,
            this.explanationSystem
        );
    }

    initialize(): void {
        this.setupTabNavigation();
        this.setupKnowledgeTab();
        this.setupInferenceTab();
        this.setupExplanationTab();
        this.setupChatTab();
        this.loadSampleData();
        this.updateAllDisplays();
    }

    // === NAVEGAÇÃO DE ABAS ===

    private setupTabNavigation(): void {
        const tabs = ['knowledge', 'inference', 'explanation', 'chat'];
        tabs.forEach(tabName => {
            const tabButton = document.getElementById(`tab-${tabName}`);
            if (tabButton) {
                tabButton.addEventListener('click', () => this.switchTab(tabName));
            }
        });
    }

    private switchTab(tabName: string): void {
        // Remove classe ativa de todas as abas
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('bg-blue-600', 'text-white');
            tab.classList.add('bg-gray-200', 'text-gray-700');
        });

        // Remove classe ativa de todos os conteúdos
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Ativa a aba selecionada
        const selectedTab = document.getElementById(`tab-${tabName}`);
        const selectedContent = document.getElementById(`content-${tabName}`);

        if (selectedTab && selectedContent) {
            selectedTab.classList.remove('bg-gray-200', 'text-gray-700');
            selectedTab.classList.add('bg-blue-600', 'text-white');
            selectedContent.classList.remove('hidden');
            // this.currentTab = tabName;

            // Atualiza o display da aba ativa
            this.updateTabDisplay(tabName);
        }
    }

    private updateTabDisplay(tabName: string): void {
        switch (tabName) {
            case 'knowledge':
                this.updateRulesList();
                this.updateFactsList();
                break;
            case 'inference':
                // Atualização já feita nos métodos de inferência
                break;
            case 'explanation':
                // Atualização já feita nos métodos de explicação
                break;
            case 'chat':
                this.updateChatDisplay();
                break;
        }
    }

    // === ABA DE CONHECIMENTO ===

    private setupKnowledgeTab(): void {
        // Formulário de regras
        const ruleForm = document.getElementById('rule-form');
        if (ruleForm) {
            ruleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addRule();
            });
        }

        // Formulário de fatos
        const factForm = document.getElementById('fact-form');
        if (factForm) {
            factForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addFact();
            });
        }

        // Botão para limpar base
        const clearButton = document.getElementById('clear-kb');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearKnowledgeBase());
        }

        // Botões de exemplo
        const exampleRulesBtn = document.getElementById('load-example-rules');
        if (exampleRulesBtn) {
            exampleRulesBtn.addEventListener('click', () => this.loadExampleRules());
        }
    }

    private addRule(): void {
        const conditionInput = document.getElementById('rule-condition') as HTMLInputElement;
        const conclusionInput = document.getElementById('rule-conclusion') as HTMLInputElement;
        const nameInput = document.getElementById('rule-name') as HTMLInputElement;

        if (conditionInput && conclusionInput) {
            const condition = conditionInput.value.trim();
            const conclusion = conclusionInput.value.trim();
            const name = nameInput?.value.trim() || undefined;

            if (condition && conclusion) {
                try {
                    this.knowledgeBase.addRule(condition, conclusion, { name });
                    this.updateRulesList();

                    // Limpa os campos
                    conditionInput.value = '';
                    conclusionInput.value = '';
                    if (nameInput) nameInput.value = '';

                    this.showNotification('✅ Regra adicionada com sucesso!', 'success');
                } catch (error) {
                    this.showNotification(`❌ Erro ao adicionar regra: ${error}`, 'error');
                }
            } else {
                this.showNotification('❌ Por favor, preencha todos os campos obrigatórios.', 'error');
            }
        }
    }

    private addFact(): void {
        const nameInput = document.getElementById('fact-name') as HTMLInputElement;
        const valueInput = document.getElementById('fact-value') as HTMLInputElement;
        const typeSelect = document.getElementById('fact-type') as HTMLSelectElement;

        if (nameInput && valueInput) {
            const name = nameInput.value.trim();
            let value: any = valueInput.value.trim();
            const type = typeSelect?.value as 'string' | 'number' | 'boolean' | 'object' || 'string';

            if (name && value !== '') {
                try {
                    // Converte o valor conforme o tipo
                    switch (type) {
                        case 'number':
                            value = Number(value);
                            if (isNaN(value)) throw new Error('Valor numérico inválido');
                            break;
                        case 'boolean':
                            value = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'verdadeiro';
                            break;
                        case 'object':
                            value = JSON.parse(value);
                            break;
                        // string mantém como está
                    }

                    this.knowledgeBase.addFact(name, value, { type });
                    this.updateFactsList();

                    // Limpa os campos
                    nameInput.value = '';
                    valueInput.value = '';
                    if (typeSelect) typeSelect.value = 'string';

                    this.showNotification('✅ Fato adicionado com sucesso!', 'success');
                } catch (error) {
                    this.showNotification(`❌ Erro ao adicionar fato: ${error}`, 'error');
                }
            } else {
                this.showNotification('❌ Por favor, preencha todos os campos.', 'error');
            }
        }
    }

    private updateRulesList(): void {
        const container = document.getElementById('rules-list');
        if (!container) return;

        const rules = this.knowledgeBase.getAllRules();

        if (rules.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma regra definida</p>';
            return;
        }

        container.innerHTML = rules.map(rule => `
      <div class="border rounded-lg p-4 ${rule.active ? 'bg-white' : 'bg-gray-50'}">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium text-gray-900">${rule.name || rule.id}</h4>
          <div class="flex gap-2">
            <button 
              onclick="uiController.toggleRule('${rule.id}')"
              class="text-sm px-2 py-1 rounded ${rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}"
            >
              ${rule.active ? 'Ativa' : 'Inativa'}
            </button>
            <button 
              onclick="uiController.removeRule('${rule.id}')"
              class="text-sm px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
            >
              Remover
            </button>
          </div>
        </div>
        <div class="text-sm text-gray-600 space-y-1">
          <div><span class="font-medium">SE:</span> ${rule.condition}</div>
          <div><span class="font-medium">ENTÃO:</span> ${rule.conclusion}</div>
          <div class="flex gap-4 text-xs text-gray-500">
            <span>Prioridade: ${rule.priority}</span>
            <span>Criada: ${rule.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `).join('');
    }

    private updateFactsList(): void {
        const container = document.getElementById('facts-list');
        if (!container) return;

        const facts = this.knowledgeBase.getAllFacts();

        if (facts.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum fato definido</p>';
            return;
        }

        container.innerHTML = facts.map(fact => `
      <div class="border rounded-lg p-3 bg-white">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium text-gray-900">${fact.name}</h4>
          <button 
            onclick="uiController.removeFact('${fact.id}')"
            class="text-sm px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
          >
            Remover
          </button>
        </div>
        <div class="text-sm text-gray-600 space-y-1">
          <div><span class="font-medium">Valor:</span> ${JSON.stringify(fact.value)}</div>
          <div><span class="font-medium">Tipo:</span> ${fact.type}</div>
          ${fact.description ? `<div><span class="font-medium">Descrição:</span> ${fact.description}</div>` : ''}
          <div class="text-xs text-gray-500">Criado: ${fact.createdAt.toLocaleDateString()}</div>
        </div>
      </div>
    `).join('');
    }

    // === ABA DE INFERÊNCIA ===

    private setupInferenceTab(): void {
        // Encadeamento para frente
        const forwardBtn = document.getElementById('forward-btn');
        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => this.runForwardChaining());
        }

        // Encadeamento para trás
        const backwardForm = document.getElementById('backward-form');
        if (backwardForm) {
            backwardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.runBackwardChaining();
            });
        }
    }

    private async runForwardChaining(): Promise<void> {
        try {
            this.showLoading('inference-results', 'Executando encadeamento para frente...');

            const result = await this.inferenceEngine.forwardChaining();
            this.displayInferenceResult(result);

        } catch (error) {
            this.showNotification(`❌ Erro na inferência: ${error}`, 'error');
        }
    }

    private async runBackwardChaining(): Promise<void> {
        const goalInput = document.getElementById('backward-goal') as HTMLInputElement;

        if (!goalInput || !goalInput.value.trim()) {
            this.showNotification('❌ Por favor, informe um objetivo para buscar.', 'error');
            return;
        }

        try {
            this.showLoading('inference-results', 'Executando encadeamento para trás...');

            const goal = goalInput.value.trim();
            const result = await this.inferenceEngine.backwardChaining(goal);
            this.displayInferenceResult(result);

        } catch (error) {
            this.showNotification(`❌ Erro na inferência: ${error}`, 'error');
        }
    }

    private displayInferenceResult(result: InferenceResult): void {
        const container = document.getElementById('inference-results');
        if (!container) return;

        const successIcon = result.success ? '✅' : '❌';
        const methodName = result.method === 'forward' ? 'Encadeamento para Frente' : 'Encadeamento para Trás';

        container.innerHTML = `
      <div class="border rounded-lg p-4 bg-white">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">${successIcon}</span>
          <h3 class="text-lg font-semibold">${methodName}</h3>
        </div>
        
        ${result.goal ? `<div class="mb-3"><span class="font-medium">Objetivo:</span> ${result.goal}</div>` : ''}
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 class="font-medium mb-2">📊 Estatísticas</h4>
            <div class="text-sm space-y-1">
              <div>Status: <span class="${result.success ? 'text-green-600' : 'text-red-600'} font-medium">${result.success ? 'Sucesso' : 'Falha'}</span></div>
              <div>Tempo: ${result.executionTime}ms</div>
              <div>Regras aplicadas: ${result.appliedRules.length}</div>
              <div>Fatos derivados: ${result.derivedFacts.length}</div>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium mb-2">⚙️ Regras Utilizadas</h4>
            <div class="text-sm space-y-1 max-h-32 overflow-y-auto">
              ${result.appliedRules.length > 0
                ? result.appliedRules.map(rule => `<div class="p-2 bg-gray-50 rounded text-xs">${rule.name || rule.id}</div>`).join('')
                : '<div class="text-gray-500">Nenhuma regra aplicada</div>'
            }
            </div>
          </div>
        </div>
        
        <div class="mb-4">
          <h4 class="font-medium mb-2">📝 Passos da Execução</h4>
          <div class="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
            <pre class="text-xs text-gray-700 whitespace-pre-wrap">${result.steps.join('\n')}</pre>
          </div>
        </div>
        
        ${result.proof && result.proof.length > 0 ? `
          <div>
            <h4 class="font-medium mb-2">🎯 Prova</h4>
            <div class="bg-blue-50 rounded p-3">
              <div class="text-sm space-y-1">
                ${result.proof.map((step, i) => `<div>${i + 1}. ${step}</div>`).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    }

    // === ABA DE EXPLICAÇÃO ===

    private setupExplanationTab(): void {
        // Formulário "Por quê?"
        const whyForm = document.getElementById('why-form');
        if (whyForm) {
            whyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.explainWhy();
            });
        }

        // Formulário "Como?"
        const howForm = document.getElementById('how-form');
        if (howForm) {
            howForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.explainHow();
            });
        }
    }

    private async explainWhy(): Promise<void> {
        const targetInput = document.getElementById('why-target') as HTMLInputElement;

        if (!targetInput || !targetInput.value.trim()) {
            this.showNotification('❌ Por favor, informe o que deseja explicar.', 'error');
            return;
        }

        try {
            this.showLoading('explanation-results', 'Gerando explicação...');

            const target = targetInput.value.trim();
            const explanation = await this.explanationSystem.explainWhy(target);

            const container = document.getElementById('explanation-results');
            if (container) {
                container.innerHTML = `
          <div class="border rounded-lg p-4 bg-white">
            <h3 class="text-lg font-semibold mb-4">🤔 Por que "${target}"?</h3>
            <div class="prose max-w-none">
              <pre class="whitespace-pre-wrap text-sm">${this.explanationSystem.formatWhyExplanation(explanation)}</pre>
            </div>
          </div>
        `;
            }

        } catch (error) {
            this.showNotification(`❌ Erro ao gerar explicação: ${error}`, 'error');
        }
    }

    private async explainHow(): Promise<void> {
        const goalInput = document.getElementById('how-goal') as HTMLInputElement;

        if (!goalInput || !goalInput.value.trim()) {
            this.showNotification('❌ Por favor, informe o objetivo que deseja alcançar.', 'error');
            return;
        }

        try {
            this.showLoading('explanation-results', 'Gerando explicação...');

            const goal = goalInput.value.trim();
            const explanation = await this.explanationSystem.explainHow(goal);

            const container = document.getElementById('explanation-results');
            if (container) {
                container.innerHTML = `
          <div class="border rounded-lg p-4 bg-white">
            <h3 class="text-lg font-semibold mb-4">🛠️ Como obter "${goal}"?</h3>
            <div class="prose max-w-none">
              <pre class="whitespace-pre-wrap text-sm">${this.explanationSystem.formatHowExplanation(explanation)}</pre>
            </div>
          </div>
        `;
            }

        } catch (error) {
            this.showNotification(`❌ Erro ao gerar explicação: ${error}`, 'error');
        }
    }

    // === ABA DE CHAT ===

    private setupChatTab(): void {
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
        }

        const clearChatBtn = document.getElementById('clear-chat');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChat());
        }

        // Adiciona mensagem de boas-vindas
        this.addSystemMessage('👋 Olá! Sou seu assistente de sistema especialista. Digite "ajuda" para ver os comandos disponíveis.');
    }

    private async sendChatMessage(): Promise<void> {
        const messageInput = document.getElementById('chat-input') as HTMLInputElement;

        if (!messageInput || !messageInput.value.trim()) return;

        const message = messageInput.value.trim();
        messageInput.value = '';

        // Adiciona mensagem do usuário ao chat
        this.addChatMessage(message, 'user');

        try {
            // Processa mensagem através da interface de linguagem natural
            const response = await this.nlInterface.processMessage(message);
            this.addChatMessage(response.content, 'system', response.data);

            // Atualiza displays se houve mudanças na base de conhecimento
            if (response.data?.type === 'rule_added' || response.data?.type === 'fact_added') {
                this.updateAllDisplays();
            }

        } catch (error) {
            this.addChatMessage(`❌ Erro ao processar mensagem: ${error}`, 'system');
        }
    }

    private addChatMessage(content: string, type: 'user' | 'system', _data?: any): void {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-4 ${type === 'user' ? 'text-right' : 'text-left'}`;

        const bubbleClass = type === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800';

        messageDiv.innerHTML = `
      <div class="inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleClass}">
        <div class="text-sm whitespace-pre-wrap">${content}</div>
        <div class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString()}</div>
      </div>
    `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    private addSystemMessage(content: string): void {
        this.addChatMessage(content, 'system');
    }

    private updateChatDisplay(): void {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        // Limpa e recarrega o histórico do chat
        chatContainer.innerHTML = '';

        const history = this.nlInterface.getChatHistory();
        history.forEach(msg => {
            this.addChatMessage(msg.content, msg.type, msg.data);
        });
    }

    private clearChat(): void {
        this.nlInterface.clearHistory();
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = '';
        }
        this.addSystemMessage('🔄 Chat limpo. Como posso ajudar?');
    }

    // === MÉTODOS AUXILIARES ===

    private updateAllDisplays(): void {
        this.updateRulesList();
        this.updateFactsList();
        // Atualiza estatísticas se houver
        this.updateStats();
    }

    private updateStats(): void {
        const statsContainer = document.getElementById('system-stats');
        if (statsContainer) {
            const rules = this.knowledgeBase.getAllRules();
            const facts = this.knowledgeBase.getAllFacts();

            statsContainer.innerHTML = `
        <div class="grid grid-cols-2 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">${rules.length}</div>
            <div class="text-sm text-gray-600">Regras</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">${facts.length}</div>
            <div class="text-sm text-gray-600">Fatos</div>
          </div>
        </div>
      `;
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
            }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    private showLoading(containerId: string, message: string): void {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span class="text-gray-600">${message}</span>
        </div>
      `;
        }
    }

    // === MÉTODOS PÚBLICOS PARA OS BOTÕES DA UI ===

    toggleRule(ruleId: string): void {
        const rule = this.knowledgeBase.getRuleById(ruleId);
        if (rule) {
            this.knowledgeBase.updateRule(ruleId, { active: !rule.active });
            this.updateRulesList();
            this.showNotification(`Regra ${rule.active ? 'ativada' : 'desativada'}`, 'success');
        }
    }

    removeRule(ruleId: string): void {
        if (confirm('Tem certeza que deseja remover esta regra?')) {
            this.knowledgeBase.removeRule(ruleId);
            this.updateRulesList();
            this.showNotification('Regra removida', 'success');
        }
    }

    removeFact(factId: string): void {
        if (confirm('Tem certeza que deseja remover este fato?')) {
            this.knowledgeBase.removeFact(factId);
            this.updateFactsList();
            this.showNotification('Fato removido', 'success');
        }
    }

    clearKnowledgeBase(): void {
        if (confirm('Tem certeza que deseja limpar toda a base de conhecimento?')) {
            this.knowledgeBase.clear();
            this.updateAllDisplays();
            this.showNotification('Base de conhecimento limpa', 'success');
        }
    }

    // === DADOS DE EXEMPLO ===

    private loadSampleData(): void {
        // Carrega alguns dados de exemplo para demonstração
        try {
            // Fatos de exemplo
            this.knowledgeBase.addFact('idade', 25, { description: 'Idade do usuário' });
            this.knowledgeBase.addFact('salario', 6000, { description: 'Salário mensal' });
            this.knowledgeBase.addFact('usuario_logado', true, { description: 'Status de login' });

            // Regras de exemplo
            this.knowledgeBase.addRule(
                'idade >= 18',
                'maior_de_idade',
                { name: 'Verificação de Maioridade' }
            );

            this.knowledgeBase.addRule(
                'salario > 5000',
                'cliente_premium',
                { name: 'Cliente Premium' }
            );

            this.knowledgeBase.addRule(
                'maior_de_idade e cliente_premium',
                'elegivel_cartao_credito',
                { name: 'Elegibilidade Cartão de Crédito' }
            );

        } catch (error) {
            console.warn('Erro ao carregar dados de exemplo:', error);
        }
    }

    private loadExampleRules(): void {
        try {
            const examples = [
                {
                    condition: 'temperatura > 30',
                    conclusion: 'dia_quente',
                    name: 'Detecção de Dia Quente'
                },
                {
                    condition: 'chuva = verdadeiro',
                    conclusion: 'levar_guarda_chuva',
                    name: 'Necessidade de Guarda-chuva'
                },
                {
                    condition: 'experiencia >= 5 e certificado = verdadeiro',
                    conclusion: 'desenvolvedor_senior',
                    name: 'Classificação de Desenvolvedor'
                }
            ];

            examples.forEach(example => {
                this.knowledgeBase.addRule(example.condition, example.conclusion, { name: example.name });
            });

            this.updateRulesList();
            this.showNotification('Regras de exemplo carregadas!', 'success');

        } catch (error) {
            this.showNotification(`Erro ao carregar exemplos: ${error}`, 'error');
        }
    }
}

// Torna o controlador disponível globalmente para os event handlers
declare global {
    interface Window {
        uiController: UIController;
    }
}