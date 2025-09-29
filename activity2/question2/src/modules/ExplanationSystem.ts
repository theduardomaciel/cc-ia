import type { KnowledgeRule, WhyExplanation, HowExplanation, ExplanationRequest } from '../types';
import { KnowledgeBase } from './KnowledgeBase';
import { InferenceEngine } from './InferenceEngine';

export class ExplanationSystem {
    private knowledgeBase: KnowledgeBase;
    // private inferenceEngine: InferenceEngine;

    constructor(
        knowledgeBase: KnowledgeBase,
        _inferenceEngine: InferenceEngine
    ) {
        this.knowledgeBase = knowledgeBase;
        // this.inferenceEngine = inferenceEngine;
    }

    // === EXPLICAÇÃO "POR QUÊ?" ===

    async explainWhy(target: string, context?: Record<string, any>): Promise<WhyExplanation> {
        const normalizedTarget = this.normalizeText(target);

        const explanation: WhyExplanation = {
            target: normalizedTarget,
            found: false,
            explanation: []
        };

        // Verifica se é um fato direto
        const directFact = this.knowledgeBase.getFactByName(normalizedTarget);
        if (directFact) {
            explanation.found = true;
            explanation.explanation.push({
                type: 'fact',
                description: `"${target}" é um fato diretamente conhecido na base de conhecimento.`,
                confidence: 1.0
            });

            if (directFact.description) {
                explanation.explanation.push({
                    type: 'fact',
                    description: `Descrição: ${directFact.description}`,
                    confidence: 1.0
                });
            }

            return explanation;
        }

        // Procura regras que derivam este target
        const derivingRules = this.findRulesForConclusion(normalizedTarget);

        if (derivingRules.length === 0) {
            explanation.explanation.push({
                type: 'fact',
                description: `"${target}" não foi encontrado como fato direto nem pode ser derivado por nenhuma regra conhecida.`,
                confidence: 0.0
            });
            return explanation;
        }

        explanation.found = true;
        explanation.explanation.push({
            type: 'rule',
            description: `"${target}" pode ser derivado através das seguintes regras:`,
            confidence: 0.8
        });

        // Analisa cada regra que pode derivar o target
        for (const rule of derivingRules) {
            const ruleExplanation = await this.explainRule(rule, context);
            explanation.explanation.push({
                type: 'rule',
                description: `Regra "${rule.name}": SE ${rule.condition} ENTÃO ${rule.conclusion}`,
                rule,
                dependencies: this.extractDependencies(rule.condition),
                confidence: ruleExplanation.confidence
            });

            // Explica as dependências da regra
            for (const dependency of this.extractDependencies(rule.condition)) {
                const depExplanation = await this.explainWhy(dependency, context);
                if (depExplanation.found) {
                    explanation.explanation.push({
                        type: 'inference',
                        description: `Dependência "${dependency}" é satisfeita.`,
                        confidence: this.calculateAverageConfidence(depExplanation.explanation)
                    });
                } else {
                    explanation.explanation.push({
                        type: 'inference',
                        description: `Dependência "${dependency}" NÃO é satisfeita ou desconhecida.`,
                        confidence: 0.0
                    });
                }
            }
        }

        return explanation;
    }

    // === EXPLICAÇÃO "COMO?" ===

    async explainHow(goal: string, context?: Record<string, any>): Promise<HowExplanation> {
        const normalizedGoal = this.normalizeText(goal);

        const explanation: HowExplanation = {
            goal: normalizedGoal,
            strategies: []
        };

        // Estratégia 1: Fato direto
        const directFact = this.knowledgeBase.getFactByName(normalizedGoal);
        if (directFact) {
            explanation.strategies.push({
                type: 'direct',
                description: `"${goal}" já existe como fato na base de conhecimento.`,
                steps: [
                    `O fato "${goal}" está diretamente disponível`,
                    `Valor atual: ${directFact.value}`,
                    `Tipo: ${directFact.type}`
                ],
                requiredFacts: [],
                requiredRules: [],
                feasible: true,
                confidence: 1.0
            });
        }

        // Estratégia 2: Inferência através de regras
        const derivingRules = this.findRulesForConclusion(normalizedGoal);

        if (derivingRules.length === 0 && !directFact) {
            explanation.strategies.push({
                type: 'impossible',
                description: `Não é possível obter "${goal}" com o conhecimento atual.`,
                steps: [
                    'Não existem fatos diretos',
                    'Não existem regras que derivem este objetivo',
                    'Considere adicionar regras ou fatos relevantes'
                ],
                requiredFacts: [],
                requiredRules: [],
                feasible: false,
                confidence: 0.0
            });
            return explanation;
        }

        // Analisa cada regra possível
        for (const rule of derivingRules) {
            const strategy = await this.analyzeRuleStrategy(rule, context);
            explanation.strategies.push(strategy);
        }

        // Ordena estratégias por viabilidade e confiança
        explanation.strategies.sort((a, b) => {
            if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
            return b.confidence - a.confidence;
        });

        return explanation;
    }

    // === MÉTODOS AUXILIARES ===

    private async explainRule(rule: KnowledgeRule, context?: Record<string, any>): Promise<{
        confidence: number;
        satisfied: boolean;
        unsatisfiedDependencies: string[];
    }> {
        const dependencies = this.extractDependencies(rule.condition);
        const unsatisfiedDependencies: string[] = [];
        let totalConfidence = 0;

        const facts = context || this.getAvailableFacts();

        for (const dependency of dependencies) {
            const dependencySatisfied = await this.checkDependency(dependency, facts);
            if (dependencySatisfied.satisfied) {
                totalConfidence += dependencySatisfied.confidence;
            } else {
                unsatisfiedDependencies.push(dependency);
            }
        }

        const confidence = dependencies.length > 0 ? totalConfidence / dependencies.length : 0;

        return {
            confidence,
            satisfied: unsatisfiedDependencies.length === 0,
            unsatisfiedDependencies
        };
    }

    private async analyzeRuleStrategy(rule: KnowledgeRule, context?: Record<string, any>): Promise<{
        type: 'direct' | 'inference' | 'impossible';
        description: string;
        steps: string[];
        requiredFacts: string[];
        requiredRules: KnowledgeRule[];
        feasible: boolean;
        confidence: number;
    }> {
        const dependencies = this.extractDependencies(rule.condition);
        const requiredFacts: string[] = [];
        const requiredRules: KnowledgeRule[] = [rule];
        const steps: string[] = [];
        let feasible = true;
        let totalConfidence = 0;

        steps.push(`Aplicar regra: "${rule.name}"`);
        steps.push(`Condição: ${rule.condition}`);
        steps.push(`Resultado: ${rule.conclusion}`);

        const facts = context || this.getAvailableFacts();

        for (const dependency of dependencies) {
            const dependencyCheck = await this.checkDependency(dependency, facts);

            if (dependencyCheck.satisfied) {
                steps.push(`✅ Dependência satisfeita: ${dependency}`);
                totalConfidence += dependencyCheck.confidence;
            } else {
                steps.push(`❌ Dependência não satisfeita: ${dependency}`);

                // Verifica se pode ser derivada
                const derivingRules = this.findRulesForConclusion(dependency);
                if (derivingRules.length > 0) {
                    steps.push(`   ↳ Pode ser obtida através de: ${derivingRules.map(r => r.name).join(', ')}`);
                    requiredRules.push(...derivingRules);
                } else {
                    steps.push(`   ↳ Precisa ser adicionada como fato`);
                    requiredFacts.push(dependency);
                    feasible = false;
                }
            }
        }

        const confidence = dependencies.length > 0 ? totalConfidence / dependencies.length : 0;

        return {
            type: feasible ? 'inference' : 'impossible',
            description: feasible
                ? `Pode ser obtido aplicando a regra "${rule.name}"`
                : `Requer fatos adicionais para aplicar a regra "${rule.name}"`,
            steps,
            requiredFacts,
            requiredRules,
            feasible,
            confidence
        };
    }

    private async checkDependency(dependency: string, facts: Record<string, any>): Promise<{
        satisfied: boolean;
        confidence: number;
    }> {
        // Verifica se é um fato direto
        const directFact = this.findFactValue(dependency, facts);
        if (directFact !== undefined) {
            return {
                satisfied: Boolean(directFact),
                confidence: 1.0
            };
        }

        // Verifica se pode ser derivado
        const derivingRules = this.findRulesForConclusion(dependency);
        if (derivingRules.length > 0) {
            // Simula uma inferência simples
            for (const rule of derivingRules) {
                const ruleDeps = this.extractDependencies(rule.condition);
                const allDepsSatisfied = ruleDeps.every(dep => {
                    const val = this.findFactValue(dep, facts);
                    return val !== undefined && Boolean(val);
                });

                if (allDepsSatisfied) {
                    return {
                        satisfied: true,
                        confidence: 0.8
                    };
                }
            }
        }

        return {
            satisfied: false,
            confidence: 0.0
        };
    }

    private extractDependencies(condition: string): string[] {
        // Extrai variáveis/fatos da condição
        // Esta implementação pode ser expandida para parsing mais sofisticado
        const dependencies = new Set<string>();

        // Patterns para diferentes tipos de condições
        const patterns = [
            /(\w+)\s*[><=!]=?\s*\w+/g,  // comparações
            /(\w+)\s*=\s*"[^"]+"/g,      // igualdades com strings
            /(\w+)(?=\s|$)/g             // variáveis simples
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(condition)) !== null) {
                const dependency = match[1];
                if (dependency && !['e', 'and', 'or', 'ou', 'se', 'entao', 'then'].includes(dependency.toLowerCase())) {
                    dependencies.add(dependency);
                }
            }
        }

        return Array.from(dependencies);
    }

    private findRulesForConclusion(conclusion: string): KnowledgeRule[] {
        const normalizedConclusion = this.normalizeText(conclusion);
        return this.knowledgeBase.getActiveRules().filter(rule =>
            this.normalizeText(rule.conclusion).includes(normalizedConclusion) ||
            normalizedConclusion.includes(this.normalizeText(rule.conclusion))
        );
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

    private getAvailableFacts(): Record<string, any> {
        const facts: Record<string, any> = {};
        for (const fact of this.knowledgeBase.getAllFacts()) {
            facts[fact.name] = fact.value;
        }
        return facts;
    }

    private calculateAverageConfidence(explanations: WhyExplanation['explanation']): number {
        if (explanations.length === 0) return 0;
        const total = explanations.reduce((sum, exp) => sum + exp.confidence, 0);
        return total / explanations.length;
    }

    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // === INTERFACE PÚBLICA ===

    async processExplanationRequest(request: ExplanationRequest): Promise<WhyExplanation | HowExplanation> {
        switch (request.type) {
            case 'why':
                return await this.explainWhy(request.target, request.context);
            case 'how':
                return await this.explainHow(request.target, request.context);
            default:
                throw new Error(`Tipo de explicação não suportado: ${request.type}`);
        }
    }

    // === UTILITÁRIOS PARA INTERFACE ===

    formatWhyExplanation(explanation: WhyExplanation): string {
        let result = `🤔 Por que "${explanation.target}"?\n\n`;

        if (!explanation.found) {
            result += '❌ Este objetivo não foi encontrado na base de conhecimento.\n';
            return result;
        }

        result += '📋 Explicação:\n';
        explanation.explanation.forEach((item, index) => {
            const confidence = Math.round(item.confidence * 100);
            const icon = item.type === 'fact' ? '📄' : item.type === 'rule' ? '⚙️' : '🔗';

            result += `${index + 1}. ${icon} ${item.description} (Confiança: ${confidence}%)\n`;

            if (item.rule) {
                result += `   📝 Regra: ${item.rule.name}\n`;
            }

            if (item.dependencies && item.dependencies.length > 0) {
                result += `   📎 Depende de: ${item.dependencies.join(', ')}\n`;
            }

            result += '\n';
        });

        return result;
    }

    formatHowExplanation(explanation: HowExplanation): string {
        let result = `🛠️ Como obter "${explanation.goal}"?\n\n`;

        if (explanation.strategies.length === 0) {
            result += '❌ Não foram encontradas estratégias para obter este objetivo.\n';
            return result;
        }

        result += '📋 Estratégias disponíveis:\n\n';
        explanation.strategies.forEach((strategy, index) => {
            const confidence = Math.round(strategy.confidence * 100);
            const feasibleIcon = strategy.feasible ? '✅' : '❌';
            const typeIcon = strategy.type === 'direct' ? '📄' : strategy.type === 'inference' ? '🔧' : '🚫';

            result += `${index + 1}. ${typeIcon} ${feasibleIcon} ${strategy.description} (Confiança: ${confidence}%)\n\n`;

            result += '   📝 Passos:\n';
            strategy.steps.forEach((step, stepIndex) => {
                result += `      ${stepIndex + 1}. ${step}\n`;
            });

            if (strategy.requiredFacts.length > 0) {
                result += `   📎 Fatos necessários: ${strategy.requiredFacts.join(', ')}\n`;
            }

            if (strategy.requiredRules.length > 0) {
                result += `   ⚙️ Regras necessárias: ${strategy.requiredRules.map(r => r.name).join(', ')}\n`;
            }

            result += '\n';
        });

        return result;
    }
}