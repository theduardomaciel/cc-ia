/**
 * Base de Conhecimento - Gerencia regras e fatos
 */
export class KnowledgeBase {
    constructor() {
        this.rules = new Map() // ID -> {condition, conclusion, id}
        this.facts = new Set() // Set de fatos conhecidos
        this.ruleCounter = 0
    }

    /**
     * Adiciona uma nova regra SE...ENTÃO
     * @param {string} condition - Condição da regra
     * @param {string} conclusion - Conclusão da regra
     * @returns {string} ID da regra criada
     */
    addRule(condition, conclusion) {
        const id = `rule_${++this.ruleCounter}`
        const rule = {
            id,
            condition: this.normalizeText(condition),
            conclusion: this.normalizeText(conclusion)
        }

        this.rules.set(id, rule)
        console.log(`Regra adicionada: SE ${condition} ENTÃO ${conclusion}`)
        return id
    }

    /**
     * Remove uma regra
     * @param {string} ruleId - ID da regra a ser removida
     */
    removeRule(ruleId) {
        if (this.rules.has(ruleId)) {
            this.rules.delete(ruleId)
            console.log(`Regra removida: ${ruleId}`)
            return true
        }
        return false
    }

    /**
     * Adiciona um fato à base de conhecimento
     * @param {string} fact - Fato a ser adicionado
     */
    addFact(fact) {
        const normalizedFact = this.normalizeText(fact)
        this.facts.add(normalizedFact)
        console.log(`Fato adicionado: ${fact}`)
    }

    /**
     * Remove um fato da base de conhecimento
     * @param {string} fact - Fato a ser removido
     */
    removeFact(fact) {
        const normalizedFact = this.normalizeText(fact)
        if (this.facts.has(normalizedFact)) {
            this.facts.delete(normalizedFact)
            console.log(`Fato removido: ${fact}`)
            return true
        }
        return false
    }

    /**
     * Verifica se um fato existe na base de conhecimento
     * @param {string} fact - Fato a ser verificado
     * @returns {boolean}
     */
    hasFact(fact) {
        return this.facts.has(this.normalizeText(fact))
    }

    /**
     * Obtém todas as regras
     * @returns {Array} Array de regras
     */
    getAllRules() {
        return Array.from(this.rules.values())
    }

    /**
     * Obtém todos os fatos
     * @returns {Array} Array de fatos
     */
    getAllFacts() {
        return Array.from(this.facts)
    }

    /**
     * Busca regras cuja condição corresponde ao fato dado
     * @param {string} fact - Fato para buscar regras
     * @returns {Array} Regras aplicáveis
     */
    getRulesForFact(fact) {
        const normalizedFact = this.normalizeText(fact)
        return this.getAllRules().filter(rule =>
            this.matchesCondition(rule.condition, normalizedFact)
        )
    }

    /**
     * Busca regras cuja conclusão corresponde ao objetivo dado
     * @param {string} goal - Objetivo para buscar regras
     * @returns {Array} Regras que podem provar o objetivo
     */
    getRulesForGoal(goal) {
        const normalizedGoal = this.normalizeText(goal)
        return this.getAllRules().filter(rule =>
            this.matchesCondition(rule.conclusion, normalizedGoal)
        )
    }

    /**
     * Verifica se uma condição corresponde a um fato
     * @param {string} condition - Condição da regra
     * @param {string} fact - Fato a verificar
     * @returns {boolean}
     */
    matchesCondition(condition, fact) {
        // Implementação simples - pode ser expandida para padrões mais complexos
        return condition === fact ||
            condition.includes(fact) ||
            fact.includes(condition)
    }

    /**
     * Normaliza texto removendo espaços extras e convertendo para minúsculas
     * @param {string} text - Texto a ser normalizado
     * @returns {string} Texto normalizado
     */
    normalizeText(text) {
        return text.toLowerCase().trim().replace(/\s+/g, ' ')
    }

    /**
     * Exporta a base de conhecimento para JSON
     * @returns {Object} Dados da base de conhecimento
     */
    export() {
        return {
            rules: this.getAllRules(),
            facts: this.getAllFacts()
        }
    }

    /**
     * Importa base de conhecimento de JSON
     * @param {Object} data - Dados para importar
     */
    import(data) {
        this.rules.clear()
        this.facts.clear()
        this.ruleCounter = 0

        if (data.rules) {
            data.rules.forEach(rule => {
                this.addRule(rule.condition, rule.conclusion)
            })
        }

        if (data.facts) {
            data.facts.forEach(fact => {
                this.addFact(fact)
            })
        }
    }
}