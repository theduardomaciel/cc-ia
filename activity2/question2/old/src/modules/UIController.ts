import { KnowledgeBase } from './KnowledgeBase';
import { InferenceEngine } from './InferenceEngine';
import { ExplanationSystem } from './ExplanationSystem';
import { NaturalLanguageInterface } from './NaturalLanguageInterface';

export interface ExpertSystemLike {
    knowledgeBase: KnowledgeBase;
    inferenceEngine: InferenceEngine;
    explanationSystem: ExplanationSystem;
    nlInterface: NaturalLanguageInterface;
}

export class UIController {
    private currentTab = 'knowledge';
    constructor(private expertSystem: ExpertSystemLike) { }

    initialize() {
        this.setupTabNavigation();
        this.setupKnowledgeBaseTab();
        this.setupInferenceTab();
        this.setupExplanationTab();
        this.setupDialogTab();
    }

    private setupTabNavigation() {
        const tabs = ['knowledge', 'inference', 'explanation', 'dialog'];
        tabs.forEach(tabName => {
            const tabButton = document.getElementById(`tab-${tabName}`);
            if (tabButton) tabButton.addEventListener('click', () => this.switchTab(tabName));
        });
    }

    private switchTab(tabName: string) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        const selectedTab = document.getElementById(`tab-${tabName}`);
        const selectedContent = document.getElementById(`content-${tabName}`);
        if (selectedTab && selectedContent) {
            selectedTab.classList.add('tab-active');
            selectedContent.classList.remove('hidden');
            this.currentTab = tabName;
        }
    }

    private setupKnowledgeBaseTab() {
        const ruleForm = document.getElementById('rule-form');
        ruleForm?.addEventListener('submit', e => { e.preventDefault(); this.addRule(); });
        const factForm = document.getElementById('fact-form');
        factForm?.addEventListener('submit', e => { e.preventDefault(); this.addFact(); });
    }

    private setupInferenceTab() {
        document.getElementById('forward-btn')?.addEventListener('click', () => this.runForwardChaining());
        document.getElementById('backward-btn')?.addEventListener('click', () => this.runBackwardChaining());
        document.getElementById('query-form')?.addEventListener('submit', e => { e.preventDefault(); this.runBackwardChaining(); });
    }

    private setupExplanationTab() {
        document.getElementById('why-form')?.addEventListener('submit', e => { e.preventDefault(); this.explainWhy(); });
        document.getElementById('how-form')?.addEventListener('submit', e => { e.preventDefault(); this.explainHow(); });
    }

    private setupDialogTab() {
        document.getElementById('chat-form')?.addEventListener('submit', e => { e.preventDefault(); this.sendChatMessage(); });
        this.addChatMessage('Sistema', this.expertSystem.nlInterface.getHelpMessage(), 'bot');
    }

    private addRule() {
        const conditionInput = document.getElementById('rule-condition') as HTMLInputElement | null;
        const conclusionInput = document.getElementById('rule-conclusion') as HTMLInputElement | null;
        if (conditionInput && conclusionInput) {
            const condition = conditionInput.value.trim();
            const conclusion = conclusionInput.value.trim();
            if (condition && conclusion) {
                this.expertSystem.knowledgeBase.addRule(condition, conclusion);
                this.updateRulesList();
                conditionInput.value = '';
                conclusionInput.value = '';
                this.showNotification('Regra adicionada com sucesso!', 'success');
            } else this.showNotification('Por favor, preencha todos os campos.', 'error');
        }
    }

    private addFact() {
        const factInput = document.getElementById('fact-input') as HTMLInputElement | null;
        if (factInput) {
            const fact = factInput.value.trim();
            if (fact) {
                this.expertSystem.knowledgeBase.addFact(fact);
                this.updateFactsList();
                factInput.value = '';
                this.showNotification('Fato adicionado com sucesso!', 'success');
            } else this.showNotification('Por favor, informe um fato.', 'error');
        }
    }

    private runForwardChaining() {
        const result = this.expertSystem.inferenceEngine.forwardChaining();
        this.displayInferenceResult(result as any, 'forward');
    }
    private runBackwardChaining() {
        const queryInput = document.getElementById('query-input') as HTMLInputElement | null;
        if (queryInput) {
            const query = queryInput.value.trim();
            if (query) {
                const result = this.expertSystem.inferenceEngine.backwardChaining(query);
                this.displayInferenceResult(result as any, 'backward');
            } else this.showNotification('Por favor, informe uma consulta.', 'error');
        }
    }

    private explainWhy() {
        const whyInput = document.getElementById('why-input') as HTMLInputElement | null;
        if (whyInput) {
            const conclusion = whyInput.value.trim();
            if (conclusion) {
                const explanation = this.expertSystem.explanationSystem.explainWhy(conclusion);
                this.displayWhyExplanation(explanation);
            } else this.showNotification('Por favor, informe uma conclusão para explicar.', 'error');
        }
    }
    private explainHow() {
        const howInput = document.getElementById('how-input') as HTMLInputElement | null;
        if (howInput) {
            const goal = howInput.value.trim();
            if (goal) {
                const explanation = this.expertSystem.explanationSystem.explainHow(goal);
                this.displayHowExplanation(explanation);
            } else this.showNotification('Por favor, informe um objetivo para explicar.', 'error');
        }
    }

    private sendChatMessage() {
        const chatInput = document.getElementById('chat-input') as HTMLInputElement | null;
        if (chatInput) {
            const message = chatInput.value.trim();
            if (message) {
                this.addChatMessage('Usuário', message, 'user');
                const response = this.expertSystem.nlInterface.processMessage(message);
                this.addChatMessage('Sistema', response.botResponse, 'bot');
                chatInput.value = '';
                if (response.type === 'knowledge_update') { this.updateRulesList(); this.updateFactsList(); }
            }
        }
    }

    updateRulesList() {
        const rulesList = document.getElementById('rules-list');
        if (rulesList) {
            const rules = this.expertSystem.knowledgeBase.getAllRules();
            rulesList.innerHTML = rules.length === 0
                ? '<li class="text-gray-500 italic">Nenhuma regra cadastrada</li>'
                : rules.map(rule => `
          <li class="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span class="text-sm"><strong>SE</strong> ${rule.condition} <strong>ENTÃO</strong> ${rule.conclusion}</span>
            <button data-rule-id="${rule.id}" class="btn-danger text-xs px-2 py-1">Remover</button>
          </li>`).join('');
            // Delegação de evento para remover regras
            rulesList.querySelectorAll('button[data-rule-id]')
                .forEach(btn => btn.addEventListener('click', () => {
                    const id = (btn as HTMLButtonElement).getAttribute('data-rule-id');
                    if (id && this.expertSystem.knowledgeBase.removeRule(id)) { this.updateRulesList(); this.showNotification('Regra removida', 'success'); }
                }));
        }
    }

    updateFactsList() {
        const factsList = document.getElementById('facts-list');
        if (factsList) {
            const facts = this.expertSystem.knowledgeBase.getAllFacts();
            factsList.innerHTML = facts.length === 0
                ? '<li class="text-gray-500 italic">Nenhum fato conhecido</li>'
                : facts.map(fact => `
          <li class="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span class="text-sm">${fact}</span>
            <button data-fact="${fact}" class="btn-danger text-xs px-2 py-1">Remover</button>
          </li>`).join('');
            factsList.querySelectorAll('button[data-fact]')
                .forEach(btn => btn.addEventListener('click', () => {
                    const fact = (btn as HTMLButtonElement).getAttribute('data-fact');
                    if (fact && this.expertSystem.knowledgeBase.removeFact(fact)) { this.updateFactsList(); this.showNotification('Fato removido', 'success'); }
                }));
        }
    }

    private displayInferenceResult(result: any, method: 'forward' | 'backward') {
        const resultDiv = document.getElementById('inference-result');
        const stepsDiv = document.getElementById('inference-steps');
        if (resultDiv) {
            if (method === 'forward') {
                resultDiv.innerHTML = `<div class="space-y-2"><h4 class="font-semibold">Encadeamento para Frente</h4><p><strong>Novos fatos derivados:</strong> ${result.derivedFacts.length}</p><div class="bg-green-50 p-3 rounded">${result.derivedFacts.length > 0 ? result.derivedFacts.map((f: string) => `<div>• ${f}</div>`).join('') : '<div class="text-gray-600">Nenhum novo fato foi derivado</div>'}</div></div>`;
            } else {
                resultDiv.innerHTML = `<div class="space-y-2"><h4 class="font-semibold">Encadeamento para Trás</h4><p><strong>Objetivo:</strong> ${result.goal}</p><div class="p-3 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}"><strong>${result.success ? '✓ PROVADO' : '✗ NÃO PROVADO'}</strong></div></div>`;
            }
        }
        if (stepsDiv && result.steps) {
            stepsDiv.innerHTML = `<h4 class="font-semibold mb-2">Passos da Inferência:</h4><div class="space-y-1 max-h-60 overflow-y-auto">${result.steps.map((s: string) => `<div class=\"text-sm p-2 bg-gray-50 rounded\">${s}</div>`).join('')}</div>`;
        }
    }

    private displayWhyExplanation(explanation: any) {
        const whyResult = document.getElementById('why-result');
        if (whyResult) {
            whyResult.classList.remove('hidden');
            const natural = this.expertSystem.explanationSystem.generateNaturalLanguageExplanation(explanation);
            whyResult.innerHTML = `<h4 class=\"font-semibold mb-2\">Explicação:</h4><div class=\"whitespace-pre-line text-sm\">${natural}</div>`;
        }
    }
    private displayHowExplanation(explanation: any) {
        const howResult = document.getElementById('how-result');
        if (howResult) {
            howResult.classList.remove('hidden');
            const natural = this.expertSystem.explanationSystem.generateNaturalLanguageExplanation(explanation);
            howResult.innerHTML = `<h4 class=\"font-semibold mb-2\">Estratégias:</h4><div class=\"whitespace-pre-line text-sm\">${natural}</div>`;
        }
    }

    private addChatMessage(sender: string, message: string, type: 'user' | 'bot') {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;
            messageDiv.innerHTML = `<div class=\"max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${type === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'}\"><div class=\"text-xs opacity-75 mb-1\">${sender}</div><div class=\"text-sm whitespace-pre-line\">${message}</div></div>`;
            chatMessages.appendChild(messageDiv); chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => { notification.remove(); }, 3000);
    }
}

declare global { interface Window { uiController: UIController | null; } }
window.uiController = null;