import React from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatTabProps {
    onProcessNaturalLanguage: (input: string) => Promise<string>;
}

export const ChatTab: React.FC<ChatTabProps> = ({ onProcessNaturalLanguage }) => {
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: '👋 Olá! Sou o assistente do sistema especialista. Você pode fazer perguntas em português sobre regras, fatos ou inferências. Por exemplo:\n\n• "Quais são os fatos na base de conhecimento?"\n• "Execute uma inferência forward chaining"\n• "Por que alguém é maior de idade?"\n• "Como obter desconto premium?"',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await onProcessNaturalLanguage(input.trim());

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Erro ao processar sua solicitação: ${error}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                id: '1',
                role: 'assistant',
                content: '👋 Chat limpo! Como posso ajudá-lo com o sistema especialista?',
                timestamp: new Date()
            }
        ]);
    };

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const LoadingDots = () => (
        <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
    );

    const suggestedQuestions = [
        "Quais fatos estão na base de conhecimento?",
        "Execute uma inferência forward chaining",
        "Por que idade > 18?",
        "Como obter desconto_premium?"
    ];

    return (
        <div className="flex flex-col h-full max-h-[80vh]">

            {/* Header */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold">💬 Interface Natural</h2>
                        <p className="text-sm text-gray-600">
                            Converse em português com o sistema especialista
                        </p>
                    </div>
                    <button
                        onClick={clearChat}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        🗑️ Limpar Chat
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 bg-white rounded-lg shadow p-4 mb-4 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                            >
                                <div className="whitespace-pre-wrap text-sm">
                                    {message.content}
                                </div>
                                <div
                                    className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}
                                >
                                    {formatTimestamp(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                                <LoadingDots />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Suggested Questions */}
            {messages.length <= 1 && !loading && (
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">💡 Perguntas sugeridas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestedQuestions.map((question, index) => (
                            <button
                                key={index}
                                onClick={() => setInput(question)}
                                className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Form */}
            <div className="bg-white rounded-lg shadow p-4">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta em português..."
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '⏳' : '📤'}
                    </button>
                </form>
            </div>
        </div>
    );
};