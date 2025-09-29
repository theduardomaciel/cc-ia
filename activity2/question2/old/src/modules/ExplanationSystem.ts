import { KnowledgeBase, Rule } from './KnowledgeBase';
import { InferenceEngine } from './InferenceEngine';

export interface WhyExplanationItem {
    type: 'fact' | 'rule' | 'error';
    text: string;
    confidence: string;
    rule?: Rule;
    conditions?: Array<{
        condition: string;
        satisfied: boolean;
        reason: string;
        subExplanation?: WhyExplanation;
    }>;
}

export interface WhyExplanation {
    conclusion: string;
    type: 'why';
    explanation: WhyExplanationItem[];
    success: boolean;
}

export interface HowStrategy {
    type: 'direct_fact' | 'rule_based';
    description: string;
    steps: string[];
    feasible: boolean;
    confidence: string;
    rule?: Rule;
    requirements: string[];
}

export interface HowExplanation {
    goal: string;
    type: 'how';
    explanation: any[]; // unused for now
    success: boolean;
    strategies: HowStrategy[];
}

export class ExplanationSystem {
    constructor(private knowledgeBase: KnowledgeBase, private inferenceEngine: InferenceEngine) { }

    explainWhy(conclusion: string): WhyExplanation {
        const normalizedConclusion = this.knowledgeBase.normalizeText(conclusion);
        const explanation: WhyExplanation = { conclusion, type: 'why', explanation: [], success: false };

        if (this.knowledgeBase.hasFact(normalizedConclusion)) {
            explanation.explanation.push({
                type: 'fact',
                text: `"${conclusion}" é um fato conhecido diretamente na base de conhecimento.`,
                confidence: 'alta'
            });
            explanation.success = true;
            return explanation;
        }
        const applicableRules = this.knowledgeBase.getRulesForGoal(normalizedConclusion);
        if (applicableRules.length === 0) {
            explanation.explanation.push({
                type: 'error',
                text: `Não foi possível encontrar uma explicação para "${conclusion}". Não há regras que levem a esta conclusão.`,
                confidence: 'baixa'
            });
            return explanation;
        }
        for (const rule of applicableRules) {
            const ruleExplanation: WhyExplanationItem = {
                type: 'rule',
                rule,
                text: `A conclusão "${conclusion}" pode ser derivada da regra: SE "${rule.condition}" ENTÃO "${rule.conclusion}"`,
                conditions: [],
                confidence: 'média'
            };
            if (this.knowledgeBase.hasFact(rule.condition)) {
                ruleExplanation.conditions!.push({ condition: rule.condition, satisfied: true, reason: 'É um fato conhecido' });
                ruleExplanation.confidence = 'alta';
                explanation.success = true;
            } else {
                const conditionExplanation = this.explainWhy(rule.condition);
                if (conditionExplanation.success) {
                    ruleExplanation.conditions!.push({
                        condition: rule.condition,
                        satisfied: true,
                        reason: 'Pode ser derivado através de outras regras',
                        subExplanation: conditionExplanation
                    });
                    ruleExplanation.confidence = 'alta';
                    explanation.success = true;
                } else {
                    ruleExplanation.conditions!.push({
                        condition: rule.condition,
                        satisfied: false,
                        reason: 'Não pode ser provado com os fatos e regras disponíveis'
                    });
                }
            }
            explanation.explanation.push(ruleExplanation);
        }
        return explanation;
    }

    explainHow(goal: string): HowExplanation {
        const explanation: HowExplanation = { goal, type: 'how', explanation: [], success: false, strategies: [] };
        const normalizedGoal = this.knowledgeBase.normalizeText(goal);
        if (this.knowledgeBase.hasFact(normalizedGoal)) {
            explanation.strategies.push({
                type: 'direct_fact',
                description: `"${goal}" já é um fato conhecido na base de conhecimento.`,
                steps: ['Verificar na base de fatos conhecidos'],
                feasible: true,
                confidence: 'alta',
                requirements: []
            });
            explanation.success = true;
        }
        const applicableRules = this.knowledgeBase.getRulesForGoal(normalizedGoal);
        for (const rule of applicableRules) {
            const strategy: HowStrategy = {
                type: 'rule_based',
                rule,
                description: `Para provar "${goal}", você pode usar a regra: SE "${rule.condition}" ENTÃO "${rule.conclusion}"`,
                steps: [],
                feasible: false,
                confidence: 'média',
                requirements: []
            };
            strategy.steps.push(`1. Verificar se a condição "${rule.condition}" é verdadeira`);
            if (this.knowledgeBase.hasFact(rule.condition)) {
                strategy.steps.push(`2. A condição "${rule.condition}" já é um fato conhecido`);
                strategy.steps.push(`3. Aplicar a regra para concluir "${rule.conclusion}"`);
                strategy.feasible = true;
                strategy.confidence = 'alta';
                explanation.success = true;
            } else {
                const conditionRules = this.knowledgeBase.getRulesForGoal(rule.condition);
                if (conditionRules.length > 0) {
                    strategy.steps.push(`2. Para provar "${rule.condition}", você pode usar uma das seguintes regras:`);
                    conditionRules.forEach((condRule, index) => {
                        strategy.steps.push(`   ${index + 1}. SE "${condRule.condition}" ENTÃO "${condRule.conclusion}"`);
                    });
                    strategy.steps.push(`3. Aplicar a regra principal para concluir "${rule.conclusion}"`);
                    strategy.feasible = true;
                } else {
                    strategy.steps.push(`2. ⚠️ A condição "${rule.condition}" não pode ser provada com as regras disponíveis`);
                    strategy.steps.push(`3. Você precisaria adicionar "${rule.condition}" como um fato ou criar regras para prová-lo`);
                }
            }
            strategy.requirements.push(`Condição necessária: ${rule.condition}`);
            explanation.strategies.push(strategy);
        }
        if (explanation.strategies.length === 0 && !explanation.success) {
            explanation.explanation.push({
                type: 'no_strategy',
                text: `Não há estratégias conhecidas para provar "${goal}".`
            });
        }
        return explanation;
    }

    generateNaturalLanguageExplanation(explanation: any): string {
        let text = '';
        if (explanation.type === 'why') {
            text += `Explicação para "${explanation.conclusion}":\n\n`;
            explanation.explanation.forEach((item: WhyExplanationItem, index: number) => {
                if (item.type === 'fact' || item.type === 'error') {
                    text += `• ${item.text}\n`;
                } else if (item.type === 'rule') {
                    text += `• ${item.text}\n`;
                    item.conditions?.forEach(condition => {
                        text += condition.satisfied
                            ? `  ✓ A condição "${condition.condition}" é satisfeita: ${condition.reason}\n`
                            : `  ✗ A condição "${condition.condition}" não é satisfeita: ${condition.reason}\n`;
                    });
                }
                if (index < explanation.explanation.length - 1) text += '\n';
            });
        } else if (explanation.type === 'how') {
            text += `Como provar "${explanation.goal}":\n\n`;
            if (explanation.strategies.length > 0) {
                explanation.strategies.forEach((strategy: HowStrategy, index: number) => {
                    text += `Estratégia ${index + 1}: ${strategy.description}\n`;
                    strategy.steps.forEach(step => { text += `  ${step}\n`; });
                    text += `  Viabilidade: ${strategy.feasible ? 'Possível' : 'Não possível no momento'}\n`;
                    text += `  Confiança: ${strategy.confidence}\n\n`;
                });
            } else {
                text += 'Nenhuma estratégia disponível no momento.\n';
            }
        }
        return text;
    }
}