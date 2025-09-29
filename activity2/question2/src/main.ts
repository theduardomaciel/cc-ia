import './style.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Inicialização da aplicação React
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando Sistema Especialista com React...');

  try {
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('Could not find app container');
    }

    const root = createRoot(container);
    root.render(React.createElement(App));

    console.log('✅ Sistema Especialista inicializado com sucesso!');
    console.log('📚 Recursos disponíveis:');
    console.log('   - Base de Conhecimento com regras SE...ENTÃO');
    console.log('   - Motor de Inferência (Forward & Backward Chaining)');
    console.log('   - Sistema de Explicação (Por quê? Como?)');
    console.log('   - Interface em Linguagem Natural');
    console.log('   - Interface React moderna');
  } catch (error) {
    console.error('❌ Erro ao inicializar:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h1>Erro ao carregar o sistema</h1>
        <p>${error}</p>
      </div>
    `;
  }
});

// Logs de desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔧 Modo de desenvolvimento ativo');
  console.log('📦 Dependências carregadas:');
  console.log('   - React 19');
  console.log('   - TypeScript');
  console.log('   - Vite');
  console.log('   - Tailwind CSS 4');
  console.log('   - json-rules-engine');
}
