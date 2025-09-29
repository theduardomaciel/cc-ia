import { KnowledgeBase, Rule } from './KnowledgeBase';

export interface ForwardResult {
    success: boolean;
    derivedFacts: string[];
    appliedRules: Rule[];
    allFacts: string[];
    steps: string[];
    iterations: number;
}

export interface BackwardResult {
    success: boolean;
    goal: string;
    proof: string[];
    usedRules: Rule[];
    steps: string[];
}

type HistoryEntry = {
    timestamp: Date;
    method: 'forward' | 'backward';
    input: string | null;
    result: ForwardResult | BackwardResult;
};

export class InferenceEngine {
    private knowledgeBase: KnowledgeBase;
    private inferenceHistory: HistoryEntry[] = [];

    constructor(knowledgeBase: KnowledgeBase) {
        this.knowledgeBase = knowledgeBase;
    }

    forwardChaining(startingFact: string | null = null): ForwardResult {
        const derivedFacts = new Set<string>();
        const appliedRules: Rule[] = [];
        const steps: string[] = [];

        const workingFacts = startingFact
            ? new Set([this.knowledgeBase.normalizeText(startingFact)])
            : new Set(this.knowledgeBase.getAllFacts());

        let changed = true;
        let iteration = 0;

        while (changed && iteration < 100) {
            changed = false;
            iteration++;
            steps.push(`--- Iteração ${iteration} ---`);
            steps.push(`Fatos conhecidos: ${Array.from(workingFacts).join(', ')}`);

            for (const rule of this.knowledgeBase.getAllRules()) {
                if (appliedRules.some(r => r.id === rule.id)) continue;
                const satisfiedByFacts = Array.from(workingFacts).some(fact =>
                    this.knowledgeBase.matchesCondition(rule.condition, fact)
                );
                if (satisfiedByFacts) {
                    const newFact = rule.conclusion;
                    if (!workingFacts.has(newFact)) {
                        workingFacts.add(newFact);
                        derivedFacts.add(newFact);
                        appliedRules.push(rule);
                        changed = true;
                        steps.push(`Regra aplicada: SE ${rule.condition} ENTÃO ${rule.conclusion}`);
                        steps.push(`Novo fato derivado: ${newFact}`);
                    }
                }
            }
            if (!changed) steps.push('Nenhuma nova derivação possível.');
        }

        const result: ForwardResult = {
            success: derivedFacts.size > 0,
            derivedFacts: Array.from(derivedFacts),
            appliedRules,
            allFacts: Array.from(workingFacts),
            steps,
            iterations: iteration
        };
        this.addToHistory('forward', startingFact, result);
        return result;
    }

    backwardChaining(goal: string): BackwardResult {
        const normalizedGoal = this.knowledgeBase.normalizeText(goal);
        const proofSteps: string[] = [];
        const usedRules: Rule[] = [];
        const visitedGoals = new Set<string>();

        const success = this.proveGoal(normalizedGoal, proofSteps, usedRules, visitedGoals, 0);
        const finalResult: BackwardResult = {
            success,
            goal,
            proof: proofSteps,
            usedRules,
            steps: proofSteps
        };
        this.addToHistory('backward', goal, finalResult);
        return finalResult;
    }

    private proveGoal(goal: string, proofSteps: string[], usedRules: Rule[], visitedGoals: Set<string>, depth = 0): boolean {
        const indent = '  '.repeat(depth);
        if (visitedGoals.has(goal)) {
            proofSteps.push(`${indent}Ciclo detectado para: ${goal}`);
            return false;
        }
        visitedGoals.add(goal);
        proofSteps.push(`${indent}Tentando provar: ${goal}`);
        if (this.knowledgeBase.hasFact(goal)) {
            proofSteps.push(`${indent}✓ ${goal} é um fato conhecido`);
            visitedGoals.delete(goal);
            return true;
        }
        const applicableRules = this.knowledgeBase.getRulesForGoal(goal);
        if (applicableRules.length === 0) {
            proofSteps.push(`${indent}✗ Nenhuma regra encontrada para provar: ${goal}`);
            visitedGoals.delete(goal);
            return false;
        }
        for (const rule of applicableRules) {
            proofSteps.push(`${indent}Tentando regra: SE ${rule.condition} ENTÃO ${rule.conclusion}`);
            if (this.proveGoal(rule.condition, proofSteps, usedRules, visitedGoals, depth + 1)) {
                proofSteps.push(`${indent}✓ Regra aplicada com sucesso: ${rule.condition} → ${rule.conclusion}`);
                usedRules.push(rule);
                visitedGoals.delete(goal);
                return true;
            } else {
                proofSteps.push(`${indent}✗ Não foi possível provar a condição: ${rule.condition}`);
            }
        }
        proofSteps.push(`${indent}✗ Não foi possível provar: ${goal}`);
        visitedGoals.delete(goal);
        return false;
    }

    query(query: string) {
        const forwardResult = this.forwardChaining();
        const normalizedQuery = this.knowledgeBase.normalizeText(query);
        const satisfiedByForward = forwardResult.allFacts.some(fact =>
            this.knowledgeBase.matchesCondition(fact, normalizedQuery)
        );

        if (satisfiedByForward) {
            return {
                method: 'forward' as const,
                success: true,
                result: forwardResult,
                answer: 'Sim, a consulta foi satisfeita através do encadeamento para frente.'
            };
        }
        const backwardResult = this.backwardChaining(query);
        return {
            method: 'backward' as const,
            success: backwardResult.success,
            result: backwardResult,
            answer: backwardResult.success
                ? 'Sim, a consulta foi provada através do encadeamento para trás.'
                : 'Não foi possível provar a consulta.'
        };
    }

    private addToHistory(method: 'forward' | 'backward', input: string | null, result: ForwardResult | BackwardResult) {
        this.inferenceHistory.push({ timestamp: new Date(), method, input, result });
    }

    getHistory() { return this.inferenceHistory; }
    clearHistory() { this.inferenceHistory = []; }
}