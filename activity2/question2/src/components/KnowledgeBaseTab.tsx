import React from 'react';
import type { KnowledgeRule, Fact } from '../types';

interface KnowledgeBaseTabProps {
    rules: KnowledgeRule[];
    facts: Fact[];
    onAddRule: (condition: string, conclusion: string, name?: string) => void;
    onAddFact: (name: string, value: any, type: 'string' | 'number' | 'boolean' | 'object') => void;
    onRemoveRule: (ruleId: string) => void;
    onRemoveFact: (factId: string) => void;
    onToggleRule: (ruleId: string) => void;
    onClearAll: () => void;
    onLoadExamples: () => void;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({
    rules,
    facts,
    onAddRule,
    onAddFact,
    onRemoveRule,
    onRemoveFact,
    onToggleRule,
    onClearAll,
    onLoadExamples
}) => {
    const [ruleForm, setRuleForm] = React.useState({
        name: '',
        condition: '',
        conclusion: ''
    });

    const [factForm, setFactForm] = React.useState({
        name: '',
        value: '',
        type: 'string' as 'string' | 'number' | 'boolean' | 'object'
    });

    const handleRuleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ruleForm.condition && ruleForm.conclusion) {
            onAddRule(ruleForm.condition, ruleForm.conclusion, ruleForm.name || undefined);
            setRuleForm({ name: '', condition: '', conclusion: '' });
        }
    };

    const handleFactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (factForm.name && factForm.value !== '') {
            let value: any = factForm.value;

            // Converte o valor conforme o tipo
            switch (factForm.type) {
                case 'number':
                    value = Number(value);
                    if (isNaN(value)) {
                        alert('Valor numérico inválido');
                        return;
                    }
                    break;
                case 'boolean':
                    value = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'verdadeiro';
                    break;
                case 'object':
                    try {
                        value = JSON.parse(value);
                    } catch {
                        alert('Formato JSON inválido');
                        return;
                    }
                    break;
            }

            onAddFact(factForm.name, value, factForm.type);
            setFactForm({ name: '', value: '', type: 'string' });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rules Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">📋 Regras (SE...ENTÃO)</h2>

                <form onSubmit={handleRuleSubmit} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Regra (opcional)</label>
                        <input
                            type="text"
                            value={ruleForm.name}
                            onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Verificação de Maioridade"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condição (SE)</label>
                        <input
                            type="text"
                            value={ruleForm.condition}
                            onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: idade >= 18"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conclusão (ENTÃO)</label>
                        <input
                            type="text"
                            value={ruleForm.conclusion}
                            onChange={(e) => setRuleForm({ ...ruleForm, conclusion: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: maior_de_idade"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        ➕ Adicionar Regra
                    </button>
                </form>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={onLoadExamples}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 text-sm"
                    >
                        📚 Carregar Exemplos
                    </button>
                    <button
                        onClick={onClearAll}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                    >
                        🗑️ Limpar Tudo
                    </button>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Regras Definidas</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {rules.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhuma regra definida</p>
                        ) : (
                            rules.map(rule => (
                                <div key={rule.id} className={`border rounded-lg p-4 ${rule.active ? 'bg-white' : 'bg-gray-50'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-900">{rule.name || rule.id}</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onToggleRule(rule.id)}
                                                className={`text-sm px-2 py-1 rounded ${rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                            >
                                                {rule.active ? 'Ativa' : 'Inativa'}
                                            </button>
                                            <button
                                                onClick={() => onRemoveRule(rule.id)}
                                                className="text-sm px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div><span className="font-medium">SE:</span> {rule.condition}</div>
                                        <div><span className="font-medium">ENTÃO:</span> {rule.conclusion}</div>
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span>Prioridade: {rule.priority}</span>
                                            <span>Criada: {rule.createdAt.toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Facts Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">💎 Fatos</h2>

                <form onSubmit={handleFactSubmit} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Fato</label>
                        <input
                            type="text"
                            value={factForm.name}
                            onChange={(e) => setFactForm({ ...factForm, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: idade"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                        <input
                            type="text"
                            value={factForm.value}
                            onChange={(e) => setFactForm({ ...factForm, value: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 25"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            value={factForm.type}
                            onChange={(e) => setFactForm({ ...factForm, type: e.target.value as any })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="string">Texto (string)</option>
                            <option value="number">Número (number)</option>
                            <option value="boolean">Verdadeiro/Falso (boolean)</option>
                            <option value="object">Objeto (JSON)</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        ➕ Adicionar Fato
                    </button>
                </form>

                <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Fatos Definidos</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {facts.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhum fato definido</p>
                        ) : (
                            facts.map(fact => (
                                <div key={fact.id} className="border rounded-lg p-3 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-900">{fact.name}</h4>
                                        <button
                                            onClick={() => onRemoveFact(fact.id)}
                                            className="text-sm px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div><span className="font-medium">Valor:</span> {JSON.stringify(fact.value)}</div>
                                        <div><span className="font-medium">Tipo:</span> {fact.type}</div>
                                        {fact.description && (
                                            <div><span className="font-medium">Descrição:</span> {fact.description}</div>
                                        )}
                                        <div className="text-xs text-gray-500">Criado: {fact.createdAt.toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};