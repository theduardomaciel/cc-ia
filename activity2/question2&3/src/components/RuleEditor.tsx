import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import type { Rule, Condition, Conclusion } from '@/types';

interface RuleEditorProps {
    rules: Rule[];
    onRuleAdd: (rule: Rule) => void;
    onRuleEdit: (rule: Rule) => void;
    onRuleDelete: (ruleId: string) => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({
    rules,
    onRuleAdd,
    onRuleEdit,
    onRuleDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        conditions: Condition[];
        conclusions: Conclusion[];
        priority: number;
    }>({
        name: '',
        description: '',
        conditions: [{ fact: '', operator: 'equal', value: '' }],
        conclusions: [{ fact: '', value: '', confidence: 1 }],
        priority: 1
    });

    const handleStartEdit = (rule?: Rule) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                name: rule.name,
                description: rule.description || '',
                conditions: rule.conditions,
                conclusions: rule.conclusions.map(c => ({ ...c, confidence: c.confidence ?? 1 })),
                priority: rule.priority || 1
            });
        } else {
            setEditingRule(null);
            setFormData({
                name: '',
                description: '',
                conditions: [{ fact: '', operator: 'equal', value: '' }],
                conclusions: [{ fact: '', value: '', confidence: 1 }],
                priority: 1
            });
        }
        setIsEditing(true);
    };

    const handleSave = () => {
        const rule: Rule = {
            id: editingRule?.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: formData.name,
            description: formData.description,
            conditions: formData.conditions,
            conclusions: formData.conclusions,
            priority: formData.priority
        };

        if (editingRule) {
            onRuleEdit(rule);
        } else {
            onRuleAdd(rule);
        }

        setIsEditing(false);
        setEditingRule(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingRule(null);
    };

    const addCondition = () => {
        setFormData(prev => ({
            ...prev,
            conditions: [...prev.conditions, { fact: '', operator: 'equal', value: '' }]
        }));
    };

    const removeCondition = (index: number) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index)
        }));
    };

    const updateCondition = (index: number, field: keyof Condition, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.map((cond, i) =>
                i === index ? { ...cond, [field]: value } : cond
            )
        }));
    };

    const addConclusion = () => {
        setFormData(prev => ({
            ...prev,
            conclusions: [...prev.conclusions, { fact: '', value: '', confidence: 1 }]
        }));
    };

    const removeConclusion = (index: number) => {
        setFormData(prev => ({
            ...prev,
            conclusions: prev.conclusions.filter((_, i) => i !== index)
        }));
    };

    const updateConclusion = (index: number, field: keyof Conclusion, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            conclusions: prev.conclusions.map((concl, i) =>
                i === index ? { ...concl, [field]: value } : concl
            )
        }));
    };

    const operatorOptions = [
        { value: 'equal', label: 'igual a (=)' },
        { value: 'notEqual', label: 'diferente de (≠)' },
        { value: 'lessThan', label: 'menor que (<)' },
        { value: 'lessThanInclusive', label: 'menor ou igual (≤)' },
        { value: 'greaterThan', label: 'maior que (>)' },
        { value: 'greaterThanInclusive', label: 'maior ou igual (≥)' },
        { value: 'in', label: 'contido em' },
        { value: 'notIn', label: 'não contido em' },
        { value: 'contains', label: 'contém' },
        { value: 'doesNotContain', label: 'não contém' }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Editor de Regras</h3>
                <Button onClick={() => handleStartEdit()} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Regra
                </Button>
            </div>

            {/* Lista de regras existentes */}
            <div className="space-y-2">
                {rules.map((rule) => (
                    <div key={rule.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">{rule.name}</h4>
                                {rule.description && (
                                    <p className="text-sm text-gray-600">{rule.description}</p>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                    {rule.conditions.length} condição(ões) → {rule.conclusions.length} conclusão(ões)
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStartEdit(rule)}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onRuleDelete(rule.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor de regra */}
            {isEditing && (
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="font-medium mb-4">
                        {editingRule ? 'Editar Regra' : 'Nova Regra'}
                    </h4>

                    <div className="space-y-4">
                        {/* Nome da regra */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome da Regra</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                                placeholder="Ex: Diagnóstico de Febre"
                            />
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                                rows={2}
                                placeholder="Descrição da regra..."
                            />
                        </div>

                        {/* Prioridade */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Prioridade</label>
                            <input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                className="w-20 p-2 border rounded-md"
                                min="1"
                                max="10"
                            />
                        </div>

                        {/* Condições (SE...) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium">Condições (SE...)</label>
                                <Button variant="outline" size="sm" onClick={addCondition}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Adicionar
                                </Button>
                            </div>

                            {formData.conditions.map((condition, index) => (
                                <div key={index} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="text"
                                        value={condition.fact}
                                        onChange={(e) => updateCondition(index, 'fact', e.target.value)}
                                        placeholder="Fato/Variável"
                                        className="flex-1 p-2 border rounded-md"
                                    />
                                    <select
                                        value={condition.operator}
                                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                                        className="p-2 border rounded-md"
                                    >
                                        {operatorOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={condition.value}
                                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                        placeholder="Valor"
                                        className="flex-1 p-2 border rounded-md"
                                    />
                                    {formData.conditions.length > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeCondition(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Conclusões (ENTÃO...) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium">Conclusões (ENTÃO...)</label>
                                <Button variant="outline" size="sm" onClick={addConclusion}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Adicionar
                                </Button>
                            </div>

                            {formData.conclusions.map((conclusion, index) => (
                                <div key={index} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="text"
                                        value={conclusion.fact}
                                        onChange={(e) => updateConclusion(index, 'fact', e.target.value)}
                                        placeholder="Fato/Variável"
                                        className="flex-1 p-2 border rounded-md"
                                    />
                                    <span className="text-gray-500">=</span>
                                    <input
                                        type="text"
                                        value={conclusion.value}
                                        onChange={(e) => updateConclusion(index, 'value', e.target.value)}
                                        placeholder="Valor"
                                        className="flex-1 p-2 border rounded-md"
                                    />
                                    <input
                                        type="number"
                                        value={conclusion.confidence}
                                        onChange={(e) => updateConclusion(index, 'confidence', parseFloat(e.target.value))}
                                        placeholder="Confiança"
                                        className="w-20 p-2 border rounded-md"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                    />
                                    {formData.conclusions.length > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeConclusion(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-4">
                            <Button onClick={handleSave}>
                                {editingRule ? 'Salvar Alterações' : 'Criar Regra'}
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