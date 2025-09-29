// Tipos básicos para o sistema especialista
export interface KnowledgeRule {
    id: string;
    name?: string;
    condition: string;
    conclusion: string;
    priority?: number;
    active: boolean;
    createdAt: Date;
    tags?: string[];
}

export interface Fact {
    id: string;
    name: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'object';
    description?: string;
    createdAt: Date;
}

export interface InferenceResult {
    success: boolean;
    method: 'forward' | 'backward';
    derivedFacts: string[];
    appliedRules: KnowledgeRule[];
    steps: string[];
    executionTime: number;
    goal?: string;
    proof?: string[];
}

export interface ExplanationRequest {
    type: 'why' | 'how';
    target: string;
    context?: Record<string, any>;
}

export interface WhyExplanation {
    target: string;
    found: boolean;
    explanation: {
        type: 'fact' | 'rule' | 'inference';
        description: string;
        rule?: KnowledgeRule;
        dependencies?: string[];
        confidence: number;
    }[];
}

export interface HowExplanation {
    goal: string;
    strategies: {
        type: 'direct' | 'inference' | 'impossible';
        description: string;
        steps: string[];
        requiredFacts: string[];
        requiredRules: KnowledgeRule[];
        feasible: boolean;
        confidence: number;
    }[];
}

export interface ChatMessage {
    id: string;
    type: 'user' | 'system';
    content: string;
    timestamp: Date;
    data?: any;
}

export interface SystemState {
    rules: KnowledgeRule[];
    facts: Fact[];
    chatHistory: ChatMessage[];
    currentSession: {
        id: string;
        startTime: Date;
        operations: number;
    };
}