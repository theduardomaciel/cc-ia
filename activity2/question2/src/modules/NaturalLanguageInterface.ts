import type { ChatMessage } from '../types';
import { KnowledgeBase } from './KnowledgeBase';
import { InferenceEngine } from './InferenceEngine';
import { ExplanationSystem } from './ExplanationSystem';

export interface ProcessedMessage {
    type: 'rule_add' | 'fact_add' | 'query' | 'explanation' | 'help' | 'unknown';
    content: string;
    data?: any;
    confidence: number;
}

export class NaturalLanguageInterface {
    private chatHistory: ChatMessage[] = [];
    private context: Map<string, any> = new Map();
    private knowledgeBase: KnowledgeBase;
    private inferenceEngine: InferenceEngine;
    private explanationSystem: ExplanationSystem;

    constructor(
        knowledgeBase: KnowledgeBase,
        inferenceEngine: InferenceEngine,
        explanationSystem: ExplanationSystem
    ) {
        this.knowledgeBase = knowledgeBase;
        this.inferenceEngine = inferenceEngine;
        this.explanationSystem = explanationSystem;
    }

    async processMessage(message: string): Promise<ChatMessage> {
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            content: message,
            timestamp: new Date()
        };

        this.chatHistory.push(userMessage);

        try {
            const processed = await this.analyzeMessage(message);
            const response = await this.generateResponse(processed);

            const systemMessage: ChatMessage = {
                id: crypto.randomUUID(),
                type: 'system',
                content: response.content,
                timestamp: new Date(),
                data: response.data
            };

            this.chatHistory.push(systemMessage);
            return systemMessage;

        } catch (error) {
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                type: 'system',
                content: `❌ Erro ao processar mensagem: ${error}`,
                timestamp: new Date()
            };

            this.chatHistory.push(errorMessage);
            return errorMessage;
        }
    }

    private async analyzeMessage(message: string): Promise<ProcessedMessage> {
        const normalizedMessage = message.toLowerCase().trim();

        // Padrões para identificar intenções
        const patterns = [
            // Adicionar regras
            {
                pattern: /(?:adicione?|criar?|definir?) (?:uma )?regra|se .+ ent[aã]o|if .+ then/i,
                type: 'rule_add' as const,
                confidence: 0.9
            },
            // Adicionar fatos
            {
                pattern: /(?:adicione?|criar?|definir?) (?:um )?fato|(?:defin[ae]|estabele[çc]e) que/i,
                type: 'fact_add' as const,
                confidence: 0.9
            },
            // Consultas (verdadeiro/falso)
            {
                pattern: /(?:é|[eé] verdade|verifi(?:que|car))/i,
                type: 'query' as const,
                confidence: 0.8
            },
            // Explicações "Por quê?"
            {
                pattern: /por\s*qu[eê]|porque|why|explique/i,
                type: 'explanation' as const,
                confidence: 0.8
            },
            // Explicações "Como?"
            {
                pattern: /como|how|de que (?:forma|maneira)/i,
                type: 'explanation' as const,
                confidence: 0.8
            },
            // Ajuda
            {
                pattern: /ajuda|help|comandos|o que posso/i,
                type: 'help' as const,
                confidence: 0.9
            }
        ];

        for (const { pattern, type, confidence } of patterns) {
            if (pattern.test(normalizedMessage)) {
                return {
                    type,
                    content: message,
                    confidence
                };
            }
        }

        return {
            type: 'unknown',
            content: message,
            confidence: 0.1
        };
    }

    private async generateResponse(processed: ProcessedMessage): Promise<{
        content: string;
        data?: any;
    }> {
        switch (processed.type) {
            case 'rule_add':
                return await this.handleRuleAdd(processed.content);

            case 'fact_add':
                return await this.handleFactAdd(processed.content);

            case 'query':
                return await this.handleQuery(processed.content);

            case 'explanation':
                return await this.handleExplanation(processed.content);

            case 'help':
                return this.handleHelp();

            default:
                return this.handleUnknown(processed.content);
        }
    }

    private async handleRuleAdd(content: string): Promise<{ content: string; data?: any }> {
        try {
            const ruleData = this.parseRule(content);

            if (!ruleData.condition || !ruleData.conclusion) {
                return {
                    content: `❌ Não consegui extrair uma regra válida. Por favor, use o formato:\n"SE [condição] ENTÃO [conclusão]"\n\nExemplo: "SE idade >= 18 ENTÃO maior_de_idade"`
                };
            }

            const ruleId = this.knowledgeBase.addRule(
                ruleData.condition,
                ruleData.conclusion,
                { name: ruleData.name }
            );

            return {
                content: `✅ Regra adicionada com sucesso!\n📝 ID: ${ruleId}\n🔄 Condição: ${ruleData.condition}\n➡️ Conclusão: ${ruleData.conclusion}`,
                data: { ruleId, type: 'rule_added' }
            };

        } catch (error) {
            return {
                content: `❌ Erro ao adicionar regra: ${error}`
            };
        }
    }

    private async handleFactAdd(content: string): Promise<{ content: string; data?: any }> {
        try {
            const factData = this.parseFact(content);

            if (!factData.name) {
                return {
                    content: `❌ Não consegui extrair um fato válido. Por favor, use o formato:\n"[nome do fato] = [valor]"\n\nExemplo: "idade = 25" ou "define que usuario_logado = verdadeiro"`
                };
            }

            const factId = this.knowledgeBase.addFact(
                factData.name,
                factData.value,
                { description: factData.description }
            );

            return {
                content: `✅ Fato adicionado com sucesso!\n📝 ID: ${factId}\n🏷️ Nome: ${factData.name}\n💎 Valor: ${factData.value}`,
                data: { factId, type: 'fact_added' }
            };

        } catch (error) {
            return {
                content: `❌ Erro ao adicionar fato: ${error}`
            };
        }
    }

    private async handleQuery(content: string): Promise<{ content: string; data?: any }> {
        try {
            const query = this.extractQuery(content);

            if (!query) {
                return {
                    content: `❌ Não consegui entender a consulta. Por favor, reformule.\n\nExemplo: "É verdade que usuário é maior de idade?"`
                };
            }

            // Executa encadeamento para trás para tentar provar o objetivo
            const result = await this.inferenceEngine.backwardChaining(query);

            let response = `🎯 Consulta: "${query}"\n\n`;

            if (result.success) {
                response += `✅ **VERDADEIRO** - O objetivo foi provado!\n\n`;
                response += `📋 Prova:\n${result.proof?.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n`;
                response += `⚙️ Regras utilizadas: ${result.appliedRules.map(r => r.name).join(', ')}\n`;
            } else {
                response += `❌ **FALSO** - Não foi possível provar o objetivo.\n\n`;
                response += `📋 Tentativas realizadas:\n${result.steps.slice(0, 5).join('\n')}\n`;

                if (result.steps.length > 5) {
                    response += `\n... e mais ${result.steps.length - 5} tentativas.`;
                }
            }

            response += `\n⏱️ Tempo de execução: ${result.executionTime}ms`;

            return {
                content: response,
                data: { result, type: 'query_result' }
            };

        } catch (error) {
            return {
                content: `❌ Erro ao processar consulta: ${error}`
            };
        }
    }

    private async handleExplanation(content: string): Promise<{ content: string; data?: any }> {
        try {
            const explanationData = this.parseExplanationRequest(content);

            if (!explanationData.target) {
                return {
                    content: `❌ Não consegui entender o que você quer explicar.\n\nExemplos:\n- "Por que usuário é maior de idade?"\n- "Como obter desconto?"`
                };
            }

            if (explanationData.type === 'why') {
                const explanation = await this.explanationSystem.explainWhy(explanationData.target);
                return {
                    content: this.explanationSystem.formatWhyExplanation(explanation),
                    data: { explanation, type: 'why_explanation' }
                };
            } else {
                const explanation = await this.explanationSystem.explainHow(explanationData.target);
                return {
                    content: this.explanationSystem.formatHowExplanation(explanation),
                    data: { explanation, type: 'how_explanation' }
                };
            }

        } catch (error) {
            return {
                content: `❌ Erro ao gerar explicação: ${error}`
            };
        }
    }

    private handleHelp(): { content: string; data?: any } {
        const helpText = `
🤖 **Sistema Especialista - Ajuda**

📋 **Comandos disponíveis:**

**1. Adicionar Regras:**
- "SE idade >= 18 ENTÃO maior_de_idade"
- "Adicione a regra: SE salario > 5000 ENTÃO cliente_premium"

**2. Adicionar Fatos:**
- "idade = 25"
- "Define que usuario_logado = verdadeiro"
- "salario = 6000"

**3. Consultas:**
- "É verdade que usuário é maior de idade?"
- "Verifique se cliente é premium"

**4. Explicações:**
- **Por quê?** "Por que usuário é maior de idade?"
- **Como?** "Como obter desconto?"

**5. Outros comandos:**
- "ajuda" - Mostra esta mensagem
- "listar regras" - Mostra todas as regras
- "listar fatos" - Mostra todos os fatos

💡 **Dicas:**
- Use linguagem natural em português
- Seja específico nas condições das regras
- Experimente diferentes formas de perguntar

🔧 **Sistema atual:**
- Regras ativas: ${this.knowledgeBase.getActiveRules().length}
- Fatos disponíveis: ${this.knowledgeBase.getAllFacts().length}
- Histórico de conversas: ${this.chatHistory.length}
`;

        return {
            content: helpText,
            data: { type: 'help' }
        };
    }

    private handleUnknown(content: string): { content: string; data?: any } {
        const suggestions = [
            "Tente reformular sua pergunta",
            "Use 'ajuda' para ver os comandos disponíveis",
            "Exemplo de regra: 'SE idade >= 18 ENTÃO maior_de_idade'",
            "Exemplo de consulta: 'É verdade que usuário é premium?'"
        ];

        return {
            content: `❓ Não entendi sua mensagem: "${content}"\n\n💡 Sugestões:\n${suggestions.map(s => `• ${s}`).join('\n')}`
        };
    }

    // === PARSING DE CONTEÚDO ===

    private parseRule(content: string): {
        condition: string;
        conclusion: string;
        name?: string;
    } {
        // Padrões para extrair regras SE...ENTÃO
        const patterns = [
            /se\s+(.+?)\s+ent[aã]o\s+(.+)/i,
            /if\s+(.+?)\s+then\s+(.+)/i,
            /(?:regra|rule):\s*se\s+(.+?)\s+ent[aã]o\s+(.+)/i
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return {
                    condition: match[1].trim(),
                    conclusion: match[2].trim(),
                    name: `Regra extraída de: "${content.slice(0, 50)}..."`
                };
            }
        }

        throw new Error('Formato de regra não reconhecido');
    }

    private parseFact(content: string): {
        name: string;
        value: any;
        description?: string;
    } {
        // Padrões para extrair fatos
        const patterns = [
            /(.+?)\s*=\s*(.+)/,
            /(?:defin[ae]|estabele[çc]e)\s+que\s+(.+?)\s*=\s*(.+)/i,
            /(?:fato|fact):\s*(.+?)\s*=\s*(.+)/i
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                let name = match[1].trim();
                let value: any = match[2].trim();

                // Remove palavras desnecessárias do nome
                name = name.replace(/^(?:o|a|um|uma|que)\s+/i, '');

                // Converte valores
                if (value.toLowerCase() === 'verdadeiro' || value.toLowerCase() === 'true') {
                    value = true;
                } else if (value.toLowerCase() === 'falso' || value.toLowerCase() === 'false') {
                    value = false;
                } else if (!isNaN(Number(value))) {
                    value = Number(value);
                } else if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }

                return {
                    name,
                    value,
                    description: `Fato extraído de: "${content}"`
                };
            }
        }

        throw new Error('Formato de fato não reconhecido');
    }

    private extractQuery(content: string): string | null {
        // Padrões para extrair consultas
        const patterns = [
            /(?:é\s+verdade\s+que|verifique?\s+se)\s+(.+)\??/i,
            /(.+?)\s+(?:é\s+verdadeiro|é\s+falso)\??/i,
            /(?:consulta|query):\s*(.+)/i
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        // Se não conseguiu extrair com padrões, remove palavras comuns do início
        const cleaned = content
            .replace(/^(?:é|verifique?|consulte?|query)\s+/i, '')
            .replace(/\?+$/, '')
            .trim();

        return cleaned || null;
    }

    private parseExplanationRequest(content: string): {
        type: 'why' | 'how';
        target: string;
    } {
        const whyPatterns = [
            /por\s*qu[eê]\s+(.+)/i,
            /porque\s+(.+)/i,
            /explique\s+por\s*qu[eê]\s+(.+)/i
        ];

        const howPatterns = [
            /como\s+(?:obter|conseguir|alcançar)?\s*(.+)/i,
            /de\s+que\s+(?:forma|maneira)\s+(.+)/i,
            /how\s+(?:to\s+)?(.+)/i
        ];

        for (const pattern of whyPatterns) {
            const match = content.match(pattern);
            if (match) {
                return {
                    type: 'why',
                    target: match[1].trim().replace(/\?+$/, '')
                };
            }
        }

        for (const pattern of howPatterns) {
            const match = content.match(pattern);
            if (match) {
                return {
                    type: 'how',
                    target: match[1].trim().replace(/\?+$/, '')
                };
            }
        }

        throw new Error('Não consegui identificar o tipo de explicação solicitada');
    }

    // === MÉTODOS PÚBLICOS ===

    getChatHistory(): ChatMessage[] {
        return [...this.chatHistory];
    }

    clearHistory(): void {
        this.chatHistory = [];
        this.context.clear();
    }

    getContext(key: string): any {
        return this.context.get(key);
    }

    setContext(key: string, value: any): void {
        this.context.set(key, value);
    }
}