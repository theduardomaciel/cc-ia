import './style.css';
import { UIController } from './modules/UIController';

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando Sistema Especialista...');

  try {
    // Cria e inicializa o controlador principal
    const uiController = new UIController();
    uiController.initialize();

    // Torna o controlador disponível globalmente para event handlers
    (window as any).uiController = uiController;

    console.log('✅ Sistema Especialista inicializado com sucesso!');
    console.log('📚 Recursos disponíveis:');
    console.log('   - Base de Conhecimento com regras SE...ENTÃO');
    console.log('   - Motor de Inferência (Forward & Backward Chaining)');
    console.log('   - Sistema de Explicação (Por quê? Como?)');
    console.log('   - Interface de Linguagem Natural');
    console.log('   - Integração com json-rules-engine');

  } catch (error) {
    console.error('❌ Erro ao inicializar o sistema:', error);

    // Mostra erro na interface
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="min-h-screen bg-red-50 flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <div class="text-red-600 text-center">
              <h1 class="text-2xl font-bold mb-4">❌ Erro na Inicialização</h1>
              <p class="mb-4">Ocorreu um erro ao inicializar o sistema especialista:</p>
              <pre class="bg-gray-100 p-3 rounded text-sm text-left overflow-auto">${error}</pre>
              <button 
                onclick="location.reload()" 
                class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                🔄 Recarregar Página
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }
});

// Logs de desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔧 Modo de desenvolvimento ativo');
  console.log('📦 Dependências carregadas:');
  console.log('   - TypeScript');
  console.log('   - Vite');
  console.log('   - Tailwind CSS');
  console.log('   - json-rules-engine');
}

// Função auxiliar para debugging
(window as any).debugSystem = () => {
  const controller = (window as any).uiController as UIController;
  if (!controller) {
    console.log('❌ Controlador não inicializado');
    return;
  }

  console.log('🔍 Estado atual do sistema:');
  console.log('   - Controlador:', controller);

  // Adiciona mais informações de debug conforme necessário
  return {
    controller,
    // Adicione outros objetos úteis para debug
  };
};
