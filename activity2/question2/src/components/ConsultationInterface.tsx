import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, Bot, User, HelpCircle } from 'lucide-react';
import { NaturalLanguageProcessor } from '@/lib/natural-language-processor';

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ConsultationInterfaceProps {
    nlProcessor: NaturalLanguageProcessor;
}

export const ConsultationInterface: React.FC<ConsultationInterfaceProps> = ({
    nlProcessor
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            type: 'assistant',
            content: 'Olá! Sou um sistema especialista baseado em conhecimento. Como posso ajudá-lo?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isProcessing) return;

        const userMessage: Message = {
            id: `user_${Date.now()}`,
            type: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsProcessing(true);

        try {
            const response = await nlProcessor.processInput(userMessage.content);

            const assistantMessage: Message = {
                id: `assistant_${Date.now()}`,
                type: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);

            const errorMessage: Message = {
                id: `error_${Date.now()}`,
                type: 'assistant',
                content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleQuickAction = (action: string) => {
        setInput(action);
    };

    const formatTimestamp = (date: Date): string => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const quickActions = [
        'ajuda',
        'Qual é o diagnóstico?',
        'Por que?',
        'Como?',
        'temperatura = alta'
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Sistema de Consulta</h3>
                    <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400' : 'bg-green-400'}`} />
                            {isProcessing ? 'Processando...' : 'Online'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.type === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-blue-600" />
                            </div>
                        )}

                        <div
                            className={`max-w-[70%] p-3 rounded-lg ${message.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div
                                className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                    }`}
                            >
                                {formatTimestamp(message.timestamp)}
                            </div>
                        </div>

                        {message.type === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-sm text-gray-500">Processando...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t bg-gray-50">
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Ações rápidas:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAction(action)}
                                className="text-xs"
                            >
                                {action}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua pergunta ou declaração..."
                        className="flex-1 p-3 border rounded-lg resize-none"
                        rows={1}
                        disabled={isProcessing}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isProcessing}
                        className="px-4"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    Pressione Enter para enviar ou Shift+Enter para nova linha
                </div>
            </div>
        </div>
    );
};