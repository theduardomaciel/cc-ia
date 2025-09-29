/**
 * Sistema de Explanação - Responde perguntas "Por quê?" e "Como?"
 */
export class ExplanationSystem {
    constructor(knowledgeBase, inferenceEngine) {
        this.knowledgeBase = knowledgeBase
        this.inferenceEngine = inferenceEngine
    }

    /**
     * Explica POR QUÊ uma conclusão foi alcançada
     * @param {string} conclusion - Conclusão a ser explicada
     * @returns {Object} Explicação detalhada
     */
    explainWhy(conclusion) {
        console.log(`Explicando POR QUÊ: ${conclusion}`)

        const normalizedConclusion = this.knowledgeBase.normalizeText(conclusion)
        const explanation = {
            conclusion: conclusion,
            type: 'why',
            explanation: [],
            success: false
        }

        // Verifica se é um fato conhecido diretamente
        if (this.knowledgeBase.hasFact(normalizedConclusion)) {
            explanation.explanation.push({
                type: 'fact',
                text: `"${conclusion}" é um fato conhecido diretamente na base de conhecimento.`,
                confidence: 'alta'
            })
            explanation.success = true
            return explanation
        }

        // Busca regras que podem ter levado a esta conclusão
        const applicableRules = this.knowledgeBase.getRulesForGoal(normalizedConclusion)

        if (applicableRules.length === 0) {
            explanation.explanation.push({
                type: 'error',
                text: `Não foi possível encontrar uma explicação para "${conclusion}". Não há regras que levem a esta conclusão.`,
                confidence: 'baixa'
            })
            return explanation
        }

        // Para cada regra aplicável, verifica se suas condições são satisfeitas
        for (const rule of applicableRules) {
            const ruleExplanation = {
                type: 'rule',
                rule: rule,
                text: `A conclusão "${conclusion}" pode ser derivada da regra: SE "${rule.condition}" ENTÃO "${rule.conclusion}"`,
                conditions: [],
                confidence: 'média'
            }

            // Verifica se a condição da regra é satisfeita
            if (this.knowledgeBase.hasFact(rule.condition)) {
                ruleExplanation.conditions.push({
                    condition: rule.condition,
                    satisfied: true,
                    reason: 'É um fato conhecido'
                })
                ruleExplanation.confidence = 'alta'
                explanation.success = true
            } else {
                // Tenta explicar recursivamente a condição
                const conditionExplanation = this.explainWhy(rule.condition)
                if (conditionExplanation.success) {
                    ruleExplanation.conditions.push({
                        condition: rule.condition,
                        satisfied: true,
                        reason: 'Pode ser derivado através de outras regras',
                        subExplanation: conditionExplanation
                    })
                    ruleExplanation.confidence = 'alta'
                    explanation.success = true
                } else {
                    ruleExplanation.conditions.push({
                        condition: rule.condition,
                        satisfied: false,
                        reason: 'Não pode ser provado com os fatos e regras disponíveis'
                    })
                }
            }

            explanation.explanation.push(ruleExplanation)
        }

        return explanation
    }

    /**
     * Explica COMO uma conclusão pode ser alcançada
     * @param {string} goal - Objetivo a ser explicado
     * @returns {Object} Explicação detalhada
     */
    explainHow(goal) {
        console.log(`Explicando COMO: ${goal}`)

        const explanation = {
            goal: goal,
            type: 'how',
            explanation: [],
            success: false,
            strategies: []
        }

        const normalizedGoal = this.knowledgeBase.normalizeText(goal)

        // Estratégia 1: Verificar se já é um fato conhecido
        if (this.knowledgeBase.hasFact(normalizedGoal)) {
            explanation.strategies.push({
                type: 'direct_fact',
                description: `"${goal}" já é um fato conhecido na base de conhecimento.`,
                steps: ['Verificar na base de fatos conhecidos'],
                feasible: true,
                confidence: 'alta'
            })
            explanation.success = true
        }

        // Estratégia 2: Buscar regras que podem provar o objetivo
        const applicableRules = this.knowledgeBase.getRulesForGoal(normalizedGoal)

        for (const rule of applicableRules) {
            const strategy = {
                type: 'rule_based',
                rule: rule,
                description: `Para provar "${goal}", você pode usar a regra: SE "${rule.condition}" ENTÃO "${rule.conclusion}"`,
                steps: [],
                feasible: false,
                confidence: 'média',
                requirements: []
            }

            // Analisa os requisitos para aplicar esta regra
            strategy.steps.push(`1. Verificar se a condição "${rule.condition}" é verdadeira`)

            if (this.knowledgeBase.hasFact(rule.condition)) {
                strategy.steps.push(`2. A condição "${rule.condition}" já é um fato conhecido`)
                strategy.steps.push(`3. Aplicar a regra para concluir "${rule.conclusion}"`)
                strategy.feasible = true
                strategy.confidence = 'alta'
                explanation.success = true
            } else {
                // Verifica se a condição pode ser provada
                const conditionRules = this.knowledgeBase.getRulesForGoal(rule.condition)
                if (conditionRules.length > 0) {
                    strategy.steps.push(`2. Para provar "${rule.condition}", você pode usar uma das seguintes regras:`)
                    conditionRules.forEach((condRule, index) => {
                        strategy.steps.push(`   ${index + 1}. SE "${condRule.condition}" ENTÃO "${condRule.conclusion}"`)
                    })
                    strategy.steps.push(`3. Aplicar a regra principal para concluir "${rule.conclusion}"`)
                    strategy.feasible = true
                    strategy.confidence = 'média'
                    explanation.success = true
                } else {
                    strategy.steps.push(`2. ⚠️ A condição "${rule.condition}" não pode ser provada com as regras disponíveis`)
                    strategy.steps.push(`3. Você precisaria adicionar "${rule.condition}" como um fato ou criar regras para prová-lo`)
                    strategy.feasible = false
                }
            }

            strategy.requirements.push(`Condição necessária: ${rule.condition}`)
            explanation.strategies.push(strategy)
        }

        // Se nenhuma estratégia foi encontrada
        if (explanation.strategies.length === 0) {
            explanation.explanation.push({
                type: 'no_strategy',
                text: `Não há estratégias conhecidas para provar "${goal}". Você precisaria:`,
                suggestions: [
                    `Adicionar "${goal}" como um fato conhecido, ou`,
                    `Criar regras que tenham "${goal}" como conclusão`
                ]
            })
        }

        return explanation
    }

    /**
     * Explica o raciocínio de uma inferência específica
     * @param {string} method - Método de inferência (forward/backward)
     * @param {Object} result - Resultado da inferência
     * @returns {Object} Explicação do raciocínio
     */
    explainReasoning(method, result) {
        const explanation = {
            method: method,
            reasoning: [],
            summary: ''
        }

        if (method === 'forward') {
            explanation.reasoning.push('ENCADEAMENTO PARA FRENTE:')
            explanation.reasoning.push('Este método parte dos fatos conhecidos e aplica regras para derivar novos fatos.')

            if (result.appliedRules && result.appliedRules.length > 0) {
                explanation.reasoning.push('\nRegras aplicadas:')
                result.appliedRules.forEach((rule, index) => {
                    explanation.reasoning.push(`${index + 1}. SE "${rule.condition}" ENTÃO "${rule.conclusion}"`)
                })

                explanation.reasoning.push('\nFatos derivados:')
                result.derivedFacts.forEach((fact, index) => {
                    explanation.reasoning.push(`${index + 1}. ${fact}`)
                })

                explanation.summary = `O sistema derivou ${result.derivedFacts.length} novos fatos aplicando ${result.appliedRules.length} regras.`
            } else {
                explanation.summary = 'Nenhum novo fato foi derivado com as regras disponíveis.'
            }
        } else if (method === 'backward') {
            explanation.reasoning.push('ENCADEAMENTO PARA TRÁS:')
            explanation.reasoning.push('Este método parte do objetivo e tenta encontrar uma cadeia de regras que o prove.')

            if (result.success) {
                explanation.reasoning.push(`\nO objetivo "${result.goal}" foi PROVADO.`)
                if (result.usedRules && result.usedRules.length > 0) {
                    explanation.reasoning.push('\nRegras utilizadas na prova:')
                    result.usedRules.forEach((rule, index) => {
                        explanation.reasoning.push(`${index + 1}. SE "${rule.condition}" ENTÃO "${rule.conclusion}"`)
                    })
                }
                explanation.summary = `O objetivo foi provado usando ${result.usedRules ? result.usedRules.length : 0} regras.`
            } else {
                explanation.reasoning.push(`\nO objetivo "${result.goal}" NÃO PÔDE SER PROVADO.`)
                explanation.reasoning.push('Isso pode acontecer porque:')
                explanation.reasoning.push('• Não há regras suficientes na base de conhecimento')
                explanation.reasoning.push('• Os fatos necessários não estão disponíveis')
                explanation.reasoning.push('• Há uma lacuna na cadeia lógica')
                explanation.summary = 'O objetivo não pôde ser provado com o conhecimento disponível.'
            }
        }

        return explanation
    }

    /**
     * Gera uma explicação em linguagem natural amigável
     * @param {Object} explanation - Objeto de explicação
     * @returns {string} Texto em linguagem natural
     */
    generateNaturalLanguageExplanation(explanation) {
        let text = ''

        if (explanation.type === 'why') {
            text += `Explicação para "${explanation.conclusion}":\n\n`

            explanation.explanation.forEach((item, index) => {
                if (item.type === 'fact') {
                    text += `• ${item.text}\n`
                } else if (item.type === 'rule') {
                    text += `• ${item.text}\n`
                    item.conditions.forEach(condition => {
                        if (condition.satisfied) {
                            text += `  ✓ A condição "${condition.condition}" é satisfeita: ${condition.reason}\n`
                        } else {
                            text += `  ✗ A condição "${condition.condition}" não é satisfeita: ${condition.reason}\n`
                        }
                    })
                } else if (item.type === 'error') {
                    text += `• ${item.text}\n`
                }

                if (index < explanation.explanation.length - 1) {
                    text += '\n'
                }
            })
        } else if (explanation.type === 'how') {
            text += `Como provar "${explanation.goal}":\n\n`

            if (explanation.strategies.length > 0) {
                explanation.strategies.forEach((strategy, index) => {
                    text += `Estratégia ${index + 1}: ${strategy.description}\n`
                    strategy.steps.forEach(step => {
                        text += `  ${step}\n`
                    })
                    text += `  Viabilidade: ${strategy.feasible ? 'Possível' : 'Não possível no momento'}\n`
                    text += `  Confiança: ${strategy.confidence}\n\n`
                })
            } else {
                text += 'Nenhuma estratégia disponível no momento.\n'
            }
        }

        return text
    }
}