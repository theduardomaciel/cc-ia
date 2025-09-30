import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import type { Fact } from '@/types';

interface FactEditorProps {
    facts: Fact[];
    onFactAdd: (fact: Fact) => void;
    onFactEdit: (fact: Fact) => void;
    onFactDelete: (factId: string) => void;
}

export const FactEditor: React.FC<FactEditorProps> = ({
    facts,
    onFactAdd,
    onFactEdit,
    onFactDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingFact, setEditingFact] = useState<Fact | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        value: '',
        confidence: 1
    });

    const handleStartEdit = (fact?: Fact) => {
        if (fact) {
            setEditingFact(fact);
            setFormData({
                name: fact.name,
                value: fact.value,
                confidence: fact.confidence || 1
            });
        } else {
            setEditingFact(null);
            setFormData({
                name: '',
                value: '',
                confidence: 1
            });
        }
        setIsEditing(true);
    };

    const handleSave = () => {
        const fact: Fact = {
            id: editingFact?.id || `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: formData.name,
            value: formData.value,
            confidence: formData.confidence
        };

        if (editingFact) {
            onFactEdit(fact);
        } else {
            onFactAdd(fact);
        }

        setIsEditing(false);
        setEditingFact(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingFact(null);
    };

    const renderValue = (value: unknown): string => {
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value ? 'verdadeiro' : 'falso';
        if (Array.isArray(value)) return `[${value.join(', ')}]`;
        if (typeof value === 'object' && value !== null) return JSON.stringify(value);
        return String(value);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Editor de Fatos</h3>
                <Button onClick={() => handleStartEdit()} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Fato
                </Button>
            </div>

            {/* Lista de fatos existentes */}
            <div className="space-y-2">
                {facts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">
                        Nenhum fato cadastrado. Clique em "Novo Fato" para começar.
                    </div>
                ) : (
                    facts.map((fact) => (
                        <div key={fact.id} className="p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{fact.name}</span>
                                        <span className="text-gray-500">=</span>
                                        <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">
                                            {renderValue(fact.value)}
                                        </span>
                                    </div>
                                    {fact.confidence !== undefined && fact.confidence !== 1 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Confiança: {(fact.confidence * 100).toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStartEdit(fact)}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onFactDelete(fact.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Editor de fato */}
            {isEditing && (
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="font-medium mb-4">
                        {editingFact ? 'Editar Fato' : 'Novo Fato'}
                    </h4>

                    <div className="space-y-4">
                        {/* Nome do fato */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Nome do Fato / Variável
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                                placeholder="Ex: temperatura, sintoma, idade"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use nomes descritivos e únicos para identificar o fato
                            </p>
                        </div>

                        {/* Valor do fato */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor</label>
                            <input
                                type="text"
                                value={formData.value}
                                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                                placeholder="Ex: alta, febre, 25, verdadeiro"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Pode ser texto, número, verdadeiro/falso, ou uma lista separada por vírgulas
                            </p>
                        </div>

                        {/* Confiança */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Nível de Confiança
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={formData.confidence}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        confidence: parseFloat(e.target.value)
                                    }))}
                                    className="flex-1"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={formData.confidence}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            confidence: parseFloat(e.target.value)
                                        }))}
                                        className="w-16 p-1 border rounded text-sm"
                                    />
                                    <span className="text-sm text-gray-500">
                                        ({(formData.confidence * 100).toFixed(0)}%)
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                0.0 = Incerto, 1.0 = Totalmente certo
                            </p>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-4">
                            <Button onClick={handleSave}>
                                {editingFact ? 'Salvar Alterações' : 'Criar Fato'}
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};