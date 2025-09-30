// Tipos para o sistema especialista baseado em conhecimento

export interface Fact {
    id: string;
    name: string;
    value: any;
    confidence?: number;
}

export interface Rule {
    id: string;
    name: string;
    description?: string;
    conditions: Condition[];
    conclusions: Conclusion[];
    confidence?: number;
    priority?: number;
}

export interface Condition {
    fact: string;
    operator: 'equal' | 'notEqual' | 'lessThan' | 'lessThanInclusive' | 'greaterThan' | 'greaterThanInclusive' | 'in' | 'notIn' | 'contains' | 'doesNotContain';
    value: any;
}

export interface Conclusion {
    fact: string;
    value: any;
    confidence?: number;
}

export interface InferenceStep {
    type: 'rule-applied' | 'fact-added' | 'goal-reached';
    ruleId?: string;
    ruleName?: string;
    factsUsed: string[];
    conclusionReached?: string;
    timestamp: Date;
}

export interface ExplanationTrace {
    question: string;
    steps: InferenceStep[];
    finalResult?: any;
}

export interface KnowledgeBase {
    facts: Fact[];
    rules: Rule[];
}

export interface InferenceEngine {
    type: 'forward' | 'backward';
    maxIterations?: number;
    confidenceThreshold?: number;
}

export interface Session {
    id: string;
    knowledgeBase: KnowledgeBase;
    currentFacts: Map<string, Fact>;
    inferenceTrace: InferenceStep[];
    explanations: ExplanationTrace[];
    createdAt: Date;
    updatedAt: Date;
}

export type DialogueMode = 'consultation' | 'explanation' | 'editing';

export interface DialogueState {
    mode: DialogueMode;
    currentGoal?: string;
    awaitingInput?: string;
    lastResponse?: string;
}