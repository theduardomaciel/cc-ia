import React from 'react';
import type { WhyExplanation, HowExplanation } from '../types';

interface ExplanationTabProps {
    onExplainWhy: (target: string) => Promise<WhyExplanation>;
    onExplainHow: (goal: string) => Promise<HowExplanation>;
}

export const ExplanationTab: React.FC<ExplanationTabProps> = ({
    onExplainWhy,
    onExplainHow
}) => {
    const [whyTarget, setWhyTarget] = React.useState('');
    const [howGoal, setHowGoal] = React.useState('');
    const [explanation, setExplanation] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleWhySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!whyTarget.trim()) return;

        setLoading(true);
        try {
            const result = await onExplainWhy(whyTarget);
            setExplanation(formatWhyExplanation(result));
        } catch (error) {
            setExplanation(`Erro ao gerar explicação: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleHowSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!howGoal.trim()) return;

        setLoading(true);
        try {
            const result = await onExplainHow(howGoal);
            setExplanation(formatHowExplanation(result));
        } catch (error) {
            setExplanation(`Erro ao gerar explicação: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const formatWhyExplanation = (explanation: WhyExplanation): string => {
        let result = `🤔 Por que "${explanation.target}"?\n\n`;

        if (!explanation.found) {
            result += '❌ Este objetivo não foi encontrado na base de conhecimento.\n';
            return result;
        }

        result += '📋 Explicação:\n';
        explanation.explanation.forEach((item, index) => {
            const confidence = Math.round(item.confidence * 100);
            const icon = item.type === 'fact' ? '📄' : item.type === 'rule' ? '⚙️' : '🔗';

            result += `${index + 1}. ${icon} ${item.description} (Confiança: ${confidence}%)\n`;

            if (item.rule) {
                result += `   📝 Regra: ${item.rule.name}\n`;
            }

            if (item.dependencies && item.dependencies.length > 0) {
                result += `   📎 Depende de: ${item.dependencies.join(', ')}\n`;
            }

            result += '\n';
        });

        return result;
    };

    const formatHowExplanation = (explanation: HowExplanation): string => {
        let result = `🛠️ Como obter "${explanation.goal}"?\n\n`;

        if (explanation.strategies.length === 0) {
            result += '❌ Não foram encontradas estratégias para obter este objetivo.\n';
            return result;
        }

        result += '📋 Estratégias disponíveis:\n\n';
        explanation.strategies.forEach((strategy, index) => {
            const confidence = Math.round(strategy.confidence * 100);
            const feasibleIcon = strategy.feasible ? '✅' : '❌';
            const typeIcon = strategy.type === 'direct' ? '📄' : strategy.type === 'inference' ? '🔧' : '🚫';

            result += `${index + 1}. ${typeIcon} ${feasibleIcon} ${strategy.description} (Confiança: ${confidence}%)\n\n`;

            result += '   📝 Passos:\n';
            strategy.steps.forEach((step, stepIndex) => {
                result += `      ${stepIndex + 1}. ${step}\n`;
            });

            if (strategy.requiredFacts.length > 0) {
                result += `   📎 Fatos necessários: ${strategy.requiredFacts.join(', ')}\n`;
            }

            if (strategy.requiredRules.length > 0) {
                result += `   ⚙️ Regras necessárias: ${strategy.requiredRules.map(r => r.name).join(', ')}\n`;
            }

            result += '\n';
        });

        return result;
    };

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Gerando explicação...</span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Controls */}
            <div className="lg:col-span-1 space-y-6">

                {/* Why Explanation */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">🤔 Por Quê?</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Explica por que um fato é verdadeiro ou como foi derivado.
                    </p>
                    <form onSubmit={handleWhySubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">O que explicar?</label>
                            <input
                                type="text"
                                value={whyTarget}
                                onChange={(e) => setWhyTarget(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: maior_de_idade"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                            🤔 Explicar Por Quê
                        </button>
                    </form>
                </div>

                {/* How Explanation */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">🛠️ Como?</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Mostra como obter um objetivo ou que passos são necessários.
                    </p>
                    <form onSubmit={handleHowSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo a alcançar</label>
                            <input
                                type="text"
                                value={howGoal}
                                onChange={(e) => setHowGoal(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: cliente_premium"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 text-white py-3 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        >
                            🛠️ Explicar Como
                        </button>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">💡 Explicações</h2>
                    <div className="min-h-64">
                        {loading ? (
                            <LoadingSpinner />
                        ) : explanation ? (
                            <div className="border rounded-lg p-4 bg-white">
                                <div className="prose max-w-none">
                                    <pre className="whitespace-pre-wrap text-sm">{explanation}</pre>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12">
                                <p>Solicite uma explicação para ver os resultados aqui.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};