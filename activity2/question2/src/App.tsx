import React from 'react';
import { KnowledgeBaseTab } from './components/KnowledgeBaseTab';
import { InferenceTab } from './components/InferenceTab';
import { ExplanationTab } from './components/ExplanationTab';
import { ChatTab } from './components/ChatTab';

// Import system modules
import { KnowledgeBase } from './modules/KnowledgeBase';
import { InferenceEngine } from './modules/InferenceEngine';
import { ExplanationSystem } from './modules/ExplanationSystem';
import { NaturalLanguageInterface } from './modules/NaturalLanguageInterface';

// Import types
import type { InferenceResult, WhyExplanation, HowExplanation } from './types';

type TabType = 'knowledge' | 'inference' | 'explanation' | 'chat';

export const App: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState<TabType>('knowledge');

    // Initialize system modules
    const knowledgeBase = React.useMemo(() => new KnowledgeBase(), []);
    const inferenceEngine = React.useMemo(() => new InferenceEngine(knowledgeBase), [knowledgeBase]);
    const explanationSystem = React.useMemo(() => new ExplanationSystem(knowledgeBase, inferenceEngine), [knowledgeBase, inferenceEngine]);
    const nlInterface = React.useMemo(() => new NaturalLanguageInterface(knowledgeBase, inferenceEngine, explanationSystem), [knowledgeBase, inferenceEngine, explanationSystem]);

    // Tab configuration
    const tabs = [
        { id: 'knowledge' as TabType, label: '📚 Base de Conhecimento', icon: '📚' },
        { id: 'inference' as TabType, label: '🔧 Motor de Inferência', icon: '🔧' },
        { id: 'explanation' as TabType, label: '💡 Sistema de Explicação', icon: '💡' },
        { id: 'chat' as TabType, label: '💬 Interface Natural', icon: '💬' }
    ];

    // Knowledge Base handlers
    const handleAddRule = async (condition: string, conclusion: string, name?: string): Promise<void> => {
        knowledgeBase.addRule(condition, conclusion, { name });
    };

    const handleRemoveRule = async (id: string): Promise<void> => {
        knowledgeBase.removeRule(id);
    };

    const handleAddFact = async (name: string, value: any, type: 'string' | 'number' | 'boolean' | 'object'): Promise<void> => {
        knowledgeBase.addFact(name, value, { type });
    };

    const handleRemoveFact = async (id: string): Promise<void> => {
        knowledgeBase.removeFact(id);
    };

    const handleToggleRule = async (id: string): Promise<void> => {
        const rule = knowledgeBase.getRuleById(id);
        if (rule) {
            knowledgeBase.updateRule(id, { active: !rule.active });
        }
    };

    const handleClearAll = async (): Promise<void> => {
        knowledgeBase.clear();
    };

    const handleLoadExamples = async (): Promise<void> => {
        // Exemplos de regras
        knowledgeBase.addRule('idade >= 18', 'maior_de_idade = true', { name: 'Maioridade' });
        knowledgeBase.addRule('salario > 5000 e tempo_empresa >= 2', 'credito_aprovado = true', { name: 'Crédito' });
        knowledgeBase.addRule('maior_de_idade = true e credito_aprovado = true', 'cliente_premium = true', { name: 'Cliente Premium' });

        // Exemplos de fatos
        knowledgeBase.addFact('idade', 25, { type: 'number' });
        knowledgeBase.addFact('salario', 6000, { type: 'number' });
        knowledgeBase.addFact('tempo_empresa', 3, { type: 'number' });
    };

    // Inference handlers
    const handleForwardChaining = async (): Promise<InferenceResult> => {
        return inferenceEngine.forwardChaining();
    };

    const handleBackwardChaining = async (goal: string): Promise<InferenceResult> => {
        return inferenceEngine.backwardChaining(goal);
    };

    // Explanation handlers
    const handleExplainWhy = async (target: string): Promise<WhyExplanation> => {
        return explanationSystem.explainWhy(target);
    };

    const handleExplainHow = async (goal: string): Promise<HowExplanation> => {
        return explanationSystem.explainHow(goal);
    };

    // Natural Language handler
    const handleProcessNaturalLanguage = async (input: string): Promise<string> => {
        const result = await nlInterface.processMessage(input);
        return result.content;
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'knowledge':
                return (
                    <KnowledgeBaseTab
                        rules={knowledgeBase.getAllRules()}
                        facts={knowledgeBase.getAllFacts()}
                        onAddRule={handleAddRule}
                        onAddFact={handleAddFact}
                        onRemoveRule={handleRemoveRule}
                        onRemoveFact={handleRemoveFact}
                        onToggleRule={handleToggleRule}
                        onClearAll={handleClearAll}
                        onLoadExamples={handleLoadExamples}
                    />
                );
            case 'inference':
                return (
                    <InferenceTab
                        onForwardChaining={handleForwardChaining}
                        onBackwardChaining={handleBackwardChaining}
                    />
                );
            case 'explanation':
                return (
                    <ExplanationTab
                        onExplainWhy={handleExplainWhy}
                        onExplainHow={handleExplainHow}
                    />
                );
            case 'chat':
                return (
                    <ChatTab
                        onProcessNaturalLanguage={handleProcessNaturalLanguage}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                🧠 Sistema Especialista
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Sistema baseado em conhecimento com inferência e explicação
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                TypeScript + React + Tailwind CSS
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderActiveTab()}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <div>
                            Sistema Especialista - Ciência da Computação
                        </div>
                        <div>
                            Construído com React 19 + TypeScript + Tailwind CSS 4
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};