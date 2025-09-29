import type { KnowledgeRule, InferenceResult } from '../types';
import { KnowledgeBase } from './KnowledgeBase';

export class InferenceEngine {
    private knowledgeBase: KnowledgeBase;
    private inferenceHistory: Array<{
        timestamp: Date;
        method: 'forward' | 'backward';
        input: any;
        result: InferenceResult;
    }> = [];

    constructor(knowledgeBase: KnowledgeBase) {
        this.knowledgeBase = knowledgeBase;
    }

    // === ENCADEAMENTO PARA FRENTE ===

    async forwardChaining(startingFacts?: Record<string, any>): Promise<InferenceResult> {
        const startTime = Date.now();
        const steps: string[] = [];
        const appliedRules: KnowledgeRule[] = [];
        const derivedFacts: string[] = [];

        steps.push('🔄 Iniciando encadeamento para frente...');

        try {
            // Se não há fatos iniciais, usa os fatos da base de conhecimento
            const facts = startingFacts || this.getFactsAsObject();

            steps.push(`📋 Fatos iniciais: ${Object.keys(facts).join(', ')}`);

            // Executa o engine json-rules-engine
            const engineResult = await this.knowledgeBase.runEngine(facts);

            // Processa os eventos disparados
            if (engineResult.events && engineResult.events.length > 0) {
                for (const event of engineResult.events) {
                    if (event.type === 'rule-triggered' && event.params.originalRule) {
                        const rule = event.params.originalRule as KnowledgeRule;
                        appliedRules.push(rule);
                        derivedFacts.push(event.params.conclusion);
                        steps.push(`✅ Regra aplicada: "${rule.name}" → ${event.params.conclusion}`);
                    }
                }
            } else {
                steps.push('❌ Nenhuma regra foi disparada');
            }

            const executionTime = Date.now() - startTime;

            const result: InferenceResult = {
                success: appliedRules.length > 0,
                method: 'forward',
                derivedFacts,
                appliedRules,
                steps,
                executionTime
            };

            this.addToHistory('forward', startingFacts, result);

            steps.push(`⏱️ Execução concluída em ${executionTime}ms`);

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            steps.push(`❌ Erro durante execução: ${error}`);

            const result: InferenceResult = {
                success: false,
                method: 'forward',
                derivedFacts: [],
                appliedRules: [],
                steps,
                executionTime
            };

            return result;
        }
    }

    // === ENCADEAMENTO PARA TRÁS ===

    async backwardChaining(goal: string, currentFacts?: Record<string, any>): Promise<InferenceResult> {
        const startTime = Date.now();
        const steps: string[] = [];
        const appliedRules: KnowledgeRule[] = [];
        const proof: string[] = [];

        steps.push(`🎯 Iniciando encadeamento para trás para objetivo: "${goal}"`);

        const facts = currentFacts || this.getFactsAsObject();
        const normalizedGoal = this.normalizeText(goal);

        try {
            const proofResult = await this.proveGoal(normalizedGoal, facts, steps, appliedRules, proof, new Set());

            const executionTime = Date.now() - startTime;

            const result: InferenceResult = {
                success: proofResult,
                method: 'backward',
                derivedFacts: proof,
                appliedRules,
                steps,
                executionTime,
                goal: normalizedGoal,
                proof
            };

            this.addToHistory('backward', { goal, facts: currentFacts }, result);

            steps.push(`⏱️ Execução concluída em ${executionTime}ms`);
            steps.push(proofResult ? '✅ Objetivo provado com sucesso!' : '❌ Não foi possível provar o objetivo');

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            steps.push(`❌ Erro durante prova: ${error}`);

            return {
                success: false,
                method: 'backward',
                derivedFacts: [],
                appliedRules: [],
                steps,
                executionTime,
                goal: normalizedGoal,
                proof: []
            };
        }
    }

    private async proveGoal(
        goal: string,
        facts: Record<string, any>,
        steps: string[],
        appliedRules: KnowledgeRule[],
        proof: string[],
        visited: Set<string>
    ): Promise<boolean> {

        // Evita loops infinitos
        if (visited.has(goal)) {
            steps.push(`🔄 Loop detectado para: "${goal}"`);
            return false;
        }
        visited.add(goal);

        // Verifica se o objetivo já é um fato conhecido
        const factValue = this.findFactValue(goal, facts);
        if (factValue !== undefined) {
            steps.push(`✅ Objetivo "${goal}" encontrado como fato direto`);
            proof.push(`Fato direto: ${goal} = ${factValue}`);
            return Boolean(factValue);
        }

        // Procura regras que podem provar o objetivo
        const relevantRules = this.findRulesForConclusion(goal);

        if (relevantRules.length === 0) {
            steps.push(`❌ Nenhuma regra encontrada para provar: "${goal}"`);
            return false;
        }

        steps.push(`🔍 Encontradas ${relevantRules.length} regra(s) para: "${goal}"`);

        for (const rule of relevantRules) {
            steps.push(`🔄 Tentando aplicar regra: "${rule.name}"`);

            // Tenta provar as condições da regra
            if (await this.proveRuleConditions(rule, facts, steps, appliedRules, proof, visited)) {
                appliedRules.push(rule);
                proof.push(`Regra aplicada: ${rule.condition} → ${rule.conclusion}`);
                steps.push(`✅ Regra "${rule.name}" aplicada com sucesso`);

                // Adiciona a conclusão aos fatos
                facts[goal] = true;

                return true;
            }
        }

        steps.push(`❌ Não foi possível provar: "${goal}"`);
        return false;
    }

    private async proveRuleConditions(
        rule: KnowledgeRule,
        facts: Record<string, any>,
        steps: string[],
        appliedRules: KnowledgeRule[],
        proof: string[],
        visited: Set<string>
    ): Promise<boolean> {

        // Parsing simples da condição
        // Esta implementação pode ser expandida para suportar condições mais complexas
        const conditions = this.parseRuleCondition(rule.condition);

        for (const condition of conditions) {
            const conditionMet = await this.checkCondition(condition, facts, steps, appliedRules, proof, visited);
            if (!conditionMet) {
                steps.push(`❌ Condição não atendida: ${condition}`);
                return false;
            }
        }

        return true;
    }

    private async checkCondition(
        condition: string,
        facts: Record<string, any>,
        steps: string[],
        appliedRules: KnowledgeRule[],
        proof: string[],
        visited: Set<string>
    ): Promise<boolean> {

        // Verifica operadores simples
        const operators = [
            { pattern: /(\w+)\s*>=\s*(\d+)/, check: (fact: any, value: string) => Number(fact) >= Number(value) },
            { pattern: /(\w+)\s*>\s*(\d+)/, check: (fact: any, value: string) => Number(fact) > Number(value) },
            { pattern: /(\w+)\s*<=\s*(\d+)/, check: (fact: any, value: string) => Number(fact) <= Number(value) },
            { pattern: /(\w+)\s*<\s*(\d+)/, check: (fact: any, value: string) => Number(fact) < Number(value) },
            { pattern: /(\w+)\s*=\s*"([^"]+)"/, check: (fact: any, value: string) => String(fact) === value },
            { pattern: /(\w+)\s*=\s*(\w+)/, check: (fact: any, value: string) => String(fact) === value },
            { pattern: /(\w+)\s*!=\s*(\w+)/, check: (fact: any, value: string) => String(fact) !== value }
        ];

        for (const { pattern, check } of operators) {
            const match = condition.match(pattern);
            if (match) {
                const factName = match[1];
                const expectedValue = match[2];

                const factValue = this.findFactValue(factName, facts);
                if (factValue !== undefined) {
                    const result = check(factValue, expectedValue);
                    steps.push(`🔍 Verificando: ${condition} → ${result ? '✅' : '❌'}`);
                    return result;
                } else {
                    // Tenta provar o fato recursivamente
                    return await this.proveGoal(factName, facts, steps, appliedRules, proof, visited);
                }
            }
        }

        // Condição simples - verifica se existe como fato
        const factValue = this.findFactValue(condition, facts);
        if (factValue !== undefined) {
            return Boolean(factValue);
        }

        // Tenta provar recursivamente
        return await this.proveGoal(condition, facts, steps, appliedRules, proof, visited);
    }

    // === MÉTODOS AUXILIARES ===

    private getFactsAsObject(): Record<string, any> {
        const facts: Record<string, any> = {};
        for (const fact of this.knowledgeBase.getAllFacts()) {
            facts[fact.name] = fact.value;
        }
        return facts;
    }

    private findFactValue(factName: string, facts: Record<string, any>): any {
        const normalizedName = this.normalizeText(factName);

        // Procura nos fatos passados
        for (const [key, value] of Object.entries(facts)) {
            if (this.normalizeText(key) === normalizedName) {
                return value;
            }
        }

        // Procura na base de conhecimento
        const fact = this.knowledgeBase.getFactByName(normalizedName);
        return fact?.value;
    }

    private findRulesForConclusion(conclusion: string): KnowledgeRule[] {
        const normalizedConclusion = this.normalizeText(conclusion);
        return this.knowledgeBase.getActiveRules().filter(rule =>
            this.normalizeText(rule.conclusion).includes(normalizedConclusion) ||
            normalizedConclusion.includes(this.normalizeText(rule.conclusion))
        );
    }

    private parseRuleCondition(condition: string): string[] {
        // Parsing simples - divide por 'e', 'and', '&'
        // Esta implementação pode ser expandida para suportar lógica mais complexa
        return condition
            .toLowerCase()
            .split(/\s+(e|and|&)\s+/)
            .filter(part => !['e', 'and', '&'].includes(part.trim()))
            .map(part => part.trim());
    }

    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    private addToHistory(method: 'forward' | 'backward', input: any, result: InferenceResult): void {
        this.inferenceHistory.push({
            timestamp: new Date(),
            method,
            input,
            result
        });

        // Mantém apenas os últimos 100 resultados
        if (this.inferenceHistory.length > 100) {
            this.inferenceHistory = this.inferenceHistory.slice(-100);
        }
    }

    // === CONSULTAS ===

    getHistory(): typeof this.inferenceHistory {
        return [...this.inferenceHistory];
    }

    getLastResult(): InferenceResult | null {
        return this.inferenceHistory.length > 0
            ? this.inferenceHistory[this.inferenceHistory.length - 1].result
            : null;
    }

    clearHistory(): void {
        this.inferenceHistory = [];
    }
}