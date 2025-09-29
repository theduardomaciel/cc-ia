import { InferenceEngine } from './InferenceEngine';
import { ExplanationSystem, WhyExplanation, HowExplanation } from './ExplanationSystem';

export interface ChatResponse {
    userMessage: string;
    botResponse: string;
    type: string;
    data: any;
    timestamp: Date;
}

export class NaturalLanguageInterface {
    private chatHistory: ChatResponse[] = [];
    private context: Map<string, unknown> = new Map();

    constructor(private inferenceEngine: InferenceEngine, private explanationSystem: ExplanationSystem) { }

    processMessage(message: string): ChatResponse {
        const normalizedMessage = message.toLowerCase().trim();
        const response: ChatResponse = { userMessage: message, botResponse: '', type: 'general', data: null, timestamp: new Date() };
        const queryType = this.identifyQueryType(normalizedMessage);
        switch (queryType) {
            case 'why_question':
                response.type = 'explanation';
                response.data = this.handleWhyQuestion(normalizedMessage);
                response.botResponse = this.formatWhyResponse(response.data as WhyExplanation);
                break;
            case 'how_question':
                response.type = 'explanation';
                response.data = this.handleHowQuestion(normalizedMessage);
                response.botResponse = this.formatHowResponse(response.data as HowExplanation);
                break;
            case 'yes_no_question':
                response.type = 'inference';
                response.data = this.handleYesNoQuestion(normalizedMessage);
                response.botResponse = this.formatInferenceResponse(response.data);
                break;
            case 'add_rule':
                response.type = 'knowledge_update';
                response.data = this.handleAddRule(normalizedMessage);
                response.botResponse = response.data.message;
                break;
            case 'add_fact':
                response.type = 'knowledge_update';
                response.data = this.handleAddFact(normalizedMessage);
                response.botResponse = response.data.message;
                break;
            case 'list_rules':
                response.type = 'knowledge_query';
                response.data = this.handleListRules();
                response.botResponse = this.formatRulesListResponse(response.data);
                break;
            case 'list_facts':
                response.type = 'knowledge_query';
                response.data = this.handleListFacts();
                response.botResponse = this.formatFactsListResponse(response.data);
                break;
            case 'general_query':
                response.type = 'inference';
                response.data = this.handleGeneralQuery(normalizedMessage);
                response.botResponse = this.formatGeneralQueryResponse(response.data);
                break;
            default:
                response.type = 'help';
                response.botResponse = this.getHelpMessage();
        }
        this.chatHistory.push(response);
        return response;
    }

    identifyQueryType(message: string): string {
        const patterns: Record<string, RegExp[]> = {
            why_question: [/por\s*que.*\?/, /porque.*\?/, /explique\s+por\s*que/, /why.*\?/],
            how_question: [/como.*\?/, /de\s+que\s+forma/, /qual\s+.*\s+maneira/, /how.*\?/],
            yes_no_question: [/.*\s+é\s+.*\?/, /.*\s+tem\s+.*\?/, /.*\s+pode\s+.*\?/, /.*\s+consegue\s+.*\?/],
            add_rule: [/adicione?\s+.*regra/, /criar?\s+.*regra/, /se\s+.*\s+então/, /if\s+.*\s+then/],
            add_fact: [/adicione?\s+.*fato/, /criar?\s+.*fato/, /.*\s+é\s+verdade/, /sabemos\s+que/],
            list_rules: [/liste?\s+.*regras?/, /mostrar?\s+.*regras?/, /quais\s+.*regras?/, /ver\s+regras?/],
            list_facts: [/liste?\s+.*fatos?/, /mostrar?\s+.*fatos?/, /quais\s+.*fatos?/, /ver\s+fatos?/]
        };
        for (const [type, typePatterns] of Object.entries(patterns)) if (typePatterns.some(p => p.test(message))) return type;
        if (message.includes('?')) return 'general_query';
        return 'unknown';
    }

    handleWhyQuestion(message: string) { const conclusion = this.extractConclusionFromWhy(message); return conclusion ? this.explanationSystem.explainWhy(conclusion) : { error: 'Não consegui identificar o que você quer que eu explique.' }; }
    handleHowQuestion(message: string) { const goal = this.extractGoalFromHow(message); return goal ? this.explanationSystem.explainHow(goal) : { error: 'Não consegui identificar o objetivo que você quer alcançar.' }; }
    handleYesNoQuestion(message: string) { const statement = message.replace(/\?/g, '').trim(); return this.inferenceEngine.query(statement); }
    handleGeneralQuery(message: string) { const query = message.replace(/[?!.]/g, '').trim(); return this.inferenceEngine.query(query); }

    handleAddRule(message: string) {
        const rulePattern = /se\s+(.*?)\s+então\s+(.*?)(?:\.|$)/i;
        const match = message.match(rulePattern);
        if (match) {
            const condition = match[1].trim();
            const conclusion = match[2].trim();
            const ruleId = (this.inferenceEngine as any).knowledgeBase.addRule(condition, conclusion);
            return { success: true, message: `Regra adicionada: SE ${condition} ENTÃO ${conclusion}`, ruleId };
        }
        return { success: false, message: 'Não consegui identificar a regra. Use o formato: "Se [condição] então [conclusão]"' };
    }

    handleAddFact(message: string) {
        const factPatterns = [/sabemos que\s+(.*?)(?:\.|$)/i, /.*é verdade que\s+(.*?)(?:\.|$)/i, /adicione?\s+.*fato:?\s*(.*?)(?:\.|$)/i];
        for (const pattern of factPatterns) {
            const match = message.match(pattern);
            if (match) {
                const fact = match[1].trim();
                (this.inferenceEngine as any).knowledgeBase.addFact(fact);
                return { success: true, message: `Fato adicionado: ${fact}` };
            }
        }
        return { success: false, message: 'Não consegui identificar o fato. Use formatos como: "Sabemos que X" ou "É verdade que Y"' };
    }

    handleListRules() { return { rules: (this.inferenceEngine as any).knowledgeBase.getAllRules() }; }
    handleListFacts() { return { facts: (this.inferenceEngine as any).knowledgeBase.getAllFacts() }; }

    extractConclusionFromWhy(message: string): string | null {
        const patterns = [/por\s*que\s+(.*?)\?/i, /porque\s+(.*?)\?/i, /explique\s+por\s*que\s+(.*?)(?:\?|$)/i];
        for (const pattern of patterns) { const match = message.match(pattern); if (match) return match[1].trim(); }
        return null;
    }
    extractGoalFromHow(message: string): string | null {
        const patterns = [/como\s+(.*?)\?/i, /de\s+que\s+forma\s+(.*?)\?/i, /qual\s+.*\s+maneira.*de\s+(.*?)\?/i];
        for (const pattern of patterns) { const match = message.match(pattern); if (match) return match[1].trim(); }
        return null;
    }

    formatWhyResponse(explanation: any): string { if (explanation.error) return explanation.error; if (!explanation.success) return `Não consegui explicar "${explanation.conclusion}".`; return this.explanationSystem.generateNaturalLanguageExplanation(explanation); }
    formatHowResponse(explanation: any): string { if (explanation.error) return explanation.error; return this.explanationSystem.generateNaturalLanguageExplanation(explanation); }
    formatInferenceResponse(result: any): string { let response = result.answer + '\n\n'; if (result.success && result.result.steps) { response += 'Raciocínio:\n'; result.result.steps.slice(0, 5).forEach((step: string) => { response += `• ${step}\n`; }); } return response.trim(); }
    formatGeneralQueryResponse(result: any): string { return this.formatInferenceResponse(result); }
    formatRulesListResponse(data: any): string { if (data.rules.length === 0) return 'Não há regras cadastradas na base de conhecimento.'; return `Regras cadastradas (${data.rules.length}):\n\n` + data.rules.map((r: any, i: number) => `${i + 1}. SE ${r.condition} ENTÃO ${r.conclusion}`).join('\n'); }
    formatFactsListResponse(data: any): string { if (data.facts.length === 0) return 'Não há fatos conhecidos na base de conhecimento.'; return `Fatos conhecidos (${data.facts.length}):\n\n` + data.facts.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n'); }
    getHelpMessage(): string { return `Olá! Eu sou um sistema expert baseado em conhecimento. Você pode:\n\n• Fazer perguntas: "Tweety é ave?", "Rex é mamífero?"\n• Pedir explicações: "Por que Tweety é ave?", "Como provar que algo é mamífero?"\n• Adicionar regras: "Se animal tem penas então animal é ave"\n• Adicionar fatos: "Sabemos que Tweety tem penas"\n• Listar conhecimento: "Mostre as regras", "Liste os fatos"\n\nComo posso ajudá-lo hoje?`; }
    getChatHistory() { return this.chatHistory; }
    clearChatHistory() { this.chatHistory = []; this.context.clear(); }
}