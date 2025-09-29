import './styles.css'
import { KnowledgeBase } from './modules/KnowledgeBase.js'
import { InferenceEngine } from './modules/InferenceEngine.js'
import { ExplanationSystem } from './modules/ExplanationSystem.js'
import { NaturalLanguageInterface } from './modules/NaturalLanguageInterface.js'
import { UIController } from './modules/UIController.js'

class ExpertSystem {
  constructor() {
    this.knowledgeBase = new KnowledgeBase()
    this.inferenceEngine = new InferenceEngine(this.knowledgeBase)
    this.explanationSystem = new ExplanationSystem(this.knowledgeBase, this.inferenceEngine)
    this.nlInterface = new NaturalLanguageInterface(this.inferenceEngine, this.explanationSystem)
    this.uiController = new UIController(this)

    this.init()
  }

  init() {
    // Initialize the UI
    this.uiController.initialize()

    // Expose UI controller globally for callbacks
    window.uiController = this.uiController

    // Load sample data
    this.loadSampleData()

    console.log('Sistema Expert inicializado com sucesso!')
  }

  loadSampleData() {
    // Sample rules
    this.knowledgeBase.addRule('animal tem penas', 'animal é ave')
    this.knowledgeBase.addRule('animal é ave', 'animal tem asas')
    this.knowledgeBase.addRule('animal voa', 'animal é ave')
    this.knowledgeBase.addRule('animal é mamífero', 'animal tem pelos')
    this.knowledgeBase.addRule('animal late', 'animal é cão')
    this.knowledgeBase.addRule('animal mia', 'animal é gato')

    // Sample facts
    this.knowledgeBase.addFact('Tweety tem penas')
    this.knowledgeBase.addFact('Rex late')
    this.knowledgeBase.addFact('Fluffy mia')

    // Update UI
    this.uiController.updateRulesList()
    this.uiController.updateFactsList()
  }
}

// Initialize the expert system when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new ExpertSystem()
})
