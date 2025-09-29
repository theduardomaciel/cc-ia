/**
 * Motor de Inferência - Implementa encadeamento para frente e para trás
 */
export class InferenceEngine {
    constructor(knowledgeBase) {
        this.knowledgeBase = knowledgeBase
        this.inferenceHistory = []
    }

    /**
     * Encadeamento para frente - deriva novos fatos a partir dos fatos conhecidos
     * @param {string} startingFact - Fato inicial opcional
     * @returns {Object} Resultado da inferência
     */
    forwardChaining(startingFact = null) {
        console.log('Iniciando encadeamento para frente...')

        const derivedFacts = new Set()
        const appliedRules = []
        const steps = []

        // Inicia com todos os fatos conhecidos ou apenas o fato especificado
        const workingFacts = startingFact ?
            new Set([this.knowledgeBase.normalizeText(startingFact)]) :
            new Set(this.knowledgeBase.getAllFacts())

        let changed = true
        let iteration = 0

        while (changed && iteration < 100) { // Limit iterations to prevent infinite loops
            changed = false
            iteration++

            steps.push(`--- Iteração ${iteration} ---`)
            steps.push(`Fatos conhecidos: ${Array.from(workingFacts).join(', ')}`)

            // Para cada regra na base de conhecimento
            for (const rule of this.knowledgeBase.getAllRules()) {
                // Se a regra já foi aplicada, pule
                if (appliedRules.some(applied => applied.id === rule.id)) {
                    continue
                }

                // Verifica se a condição da regra é satisfeita por algum fato conhecido
                const satisfiedByFacts = Array.from(workingFacts).some(fact =>
                    this.knowledgeBase.matchesCondition(rule.condition, fact)
                )

                if (satisfiedByFacts) {
                    // Aplica a regra
                    const newFact = rule.conclusion

                    if (!workingFacts.has(newFact)) {
                        workingFacts.add(newFact)
                        derivedFacts.add(newFact)
                        appliedRules.push(rule)
                        changed = true

                        steps.push(`Regra aplicada: SE ${rule.condition} ENTÃO ${rule.conclusion}`)
                        steps.push(`Novo fato derivado: ${newFact}`)
                    }
                }
            }

            if (!changed) {
                steps.push('Nenhuma nova derivação possível.')
            }
        }

        const result = {
            success: derivedFacts.size > 0,
            derivedFacts: Array.from(derivedFacts),
            appliedRules: appliedRules,
            allFacts: Array.from(workingFacts),
            steps: steps,
            iterations: iteration
        }

        this.addToHistory('forward', startingFact, result)
        return result
    }

    /**
     * Encadeamento para trás - verifica se um objetivo pode ser provado
     * @param {string} goal - Objetivo a ser provado
     * @returns {Object} Resultado da inferência
     */
    backwardChaining(goal) {
        console.log(`Iniciando encadeamento para trás para objetivo: ${goal}`)

        const normalizedGoal = this.knowledgeBase.normalizeText(goal)
        const proofSteps = []
        const usedRules = []
        const visitedGoals = new Set()

        const result = this.proveGoal(normalizedGoal, proofSteps, usedRules, visitedGoals, 0)

        const finalResult = {
            success: result,
            goal: goal,
            proof: proofSteps,
            usedRules: usedRules,
            steps: proofSteps
        }

        this.addToHistory('backward', goal, finalResult)
        return finalResult
    }

    /**
     * Função recursiva para provar um objetivo
     * @param {string} goal - Objetivo a provar
     * @param {Array} proofSteps - Passos da prova
     * @param {Array} usedRules - Regras utilizadas
     * @param {Set} visitedGoals - Objetivos já visitados (evita ciclos)
     * @param {number} depth - Profundidade da recursão
     * @returns {boolean} True se o objetivo foi provado
     */
    proveGoal(goal, proofSteps, usedRules, visitedGoals, depth = 0) {
        const indent = '  '.repeat(depth)

        // Evita ciclos infinitos
        if (visitedGoals.has(goal)) {
            proofSteps.push(`${indent}Ciclo detectado para: ${goal}`)
            return false
        }

        visitedGoals.add(goal)
        proofSteps.push(`${indent}Tentando provar: ${goal}`)

        // Verifica se o objetivo já é um fato conhecido
        if (this.knowledgeBase.hasFact(goal)) {
            proofSteps.push(`${indent}✓ ${goal} é um fato conhecido`)
            visitedGoals.delete(goal)
            return true
        }

        // Busca regras que podem provar este objetivo
        const applicableRules = this.knowledgeBase.getRulesForGoal(goal)

        if (applicableRules.length === 0) {
            proofSteps.push(`${indent}✗ Nenhuma regra encontrada para provar: ${goal}`)
            visitedGoals.delete(goal)
            return false
        }

        // Tenta cada regra aplicável
        for (const rule of applicableRules) {
            proofSteps.push(`${indent}Tentando regra: SE ${rule.condition} ENTÃO ${rule.conclusion}`)

            // Tenta provar a condição da regra
            if (this.proveGoal(rule.condition, proofSteps, usedRules, visitedGoals, depth + 1)) {
                proofSteps.push(`${indent}✓ Regra aplicada com sucesso: ${rule.condition} → ${rule.conclusion}`)
                usedRules.push(rule)
                visitedGoals.delete(goal)
                return true
            } else {
                proofSteps.push(`${indent}✗ Não foi possível provar a condição: ${rule.condition}`)
            }
        }

        proofSteps.push(`${indent}✗ Não foi possível provar: ${goal}`)
        visitedGoals.delete(goal)
        return false
    }

    /**
     * Consulta híbrida - tenta encadeamento para frente e depois para trás
     * @param {string} query - Consulta a ser processada
     * @returns {Object} Resultado da consulta
     */
    query(query) {
        console.log(`Processando consulta: ${query}`)

        // Primeiro tenta encadeamento para frente
        const forwardResult = this.forwardChaining()

        // Verifica se a consulta foi satisfeita
        const normalizedQuery = this.knowledgeBase.normalizeText(query)
        const satisfiedByForward = forwardResult.allFacts.some(fact =>
            this.knowledgeBase.matchesCondition(fact, normalizedQuery)
        )

        if (satisfiedByForward) {
            return {
                method: 'forward',
                success: true,
                result: forwardResult,
                answer: 'Sim, a consulta foi satisfeita através do encadeamento para frente.'
            }
        }

        // Se não foi satisfeita, tenta encadeamento para trás
        const backwardResult = this.backwardChaining(query)

        return {
            method: 'backward',
            success: backwardResult.success,
            result: backwardResult,
            answer: backwardResult.success ?
                'Sim, a consulta foi provada através do encadeamento para trás.' :
                'Não foi possível provar a consulta.'
        }
    }

    /**
     * Adiciona uma entrada ao histórico de inferências
     * @param {string} method - Método usado (forward/backward)
     * @param {string} input - Entrada da consulta
     * @param {Object} result - Resultado da inferência
     */
    addToHistory(method, input, result) {
        this.inferenceHistory.push({
            timestamp: new Date(),
            method: method,
            input: input,
            result: result
        })
    }

    /**
     * Obtém o histórico de inferências
     * @returns {Array} Histórico de inferências
     */
    getHistory() {
        return this.inferenceHistory
    }

    /**
     * Limpa o histórico de inferências
     */
    clearHistory() {
        this.inferenceHistory = []
    }
}