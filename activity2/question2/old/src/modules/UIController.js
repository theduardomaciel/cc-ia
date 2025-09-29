/**
 * Controlador da Interface de Usuário - Gerencia a interação com a interface web
 */
export class UIController {
    constructor(expertSystem) {
        this.expertSystem = expertSystem
        this.currentTab = 'knowledge'
        this.chatMessages = []
    }

    /**
     * Inicializa a interface de usuário
     */
    initialize() {
        this.setupTabNavigation()
        this.setupKnowledgeBaseTab()
        this.setupInferenceTab()
        this.setupExplanationTab()
        this.setupDialogTab()

        console.log('Interface de usuário inicializada')
    }

    /**
     * Configura a navegação entre abas
     */
    setupTabNavigation() {
        const tabs = ['knowledge', 'inference', 'explanation', 'dialog']

        tabs.forEach(tabName => {
            const tabButton = document.getElementById(`tab-${tabName}`)
            const tabContent = document.getElementById(`content-${tabName}`)

            if (tabButton) {
                tabButton.addEventListener('click', () => {
                    this.switchTab(tabName)
                })
            }
        })
    }

    /**
     * Alterna entre abas
     * @param {string} tabName - Nome da aba
     */
    switchTab(tabName) {
        // Remove classe ativa de todas as abas
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('tab-active')
        })

        // Esconde todo o conteúdo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden')
        })

        // Ativa a aba selecionada
        const selectedTab = document.getElementById(`tab-${tabName}`)
        const selectedContent = document.getElementById(`content-${tabName}`)

        if (selectedTab && selectedContent) {
            selectedTab.classList.add('tab-active')
            selectedContent.classList.remove('hidden')
            this.currentTab = tabName
        }
    }

    /**
     * Configura a aba da Base de Conhecimento
     */
    setupKnowledgeBaseTab() {
        // Form para adicionar regras
        const ruleForm = document.getElementById('rule-form')
        if (ruleForm) {
            ruleForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.addRule()
            })
        }

        // Form para adicionar fatos
        const factForm = document.getElementById('fact-form')
        if (factForm) {
            factForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.addFact()
            })
        }
    }

    /**
     * Configura a aba do Motor de Inferência
     */
    setupInferenceTab() {
        const forwardBtn = document.getElementById('forward-btn')
        const backwardBtn = document.getElementById('backward-btn')
        const queryForm = document.getElementById('query-form')

        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => {
                this.runForwardChaining()
            })
        }

        if (backwardBtn) {
            backwardBtn.addEventListener('click', () => {
                this.runBackwardChaining()
            })
        }

        if (queryForm) {
            queryForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.runBackwardChaining()
            })
        }
    }

    /**
     * Configura a aba do Sistema de Explanação
     */
    setupExplanationTab() {
        const whyForm = document.getElementById('why-form')
        const howForm = document.getElementById('how-form')

        if (whyForm) {
            whyForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.explainWhy()
            })
        }

        if (howForm) {
            howForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.explainHow()
            })
        }
    }

    /**
     * Configura a aba do Diálogo Natural
     */
    setupDialogTab() {
        const chatForm = document.getElementById('chat-form')

        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.sendChatMessage()
            })
        }

        // Adiciona mensagem de boas-vindas
        this.addChatMessage('Sistema', this.expertSystem.nlInterface.getHelpMessage(), 'bot')
    }

    /**
     * Adiciona uma nova regra
     */
    addRule() {
        const conditionInput = document.getElementById('rule-condition')
        const conclusionInput = document.getElementById('rule-conclusion')

        if (conditionInput && conclusionInput) {
            const condition = conditionInput.value.trim()
            const conclusion = conclusionInput.value.trim()

            if (condition && conclusion) {
                this.expertSystem.knowledgeBase.addRule(condition, conclusion)
                this.updateRulesList()

                // Limpa os campos
                conditionInput.value = ''
                conclusionInput.value = ''

                this.showNotification('Regra adicionada com sucesso!', 'success')
            } else {
                this.showNotification('Por favor, preencha todos os campos.', 'error')
            }
        }
    }

    /**
     * Adiciona um novo fato
     */
    addFact() {
        const factInput = document.getElementById('fact-input')

        if (factInput) {
            const fact = factInput.value.trim()

            if (fact) {
                this.expertSystem.knowledgeBase.addFact(fact)
                this.updateFactsList()

                // Limpa o campo
                factInput.value = ''

                this.showNotification('Fato adicionado com sucesso!', 'success')
            } else {
                this.showNotification('Por favor, informe um fato.', 'error')
            }
        }
    }

    /**
     * Executa encadeamento para frente
     */
    runForwardChaining() {
        const result = this.expertSystem.inferenceEngine.forwardChaining()
        this.displayInferenceResult(result, 'forward')
    }

    /**
     * Executa encadeamento para trás
     */
    runBackwardChaining() {
        const queryInput = document.getElementById('query-input')

        if (queryInput) {
            const query = queryInput.value.trim()

            if (query) {
                const result = this.expertSystem.inferenceEngine.backwardChaining(query)
                this.displayInferenceResult(result, 'backward')
            } else {
                this.showNotification('Por favor, informe uma consulta.', 'error')
            }
        }
    }

    /**
     * Executa explicação "Por quê"
     */
    explainWhy() {
        const whyInput = document.getElementById('why-input')

        if (whyInput) {
            const conclusion = whyInput.value.trim()

            if (conclusion) {
                const explanation = this.expertSystem.explanationSystem.explainWhy(conclusion)
                this.displayWhyExplanation(explanation)
            } else {
                this.showNotification('Por favor, informe uma conclusão para explicar.', 'error')
            }
        }
    }

    /**
     * Executa explicação "Como"
     */
    explainHow() {
        const howInput = document.getElementById('how-input')

        if (howInput) {
            const goal = howInput.value.trim()

            if (goal) {
                const explanation = this.expertSystem.explanationSystem.explainHow(goal)
                this.displayHowExplanation(explanation)
            } else {
                this.showNotification('Por favor, informe um objetivo para explicar.', 'error')
            }
        }
    }

    /**
     * Envia mensagem no chat
     */
    sendChatMessage() {
        const chatInput = document.getElementById('chat-input')

        if (chatInput) {
            const message = chatInput.value.trim()

            if (message) {
                // Adiciona mensagem do usuário
                this.addChatMessage('Usuário', message, 'user')

                // Processa a mensagem
                const response = this.expertSystem.nlInterface.processMessage(message)

                // Adiciona resposta do bot
                this.addChatMessage('Sistema', response.botResponse, 'bot')

                // Limpa o campo
                chatInput.value = ''

                // Atualiza listas se houve mudança na base de conhecimento
                if (response.type === 'knowledge_update') {
                    this.updateRulesList()
                    this.updateFactsList()
                }
            }
        }
    }

    /**
     * Atualiza a lista de regras na interface
     */
    updateRulesList() {
        const rulesList = document.getElementById('rules-list')
        if (rulesList) {
            const rules = this.expertSystem.knowledgeBase.getAllRules()

            if (rules.length === 0) {
                rulesList.innerHTML = '<li class="text-gray-500 italic">Nenhuma regra cadastrada</li>'
                return
            }

            rulesList.innerHTML = rules.map(rule => `
        <li class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm">
            <strong>SE</strong> ${rule.condition} <strong>ENTÃO</strong> ${rule.conclusion}
          </span>
          <button onclick="window.uiController.removeRule('${rule.id}')" 
                  class="btn-danger text-xs px-2 py-1">
            Remover
          </button>
        </li>
      `).join('')
        }
    }

    /**
     * Atualiza a lista de fatos na interface
     */
    updateFactsList() {
        const factsList = document.getElementById('facts-list')
        if (factsList) {
            const facts = this.expertSystem.knowledgeBase.getAllFacts()

            if (facts.length === 0) {
                factsList.innerHTML = '<li class="text-gray-500 italic">Nenhum fato conhecido</li>'
                return
            }

            factsList.innerHTML = facts.map(fact => `
        <li class="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span class="text-sm">${fact}</span>
          <button onclick="window.uiController.removeFact('${fact}')" 
                  class="btn-danger text-xs px-2 py-1">
            Remover
          </button>
        </li>
      `).join('')
        }
    }

    /**
     * Remove uma regra
     * @param {string} ruleId - ID da regra
     */
    removeRule(ruleId) {
        if (this.expertSystem.knowledgeBase.removeRule(ruleId)) {
            this.updateRulesList()
            this.showNotification('Regra removida com sucesso!', 'success')
        }
    }

    /**
     * Remove um fato
     * @param {string} fact - Fato a ser removido
     */
    removeFact(fact) {
        if (this.expertSystem.knowledgeBase.removeFact(fact)) {
            this.updateFactsList()
            this.showNotification('Fato removido com sucesso!', 'success')
        }
    }

    /**
     * Exibe resultado da inferência
     * @param {Object} result - Resultado da inferência
     * @param {string} method - Método usado
     */
    displayInferenceResult(result, method) {
        const resultDiv = document.getElementById('inference-result')
        const stepsDiv = document.getElementById('inference-steps')

        if (resultDiv) {
            if (method === 'forward') {
                resultDiv.innerHTML = `
          <div class="space-y-2">
            <h4 class="font-semibold">Encadeamento para Frente</h4>
            <p><strong>Novos fatos derivados:</strong> ${result.derivedFacts.length}</p>
            <div class="bg-green-50 p-3 rounded">
              ${result.derivedFacts.length > 0 ?
                        result.derivedFacts.map(fact => `<div>• ${fact}</div>`).join('') :
                        '<div class="text-gray-600">Nenhum novo fato foi derivado</div>'
                    }
            </div>
          </div>
        `
            } else if (method === 'backward') {
                resultDiv.innerHTML = `
          <div class="space-y-2">
            <h4 class="font-semibold">Encadeamento para Trás</h4>
            <p><strong>Objetivo:</strong> ${result.goal}</p>
            <div class="p-3 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}">
              <strong>${result.success ? '✓ PROVADO' : '✗ NÃO PROVADO'}</strong>
            </div>
          </div>
        `
            }
        }

        if (stepsDiv && result.steps) {
            stepsDiv.innerHTML = `
        <h4 class="font-semibold mb-2">Passos da Inferência:</h4>
        <div class="space-y-1 max-h-60 overflow-y-auto">
          ${result.steps.map(step => `<div class="text-sm p-2 bg-gray-50 rounded">${step}</div>`).join('')}
        </div>
      `
        }
    }

    /**
     * Exibe explicação "Por quê"
     * @param {Object} explanation - Explicação gerada
     */
    displayWhyExplanation(explanation) {
        const whyResult = document.getElementById('why-result')

        if (whyResult) {
            whyResult.classList.remove('hidden')

            const naturalLanguageExplanation = this.expertSystem.explanationSystem
                .generateNaturalLanguageExplanation(explanation)

            whyResult.innerHTML = `
        <h4 class="font-semibold mb-2">Explicação:</h4>
        <div class="whitespace-pre-line text-sm">${naturalLanguageExplanation}</div>
      `
        }
    }

    /**
     * Exibe explicação "Como"
     * @param {Object} explanation - Explicação gerada
     */
    displayHowExplanation(explanation) {
        const howResult = document.getElementById('how-result')

        if (howResult) {
            howResult.classList.remove('hidden')

            const naturalLanguageExplanation = this.expertSystem.explanationSystem
                .generateNaturalLanguageExplanation(explanation)

            howResult.innerHTML = `
        <h4 class="font-semibold mb-2">Estratégias:</h4>
        <div class="whitespace-pre-line text-sm">${naturalLanguageExplanation}</div>
      `
        }
    }

    /**
     * Adiciona mensagem ao chat
     * @param {string} sender - Remetente da mensagem
     * @param {string} message - Conteúdo da mensagem
     * @param {string} type - Tipo da mensagem (user/bot)
     */
    addChatMessage(sender, message, type) {
        const chatMessages = document.getElementById('chat-messages')

        if (chatMessages) {
            const messageDiv = document.createElement('div')
            messageDiv.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'}`

            messageDiv.innerHTML = `
        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${type === 'user' ?
                    'bg-primary-600 text-white' :
                    'bg-gray-200 text-gray-800'
                }">
          <div class="text-xs opacity-75 mb-1">${sender}</div>
          <div class="text-sm whitespace-pre-line">${message}</div>
        </div>
      `

            chatMessages.appendChild(messageDiv)
            chatMessages.scrollTop = chatMessages.scrollHeight
        }
    }

    /**
     * Exibe notificação temporária
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo da notificação (success/error/info)
     */
    showNotification(message, type = 'info') {
        // Cria elemento de notificação
        const notification = document.createElement('div')
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
            }`
        notification.textContent = message

        document.body.appendChild(notification)

        // Remove após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        }, 3000)
    }
}

// Torna o UIController disponível globalmente para callbacks
window.uiController = null