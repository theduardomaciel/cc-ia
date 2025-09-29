import React from 'react';
import type { InferenceResult } from '../types';

interface InferenceTabProps {
    onForwardChaining: () => Promise<InferenceResult>;
    onBackwardChaining: (goal: string) => Promise<InferenceResult>;
}

export const InferenceTab: React.FC<InferenceTabProps> = ({
    onForwardChaining,
    onBackwardChaining
}) => {
    const [backwardGoal, setBackwardGoal] = React.useState('');
    const [result, setResult] = React.useState<InferenceResult | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleForwardChaining = async () => {
        setLoading(true);
        try {
            const inferenceResult = await onForwardChaining();
            setResult(inferenceResult);
        } catch (error) {
            console.error('Erro na inferência:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackwardChaining = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!backwardGoal.trim()) return;

        setLoading(true);
        try {
            const inferenceResult = await onBackwardChaining(backwardGoal);
            setResult(inferenceResult);
        } catch (error) {
            console.error('Erro na inferência:', error);
        } finally {
            setLoading(false);
        }
    };

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Executando inferência...</span>
        </div>
    );

    const InferenceResultDisplay = ({ result }: { result: InferenceResult }) => {
        const successIcon = result.success ? '✅' : '❌';
        const methodName = result.method === 'forward' ? 'Encadeamento para Frente' : 'Encadeamento para Trás';

        return (
            <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{successIcon}</span>
                    <h3 className="text-lg font-semibold">{methodName}</h3>
                </div>

                {result.goal && (
                    <div className="mb-3">
                        <span className="font-medium">Objetivo:</span> {result.goal}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h4 className="font-medium mb-2">📊 Estatísticas</h4>
                        <div className="text-sm space-y-1">
                            <div>Status: <span className={`${result.success ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                {result.success ? 'Sucesso' : 'Falha'}
                            </span></div>
                            <div>Tempo: {result.executionTime}ms</div>
                            <div>Regras aplicadas: {result.appliedRules.length}</div>
                            <div>Fatos derivados: {result.derivedFacts.length}</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">⚙️ Regras Utilizadas</h4>
                        <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                            {result.appliedRules.length > 0 ? (
                                result.appliedRules.map((rule, index) => (
                                    <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                                        {rule.name || rule.id}
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500">Nenhuma regra aplicada</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="font-medium mb-2">📝 Passos da Execução</h4>
                    <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                            {result.steps.join('\n')}
                        </pre>
                    </div>
                </div>

                {result.proof && result.proof.length > 0 && (
                    <div>
                        <h4 className="font-medium mb-2">🎯 Prova</h4>
                        <div className="bg-blue-50 rounded p-3">
                            <div className="text-sm space-y-1">
                                {result.proof.map((step, index) => (
                                    <div key={index}>{index + 1}. {step}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-1 space-y-6">

                {/* Forward Chaining */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">🔄 Encadeamento para Frente</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Deriva novos fatos a partir dos fatos conhecidos e regras ativas.
                    </p>
                    <button
                        onClick={handleForwardChaining}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        ▶️ Executar Forward Chaining
                    </button>
                </div>

                {/* Backward Chaining */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">🎯 Encadeamento para Trás</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Tenta provar um objetivo específico trabalhando para trás a partir das regras.
                    </p>
                    <form onSubmit={handleBackwardChaining} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo a Provar</label>
                            <input
                                type="text"
                                value={backwardGoal}
                                onChange={(e) => setBackwardGoal(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: maior_de_idade"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                            🎯 Executar Backward Chaining
                        </button>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">📊 Resultados da Inferência</h2>
                    <div className="min-h-64">
                        {loading ? (
                            <LoadingSpinner />
                        ) : result ? (
                            <InferenceResultDisplay result={result} />
                        ) : (
                            <div className="text-center text-gray-500 py-12">
                                <p>Execute uma operação de inferência para ver os resultados aqui.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};