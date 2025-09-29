/**
 * Interface de Linguagem Natural - Processa consultas em linguagem natural
 */
export class NaturalLanguageInterface {
    constructor(inferenceEngine, explanationSystem) {
        this.inferenceEngine = inferenceEngine
        this.explanationSystem = explanationSystem
        this.chatHistory = []
        this.context = new Map() // Armazena contexto da conversa
    }

    /**
     * Processa uma mensagem em linguagem natural
     * @param {string} message - Mensagem do usuário
     * @returns {Object} Resposta processada
     */
    processMessage(message) {
        console.log(`Processando mensagem: ${message}`)

        const normalizedMessage = message.toLowerCase().trim()
        const response = {
            userMessage: message,
            botResponse: '',
            type: 'general',
            data: null,
            timestamp: new Date()
        }

        // Identifica o tipo de consulta
        const queryType = this.identifyQueryType(normalizedMessage)

        switch (queryType) {
            case 'why_question':
                response.type = 'explanation'
                response.data = this.handleWhyQuestion(normalizedMessage)
                response.botResponse = this.formatWhyResponse(response.data)
                break

            case 'how_question':
                response.type = 'explanation'
                response.data = this.handleHowQuestion(normalizedMessage)
                response.botResponse = this.formatHowResponse(response.data)
                break

            case 'yes_no_question':
                response.type = 'inference'
                response.data = this.handleYesNoQuestion(normalizedMessage)
                response.botResponse = this.formatInferenceResponse(response.data)
                break

            case 'add_rule':
                response.type = 'knowledge_update'
                response.data = this.handleAddRule(normalizedMessage)
                response.botResponse = response.data.message
                break

            case 'add_fact':
                response.type = 'knowledge_update'
                response.data = this.handleAddFact(normalizedMessage)
                response.botResponse = response.data.message
                break

            case 'list_rules':
                response.type = 'knowledge_query'
                response.data = this.handleListRules()
                response.botResponse = this.formatRulesListResponse(response.data)
                break

            case 'list_facts':
                response.type = 'knowledge_query'
                response.data = this.handleListFacts()
                response.botResponse = this.formatFactsListResponse(response.data)
                break

            case 'general_query':
                response.type = 'inference'
                response.data = this.handleGeneralQuery(normalizedMessage)
                response.botResponse = this.formatGeneralQueryResponse(response.data)
                break

            default:
                response.type = 'help'
                response.botResponse = this.getHelpMessage()
                break
        }

        // Adiciona ao histórico
        this.chatHistory.push(response)
        return response
    }

    /**
     * Identifica o tipo de consulta baseado na mensagem
     * @param {string} message - Mensagem normalizada
     * @returns {string} Tipo da consulta
     */
    identifyQueryType(message) {
        // Padrões para diferentes tipos de consulta
        const patterns = {
            why_question: [
                /por\s*que.*\?/,
                /porque.*\?/,
                /explique\s+por\s*que/,
                /why.*\?/
            ],
            how_question: [
                /como.*\?/,
                /de\s+que\s+forma/,
                /qual\s+.*\s+maneira/,
                /how.*\?/
            ],
            yes_no_question: [
                /.*\s+é\s+.*\?/,
                /.*\s+tem\s+.*\?/,
                /.*\s+pode\s+.*\?/,
                /.*\s+consegue\s+.*\?/
            ],
            add_rule: [
                /adicione?\s+.*regra/,
                /criar?\s+.*regra/,
                /se\s+.*\s+então/,
                /if\s+.*\s+then/
            ],
            add_fact: [
                /adicione?\s+.*fato/,
                /criar?\s+.*fato/,
                /.*\s+é\s+verdade/,
                /sabemos\s+que/
            ],
            list_rules: [
                /liste?\s+.*regras?/,
                /mostrar?\s+.*regras?/,
                /quais\s+.*regras?/,
                /ver\s+regras?/
            ],
            list_facts: [
                /liste?\s+.*fatos?/,
                /mostrar?\s+.*fatos?/,
                /quais\s+.*fatos?/,
                /ver\s+fatos?/
            ]
        }

        // Verifica cada padrão
        for (const [type, typePatterns] of Object.entries(patterns)) {
            if (typePatterns.some(pattern => pattern.test(message))) {
                return type
            }
        }

        // Se contém uma pergunta, trata como consulta geral
        if (message.includes('?')) {
            return 'general_query'
        }

        return 'unknown'
    }

    /**
     * Processa perguntas "por quê"
     * @param {string} message - Mensagem do usuário
     * @returns {Object} Resultado da explicação
     */
    handleWhyQuestion(message) {
        // Extrai o que deve ser explicado
        const conclusion = this.extractConclusionFromWhy(message)
        if (!conclusion) {
            return { error: 'Não consegui identificar o que você quer que eu explique.' }
        }

        return this.explanationSystem.explainWhy(conclusion)
    }

    /**
     * Processa perguntas "como"
     * @param {string} message - Mensagem do usuário
     * @returns {Object} Resultado da explicação
     */
    handleHowQuestion(message) {
        // Extrai o objetivo da pergunta
        const goal = this.extractGoalFromHow(message)
        if (!goal) {
            return { error: 'Não consegui identificar o objetivo que você quer alcançar.' }
        }

        return this.explanationSystem.explainHow(goal)
    }

    /**
     * Processa perguntas sim/não
     * @param {string} message - Mensagem do usuário
     * @returns {Object} Resultado da inferência
     */
    handleYesNoQuestion(message) {
        // Remove a interrogação e trata como afirmação para teste
        const statement = message.replace(/\?/g, '').trim()
        return this.inferenceEngine.query(statement)
    }

    /**
     * Processa consultas gerais
     * @param {string} message - Mensagem do usuário
     * @returns {Object} Resultado da consulta
     */
    handleGeneralQuery(message) {
        // Remove pontuação e trata como consulta
        const query = message.replace(/[?!.]/g, '').trim()
        return this.inferenceEngine.query(query)
    }

    /**
     * Processa adição de regras via linguagem natural
     * @param {string} message - Mensagem do usuário
     * @returns {Object} Resultado da operação
     */
    handleAddRule(message) {
        const rulePattern = /se\s+(.*?)\s+então\s+(.*?)(?:\.|$)/i
        const match = message.match(rulePattern)

        if (match) {
            const condition = match[1].trim()
            const conclusion = match[2].trim()
            const ruleId = this.inferenceEngine.knowledgeBase.addRule(condition, conclusion)
            return {
                success: true,
                message: `Regra adicionada: SE ${condition} ENTÃO ${conclusion}`,
                ruleId: ruleId
            }
        }

        return {
            success: false,
            message: 'Não consegui identificar a regra. Use o formato: "Se [condição] então [conclusão]"'
        }
    }

    /**
     * Processa adição de fatos via linguagem natural
     * @param {string} message - Mensagem do usuário
     * @returns {Object} Resultado da operação
     */
    handleAddFact(message) {
        // Padrões para identificar fatos
        const factPatterns = [
            /sabemos que\s+(.*?)(?:\.|$)/i,
            /.*é verdade que\s+(.*?)(?:\.|$)/i,
            /adicione?\s+.*fato:?\s*(.*?)(?:\.|$)/i
        ]

        for (const pattern of factPatterns) {
            const match = message.match(pattern)
            if (match) {
                const fact = match[1].trim()
                this.inferenceEngine.knowledgeBase.addFact(fact)
                return {
                    success: true,
                    message: `Fato adicionado: ${fact}`
                }
            }
        }

        return {
            success: false,
            message: 'Não consegui identificar o fato. Use formatos como: "Sabemos que X" ou "É verdade que Y"'
        }
    }

    /**
     * Lista todas as regras
     * @returns {Object} Lista de regras
     */
    handleListRules() {
        return {
            rules: this.inferenceEngine.knowledgeBase.getAllRules()
        }
    }

    /**
     * Lista todos os fatos
     * @returns {Object} Lista de fatos
     */
    handleListFacts() {
        return {
            facts: this.inferenceEngine.knowledgeBase.getAllFacts()
        }
    }

    /**
     * Extrai a conclusão de uma pergunta "por quê"
     * @param {string} message - Mensagem do usuário
     * @returns {string|null} Conclusão extraída
     */
    extractConclusionFromWhy(message) {
        const patterns = [
            /por\s*que\s+(.*?)\?/i,
            /porque\s+(.*?)\?/i,
            /explique\s+por\s*que\s+(.*?)(?:\?|$)/i
        ]

        for (const pattern of patterns) {
            const match = message.match(pattern)
            if (match) {
                return match[1].trim()
            }
        }

        return null
    }

    /**
     * Extrai o objetivo de uma pergunta "como"
     * @param {string} message - Mensagem do usuário
     * @returns {string|null} Objetivo extraído
     */
    extractGoalFromHow(message) {
        const patterns = [
            /como\s+(.*?)\?/i,
            /de\s+que\s+forma\s+(.*?)\?/i,
            /qual\s+.*\s+maneira.*de\s+(.*?)\?/i
        ]

        for (const pattern of patterns) {
            const match = message.match(pattern)
            if (match) {
                return match[1].trim()
            }
        }

        return null
    }

    /**
     * Formata resposta para pergunta "por quê"
     * @param {Object} explanation - Explicação gerada
     * @returns {string} Resposta formatada
     */
    formatWhyResponse(explanation) {
        if (explanation.error) {
            return explanation.error
        }

        if (!explanation.success) {
            return `Não consegui explicar "${explanation.conclusion}". Não há informações suficientes na base de conhecimento.`
        }

        return this.explanationSystem.generateNaturalLanguageExplanation(explanation)
    }

    /**
     * Formata resposta para pergunta "como"
     * @param {Object} explanation - Explicação gerada
     * @returns {string} Resposta formatada
     */
    formatHowResponse(explanation) {
        if (explanation.error) {
            return explanation.error
        }

        return this.explanationSystem.generateNaturalLanguageExplanation(explanation)
    }

    /**
     * Formata resposta de inferência
     * @param {Object} result - Resultado da inferência
     * @returns {string} Resposta formatada
     */
    formatInferenceResponse(result) {
        let response = result.answer + '\n\n'

        if (result.success && result.result.steps) {
            response += 'Raciocínio:\n'
            result.result.steps.slice(0, 5).forEach(step => {
                response += `• ${step}\n`
            })
        }

        return response.trim()
    }

    /**
     * Formata resposta de consulta geral
     * @param {Object} result - Resultado da consulta
     * @returns {string} Resposta formatada
     */
    formatGeneralQueryResponse(result) {
        return this.formatInferenceResponse(result)
    }

    /**
     * Formata lista de regras
     * @param {Object} data - Dados das regras
     * @returns {string} Lista formatada
     */
    formatRulesListResponse(data) {
        if (data.rules.length === 0) {
            return 'Não há regras cadastradas na base de conhecimento.'
        }

        let response = `Regras cadastradas (${data.rules.length}):\n\n`
        data.rules.forEach((rule, index) => {
            response += `${index + 1}. SE ${rule.condition} ENTÃO ${rule.conclusion}\n`
        })

        return response.trim()
    }

    /**
     * Formata lista de fatos
     * @param {Object} data - Dados dos fatos
     * @returns {string} Lista formatada
     */
    formatFactsListResponse(data) {
        if (data.facts.length === 0) {
            return 'Não há fatos conhecidos na base de conhecimento.'
        }

        let response = `Fatos conhecidos (${data.facts.length}):\n\n`
        data.facts.forEach((fact, index) => {
            response += `${index + 1}. ${fact}\n`
        })

        return response.trim()
    }

    /**
     * Retorna mensagem de ajuda
     * @returns {string} Mensagem de ajuda
     */
    getHelpMessage() {
        return `Olá! Eu sou um sistema expert baseado em conhecimento. Você pode:\n\n
• Fazer perguntas: "Tweety é ave?", "Rex é mamífero?"
• Pedir explicações: "Por que Tweety é ave?", "Como provar que algo é mamífero?"
• Adicionar regras: "Se animal tem penas então animal é ave"
• Adicionar fatos: "Sabemos que Tweety tem penas"
• Listar conhecimento: "Mostre as regras", "Liste os fatos"
\n
Como posso ajudá-lo hoje?`
    }

    /**
     * Obtém o histórico do chat
     * @returns {Array} Histórico de mensagens
     */
    getChatHistory() {
        return this.chatHistory
    }

    /**
     * Limpa o histórico do chat
     */
    clearChatHistory() {
        this.chatHistory = []
        this.context.clear()
    }
}