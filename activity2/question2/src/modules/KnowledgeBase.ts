import { Engine } from 'json-rules-engine';
import type { KnowledgeRule, Fact, SystemState } from '../types';

export class KnowledgeBase {
    private rules: Map<string, KnowledgeRule> = new Map();
    private facts: Map<string, Fact> = new Map();
    private engine: Engine;
    private ruleCounter = 0;
    private factCounter = 0;

    constructor() {
        this.engine = new Engine();
        this.setupEngine();
    }

    private setupEngine(): void {
        // Configurações do engine json-rules-engine
        this.engine.on('success', (event) => {
            console.log('Rule triggered:', event);
        });

        this.engine.on('failure', (event) => {
            console.log('Rule failed:', event);
        });
    }

    // === GESTÃO DE REGRAS ===

    addRule(condition: string, conclusion: string, options?: {
        name?: string;
        priority?: number;
        tags?: string[];
    }): string {
        const id = `rule_${++this.ruleCounter}`;
        const rule: KnowledgeRule = {
            id,
            name: options?.name || `Regra ${this.ruleCounter}`,
            condition: this.normalizeText(condition),
            conclusion: this.normalizeText(conclusion),
            priority: options?.priority || 1,
            active: true,
            createdAt: new Date(),
            tags: options?.tags || []
        };

        this.rules.set(id, rule);
        this.updateEngineRule(rule);
        return id;
    }

    private updateEngineRule(rule: KnowledgeRule): void {
        if (!rule.active) return;

        try {
            // Converte a regra SE...ENTÃO para formato json-rules-engine
            const engineRule = this.convertToEngineRule(rule);
            this.engine.addRule(engineRule);
        } catch (error) {
            console.error('Erro ao adicionar regra ao engine:', error);
        }
    }

    private convertToEngineRule(rule: KnowledgeRule): any {
        // Parsing simples de condições SE...ENTÃO
        // Esta é uma implementação básica que pode ser expandida
        const condition = rule.condition.toLowerCase();
        const conclusion = rule.conclusion.toLowerCase();

        // Extrai fatos da condição (ex: "idade > 18" -> {fact: 'idade', operator: 'greaterThan', value: 18})
        const parsedCondition = this.parseCondition(condition);

        return {
            conditions: {
                all: [parsedCondition]
            },
            event: {
                type: 'rule-triggered',
                params: {
                    ruleId: rule.id,
                    conclusion: conclusion,
                    originalRule: rule
                }
            },
            priority: rule.priority,
            name: rule.name
        };
    }

    private parseCondition(condition: string): any {
        // Parsing simples - pode ser expandido para suportar mais operadores
        const operators = [
            { pattern: /(\w+)\s*>=\s*(\d+)/, operator: 'greaterThanInclusive' },
            { pattern: /(\w+)\s*>\s*(\d+)/, operator: 'greaterThan' },
            { pattern: /(\w+)\s*<=\s*(\d+)/, operator: 'lessThanInclusive' },
            { pattern: /(\w+)\s*<\s*(\d+)/, operator: 'lessThan' },
            { pattern: /(\w+)\s*=\s*"([^"]+)"/, operator: 'equal' },
            { pattern: /(\w+)\s*=\s*(\w+)/, operator: 'equal' },
            { pattern: /(\w+)\s*!=\s*(\w+)/, operator: 'notEqual' }
        ];

        for (const { pattern, operator } of operators) {
            const match = condition.match(pattern);
            if (match) {
                const fact = match[1];
                let value: any = match[2];

                // Converte números
                if (!isNaN(Number(value))) {
                    value = Number(value);
                }

                return {
                    fact,
                    operator,
                    value
                };
            }
        }

        // Fallback para condições simples
        return {
            fact: condition.trim(),
            operator: 'equal',
            value: true
        };
    }

    removeRule(ruleId: string): boolean {
        if (this.rules.has(ruleId)) {
            this.rules.delete(ruleId);
            // TODO: Remover do engine json-rules-engine também
            return true;
        }
        return false;
    }

    updateRule(ruleId: string, updates: Partial<KnowledgeRule>): boolean {
        const rule = this.rules.get(ruleId);
        if (rule) {
            Object.assign(rule, updates);
            this.updateEngineRule(rule);
            return true;
        }
        return false;
    }

    // === GESTÃO DE FATOS ===

    addFact(name: string, value: any, options?: {
        type?: 'string' | 'number' | 'boolean' | 'object';
        description?: string;
    }): string {
        const id = `fact_${++this.factCounter}`;
        const fact: Fact = {
            id,
            name: this.normalizeText(name),
            value,
            type: options?.type || this.inferType(value),
            description: options?.description,
            createdAt: new Date()
        };

        this.facts.set(id, fact);

        // Adiciona fato ao engine
        this.engine.addFact(fact.name, value);

        return id;
    }

    private inferType(value: any): 'string' | 'number' | 'boolean' | 'object' {
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'object') return 'object';
        return 'string';
    }

    removeFact(factId: string): boolean {
        const fact = this.facts.get(factId);
        if (fact) {
            this.facts.delete(factId);
            // TODO: Remover do engine json-rules-engine
            return true;
        }
        return false;
    }

    updateFact(factId: string, value: any): boolean {
        const fact = this.facts.get(factId);
        if (fact) {
            fact.value = value;
            fact.type = this.inferType(value);
            // Atualiza no engine
            this.engine.addFact(fact.name, value);
            return true;
        }
        return false;
    }

    // === CONSULTAS ===

    getAllRules(): KnowledgeRule[] {
        return Array.from(this.rules.values());
    }

    getActiveRules(): KnowledgeRule[] {
        return Array.from(this.rules.values()).filter(rule => rule.active);
    }

    getAllFacts(): Fact[] {
        return Array.from(this.facts.values());
    }

    getFactByName(name: string): Fact | undefined {
        const normalizedName = this.normalizeText(name);
        return Array.from(this.facts.values()).find(fact => fact.name === normalizedName);
    }

    getRuleById(id: string): KnowledgeRule | undefined {
        return this.rules.get(id);
    }

    searchRules(query: string): KnowledgeRule[] {
        const normalizedQuery = this.normalizeText(query);
        return Array.from(this.rules.values()).filter(rule =>
            rule.condition.includes(normalizedQuery) ||
            rule.conclusion.includes(normalizedQuery) ||
            rule.name?.toLowerCase().includes(normalizedQuery) ||
            rule.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
        );
    }

    // === EXECUÇÃO DE REGRAS ===

    async runEngine(facts?: Record<string, any>): Promise<any> {
        try {
            const result = await this.engine.run(facts || {});
            return result;
        } catch (error) {
            console.error('Erro ao executar engine:', error);
            throw error;
        }
    }

    getEngine(): Engine {
        return this.engine;
    }

    // === UTILITÁRIOS ===

    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    }

    // === PERSISTÊNCIA ===

    exportState(): SystemState {
        return {
            rules: this.getAllRules(),
            facts: this.getAllFacts(),
            chatHistory: [], // Será preenchido pelo controlador principal
            currentSession: {
                id: crypto.randomUUID(),
                startTime: new Date(),
                operations: this.ruleCounter + this.factCounter
            }
        };
    }

    importState(state: SystemState): void {
        // Limpa estado atual
        this.rules.clear();
        this.facts.clear();
        this.engine = new Engine();
        this.setupEngine();

        // Importa regras
        state.rules.forEach(rule => {
            this.rules.set(rule.id, rule);
            if (rule.active) {
                this.updateEngineRule(rule);
            }
        });

        // Importa fatos
        state.facts.forEach(fact => {
            this.facts.set(fact.id, fact);
            this.engine.addFact(fact.name, fact.value);
        });

        // Atualiza contadores
        this.ruleCounter = Math.max(...state.rules.map(r =>
            parseInt(r.id.replace('rule_', '')) || 0
        ), 0);
        this.factCounter = Math.max(...state.facts.map(f =>
            parseInt(f.id.replace('fact_', '')) || 0
        ), 0);
    }

    clear(): void {
        this.rules.clear();
        this.facts.clear();
        this.engine = new Engine();
        this.setupEngine();
        this.ruleCounter = 0;
        this.factCounter = 0;
    }
}