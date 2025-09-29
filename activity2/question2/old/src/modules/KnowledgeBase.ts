export interface Rule {
    id: string;
    condition: string;
    conclusion: string;
}

/**
 * Base de Conhecimento - Gerencia regras e fatos
 */
export class KnowledgeBase {
    private rules: Map<string, Rule> = new Map();
    private facts: Set<string> = new Set();
    private ruleCounter = 0;

    /**
     * Adiciona uma nova regra SE...ENTÃO
     */
    addRule(condition: string, conclusion: string): string {
        const id = `rule_${++this.ruleCounter}`;
        const rule: Rule = {
            id,
            condition: this.normalizeText(condition),
            conclusion: this.normalizeText(conclusion)
        };
        this.rules.set(id, rule);
        return id;
    }

    removeRule(ruleId: string): boolean {
        if (this.rules.has(ruleId)) {
            this.rules.delete(ruleId);
            return true;
        }
        return false;
    }

    addFact(fact: string): void {
        const normalizedFact = this.normalizeText(fact);
        this.facts.add(normalizedFact);
    }

    removeFact(fact: string): boolean {
        const normalizedFact = this.normalizeText(fact);
        if (this.facts.has(normalizedFact)) {
            this.facts.delete(normalizedFact);
            return true;
        }
        return false;
    }

    hasFact(fact: string): boolean {
        return this.facts.has(this.normalizeText(fact));
    }

    getAllRules(): Rule[] {
        return Array.from(this.rules.values());
    }

    getAllFacts(): string[] {
        return Array.from(this.facts);
    }

    getRulesForFact(fact: string): Rule[] {
        const normalizedFact = this.normalizeText(fact);
        return this.getAllRules().filter(rule =>
            this.matchesCondition(rule.condition, normalizedFact)
        );
    }

    getRulesForGoal(goal: string): Rule[] {
        const normalizedGoal = this.normalizeText(goal);
        return this.getAllRules().filter(rule =>
            this.matchesCondition(rule.conclusion, normalizedGoal)
        );
    }

    matchesCondition(condition: string, fact: string): boolean {
        return condition === fact || condition.includes(fact) || fact.includes(condition);
    }

    normalizeText(text: string): string {
        return text.toLowerCase().trim().replace(/\s+/g, ' ');
    }

    export(): { rules: Rule[]; facts: string[] } {
        return {
            rules: this.getAllRules(),
            facts: this.getAllFacts()
        };
    }

    import(data: { rules?: { condition: string; conclusion: string }[]; facts?: string[] }): void {
        this.rules.clear();
        this.facts.clear();
        this.ruleCounter = 0;

        data.rules?.forEach(rule => {
            this.addRule(rule.condition, rule.conclusion);
        });
        data.facts?.forEach(fact => this.addFact(fact));
    }
}