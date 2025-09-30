import React from 'react';
import { Clock, ArrowRight, CheckCircle, Info } from 'lucide-react';
import type { InferenceStep } from '@/types';

interface InferenceTraceProps {
    trace: InferenceStep[];
    title?: string;
}

export const InferenceTrace: React.FC<InferenceTraceProps> = ({
    trace,
    title = 'Trace de Inferência'
}) => {
    const formatTimestamp = (date: Date): string => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStepIcon = (type: InferenceStep['type']) => {
        switch (type) {
            case 'rule-applied':
                return <ArrowRight className="w-4 h-4 text-blue-600" />;
            case 'fact-added':
                return <Info className="w-4 h-4 text-green-600" />;
            case 'goal-reached':
                return <CheckCircle className="w-4 h-4 text-emerald-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStepColor = (type: InferenceStep['type']) => {
        switch (type) {
            case 'rule-applied':
                return 'border-blue-200 bg-blue-50';
            case 'fact-added':
                return 'border-green-200 bg-green-50';
            case 'goal-reached':
                return 'border-emerald-200 bg-emerald-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    const getStepTitle = (step: InferenceStep): string => {
        switch (step.type) {
            case 'rule-applied':
                return `Regra Aplicada: ${step.ruleName || step.ruleId}`;
            case 'fact-added':
                return 'Fato Adicionado';
            case 'goal-reached':
                return 'Objetivo Alcançado';
            default:
                return 'Passo de Inferência';
        }
    };

    if (trace.length === 0) {
        return (
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum trace de inferência disponível.</p>
                    <p className="text-sm mt-2">Execute uma consulta para ver o raciocínio do sistema.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <div className="text-sm text-gray-500">
                    {trace.length} passo{trace.length !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="space-y-3">
                {trace.map((step, index) => (
                    <div
                        key={index}
                        className={`p-4 border rounded-lg ${getStepColor(step.type)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                {getStepIcon(step.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">
                                        {index + 1}. {getStepTitle(step)}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                        {formatTimestamp(step.timestamp)}
                                    </span>
                                </div>

                                {step.type === 'rule-applied' && (
                                    <div className="space-y-2">
                                        {step.factsUsed.length > 0 && (
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    Fatos utilizados:
                                                </span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {step.factsUsed.map((fact, factIndex) => (
                                                        <span
                                                            key={factIndex}
                                                            className="px-2 py-1 bg-white border rounded text-xs font-mono"
                                                        >
                                                            {fact}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {step.conclusionReached && (
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    Conclusão:
                                                </span>
                                                <div className="mt-1 p-2 bg-white border rounded">
                                                    <span className="text-sm font-mono">
                                                        {step.conclusionReached}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step.type === 'fact-added' && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600">
                                            Fatos adicionados:
                                        </span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {step.factsUsed.map((fact, factIndex) => (
                                                <span
                                                    key={factIndex}
                                                    className="px-2 py-1 bg-white border rounded text-xs font-mono"
                                                >
                                                    {fact}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step.type === 'goal-reached' && step.conclusionReached && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600">
                                            Objetivo alcançado:
                                        </span>
                                        <div className="mt-1 p-2 bg-white border rounded">
                                            <span className="text-sm font-mono font-bold">
                                                {step.conclusionReached}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumo */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-medium mb-2">Resumo da Inferência</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Total de passos:</span>
                        <div className="font-medium">{trace.length}</div>
                    </div>
                    <div>
                        <span className="text-gray-600">Regras aplicadas:</span>
                        <div className="font-medium">
                            {trace.filter(s => s.type === 'rule-applied').length}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-600">Fatos adicionados:</span>
                        <div className="font-medium">
                            {trace.filter(s => s.type === 'fact-added').length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};