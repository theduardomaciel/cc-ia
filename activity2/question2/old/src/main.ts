import './styles.css';
import { KnowledgeBase } from './modules/KnowledgeBase';
import { InferenceEngine } from './modules/InferenceEngine';
import { ExplanationSystem } from './modules/ExplanationSystem';
import { NaturalLanguageInterface } from './modules/NaturalLanguageInterface';
import { UIController } from './modules/UIController';

class ExpertSystem {
    knowledgeBase: KnowledgeBase;
    inferenceEngine: InferenceEngine;
    explanationSystem: ExplanationSystem;
    nlInterface: NaturalLanguageInterface;
    uiController: UIController;

    constructor() {
        this.knowledgeBase = new KnowledgeBase();
        this.inferenceEngine = new InferenceEngine(this.knowledgeBase);
        this.explanationSystem = new ExplanationSystem(this.knowledgeBase, this.inferenceEngine);
        this.nlInterface = new NaturalLanguageInterface(this.inferenceEngine, this.explanationSystem);
        this.uiController = new UIController(this);
        this.init();
    }
    private init() {
        this.uiController.initialize();
        window.uiController = this.uiController;
        this.loadSampleData();
    }
    private loadSampleData() {
        this.knowledgeBase.addRule('animal tem penas', 'animal é ave');
        this.knowledgeBase.addRule('animal é ave', 'animal tem asas');
        this.knowledgeBase.addRule('animal voa', 'animal é ave');
        this.knowledgeBase.addRule('animal é mamífero', 'animal tem pelos');
        this.knowledgeBase.addRule('animal late', 'animal é cão');
        this.knowledgeBase.addRule('animal mia', 'animal é gato');
        this.knowledgeBase.addFact('Tweety tem penas');
        this.knowledgeBase.addFact('Rex late');
        this.knowledgeBase.addFact('Fluffy mia');
        this.uiController.updateRulesList();
        this.uiController.updateFactsList();
    }
}

document.addEventListener('DOMContentLoaded', () => { new ExpertSystem(); });