import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RuleEditor } from "@/components/RuleEditor";
import { FactEditor } from "@/components/FactEditor";
import { ConsultationInterface } from "@/components/ConsultationInterface";
import { InferenceTrace } from "@/components/InferenceTrace";
import {
  Brain,
  Database,
  MessageCircle,
  Activity,
  Settings,
  Download,
  Upload,
  FileText,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { SessionManager } from '@/lib/session-manager';
import { InferenceEngine } from '@/lib/inference-engine';
import { NaturalLanguageProcessor } from '@/lib/natural-language-processor';
import type { Rule, Fact, InferenceStep, KnowledgeBase } from '@/types';

type Tab = 'knowledge' | 'consultation' | 'trace' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('knowledge');
  const [sessionManager] = useState(() => new SessionManager());
  const [inferenceEngine, setInferenceEngine] = useState<InferenceEngine | null>(null);
  const [nlProcessor, setNlProcessor] = useState<NaturalLanguageProcessor | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [currentTrace, setCurrentTrace] = useState<InferenceStep[]>([]);

  // Inicializar sessão
  useEffect(() => {
    const loadExampleKnowledgeBase = () => {
      // Exemplo: Sistema de diagnóstico médico simples
      const exampleFacts: Fact[] = [
        {
          id: 'fact1',
          name: 'idade',
          value: '25',
          confidence: 1
        }
      ];

      const exampleRules: Rule[] = [
        {
          id: 'rule1',
          name: 'Diagnóstico de Gripe',
          description: 'Se o paciente tem febre e dor de cabeça, então pode ter gripe',
          conditions: [
            { fact: 'temperatura', operator: 'equal', value: 'alta' },
            { fact: 'sintoma', operator: 'equal', value: 'dor de cabeça' }
          ],
          conclusions: [
            { fact: 'diagnóstico', value: 'gripe', confidence: 0.8 }
          ],
          priority: 1
        },
        {
          id: 'rule2',
          name: 'Diagnóstico de Resfriado',
          description: 'Se o paciente tem tosse e não tem febre, então pode ter resfriado',
          conditions: [
            { fact: 'sintoma', operator: 'equal', value: 'tosse' },
            { fact: 'temperatura', operator: 'equal', value: 'normal' }
          ],
          conclusions: [
            { fact: 'diagnóstico', value: 'resfriado', confidence: 0.7 }
          ],
          priority: 1
        },
        {
          id: 'rule3',
          name: 'Recomendação de Repouso',
          description: 'Se o diagnóstico é gripe, então recomenda repouso',
          conditions: [
            { fact: 'diagnóstico', operator: 'equal', value: 'gripe' }
          ],
          conclusions: [
            { fact: 'tratamento', value: 'repouso e hidratação', confidence: 0.9 }
          ],
          priority: 2
        }
      ];

      setFacts(exampleFacts);
      setRules(exampleRules);

      const knowledgeBase: KnowledgeBase = {
        facts: exampleFacts,
        rules: exampleRules
      };

      sessionManager.updateKnowledgeBase(knowledgeBase);
    };

    const sessionId = sessionManager.createSession({
      facts: [],
      rules: []
    });
    console.log('Sessão criada:', sessionId);

    // Carregar exemplos iniciais
    loadExampleKnowledgeBase();
  }, [sessionManager]);

  // Atualizar motor de inferência quando regras/fatos mudarem
  useEffect(() => {
    const engine = sessionManager.getInferenceEngine();
    if (engine) {
      setInferenceEngine(engine);
      setNlProcessor(new NaturalLanguageProcessor(engine));
    }
  }, [rules, facts, sessionManager]);

  const handleRuleAdd = (rule: Rule) => {
    const newRules = [...rules, rule];
    setRules(newRules);
    updateKnowledgeBase(newRules, facts);
  };

  const handleRuleEdit = (rule: Rule) => {
    const newRules = rules.map(r => r.id === rule.id ? rule : r);
    setRules(newRules);
    updateKnowledgeBase(newRules, facts);
  };

  const handleRuleDelete = (ruleId: string) => {
    const newRules = rules.filter(r => r.id !== ruleId);
    setRules(newRules);
    updateKnowledgeBase(newRules, facts);
  };

  const handleFactAdd = (fact: Fact) => {
    const newFacts = [...facts, fact];
    setFacts(newFacts);
    updateKnowledgeBase(rules, newFacts);
  };

  const handleFactEdit = (fact: Fact) => {
    const newFacts = facts.map(f => f.id === fact.id ? fact : f);
    setFacts(newFacts);
    updateKnowledgeBase(rules, newFacts);
  };

  const handleFactDelete = (factId: string) => {
    const newFacts = facts.filter(f => f.id !== factId);
    setFacts(newFacts);
    updateKnowledgeBase(rules, newFacts);
  };

  const updateKnowledgeBase = (newRules: Rule[], newFacts: Fact[]) => {
    const knowledgeBase: KnowledgeBase = {
      rules: newRules,
      facts: newFacts
    };
    sessionManager.updateKnowledgeBase(knowledgeBase);
  };

  const runForwardInference = async () => {
    if (!inferenceEngine) return;

    const trace = await inferenceEngine.forwardChaining();
    setCurrentTrace(trace);
    setActiveTab('trace');
  };

  const runBackwardInference = async () => {
    if (!inferenceEngine) return;

    const goal = prompt('Digite o objetivo da inferência:');
    if (!goal) return;

    const result = await inferenceEngine.backwardChaining(goal);
    setCurrentTrace(result.trace);
    setActiveTab('trace');

    if (result.success) {
      alert(`Objetivo "${goal}" alcançado com sucesso!`);
    } else {
      alert(`Não foi possível alcançar o objetivo "${goal}".`);
    }
  };

  const exportKnowledgeBase = () => {
    const data = sessionManager.exportSession();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-base-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importKnowledgeBase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const sessionId = sessionManager.importSession(content);
        if (sessionId) {
          const session = sessionManager.getCurrentSession();
          if (session) {
            setRules(session.knowledgeBase.rules);
            setFacts(session.knowledgeBase.facts);
            alert('Base de conhecimento importada com sucesso!');
          }
        } else {
          alert('Erro ao importar base de conhecimento.');
        }
      } catch {
        alert('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  };

  const clearKnowledgeBase = () => {
    if (confirm('Tem certeza que deseja limpar toda a base de conhecimento?')) {
      setRules([]);
      setFacts([]);
      setCurrentTrace([]);
      updateKnowledgeBase([], []);
    }
  };

  const tabs = [
    { id: 'knowledge' as const, label: 'Base de Conhecimento', icon: Database },
    { id: 'consultation' as const, label: 'Consulta', icon: MessageCircle },
    { id: 'trace' as const, label: 'Trace de Inferência', icon: Activity },
    { id: 'settings' as const, label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold">Sistema Especialista</h1>
              <p className="text-xs text-gray-500">Agente Baseado em Conhecimento</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="mt-8 space-y-2">
            <Button
              onClick={runForwardInference}
              className="w-full"
              size="sm"
              disabled={!inferenceEngine}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Inferência ↗
            </Button>

            <Button
              onClick={runBackwardInference}
              variant="outline"
              className="w-full"
              size="sm"
              disabled={!inferenceEngine}
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Inferência ↙
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'knowledge' && 'Gerencie regras e fatos da base de conhecimento'}
                {activeTab === 'consultation' && 'Faça consultas em linguagem natural'}
                {activeTab === 'trace' && 'Visualize o raciocínio do sistema'}
                {activeTab === 'settings' && 'Configure o sistema e gerencie dados'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {rules.length} regras, {facts.length} fatos
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'knowledge' && (
            <div className="p-6 space-y-8">
              <RuleEditor
                rules={rules}
                onRuleAdd={handleRuleAdd}
                onRuleEdit={handleRuleEdit}
                onRuleDelete={handleRuleDelete}
              />
              <FactEditor
                facts={facts}
                onFactAdd={handleFactAdd}
                onFactEdit={handleFactEdit}
                onFactDelete={handleFactDelete}
              />
            </div>
          )}

          {activeTab === 'consultation' && nlProcessor && (
            <ConsultationInterface nlProcessor={nlProcessor} />
          )}

          {activeTab === 'trace' && (
            <InferenceTrace trace={currentTrace} />
          )}

          {activeTab === 'settings' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Gerenciamento de Dados</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button onClick={exportKnowledgeBase}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Base de Conhecimento
                    </Button>

                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importKnowledgeBase}
                        className="hidden"
                        id="import-file"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('import-file')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Importar Base de Conhecimento
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={clearKnowledgeBase}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Limpar Base de Conhecimento
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Sobre o Sistema</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    Este é um sistema especialista baseado em conhecimento implementado para a
                    disciplina de Inteligência Artificial. O sistema inclui:
                  </p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    <li>Editor de base de conhecimento (regras SE-ENTÃO e fatos)</li>
                    <li>Motor de inferência com encadeamento para frente e para trás</li>
                    <li>Sistema de explanação (Por quê? e Como?)</li>
                    <li>Interface de diálogo em linguagem natural</li>
                    <li>Visualização do trace de inferência</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;