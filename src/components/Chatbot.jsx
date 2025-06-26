'use client';
import { useState } from 'react';
import { Send, Bot, User, MessageCircle, AlertCircle, BookOpen } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setError('');

    // Add a placeholder message for streaming response
    const botMessageId = Date.now();
    const botMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true
    };
    setMessages(prev => [...prev, botMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentInput }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          try {
            const errorText = await response.text();
            if (errorText) {
              try {
                const parsed = JSON.parse(errorText);
                errorMessage = parsed.error || errorText;
              } catch {
                errorMessage = errorText;
              }
            }
          } catch {
            // ignore
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is streamed
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/stream')) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  break;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullResponse += parsed.content;
                    // Update the streaming message
                    setMessages(prev => prev.map(msg => 
                      msg.id === botMessageId 
                        ? { ...msg, content: fullResponse }
                        : msg
                    ));
                  }
                } catch (parseError) {
                  // Handle non-JSON chunks
                  if (data.trim()) {
                    fullResponse += data;
                    setMessages(prev => prev.map(msg => 
                      msg.id === botMessageId 
                        ? { ...msg, content: fullResponse }
                        : msg
                    ));
                  }
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          // Mark streaming as complete
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          ));
        }
      } else {
        // Handle regular JSON response (fallback)
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        const responseContent = data.answer || "Je n'ai pas pu trouver une réponse appropriée à votre question.";
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: responseContent, isStreaming: false }
            : msg
        ));
      }
    } catch (error) {
      // Remove the placeholder message and add error message
      setMessages(prev => prev.filter(msg => msg.id !== botMessageId));

      let errorMsg = '';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMsg = error.error || error.message || JSON.stringify(error);
      } else {
        errorMsg = 'Une erreur inconnue est survenue.';
      }
      setError(errorMsg);

      const errorMessage = {
        role: 'assistant',
        content: `Désolé, une erreur s'est produite: ${errorMsg}. Veuillez réessayer.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question) => {
    setInput(question);
    setError('');
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  const sampleQuestions = [
    "Quel score dois-je avoir pour intégrer l'INSAT?",
    "Comment calculer ma moyenne du Bac?",
    "Quelles sont les spécialités disponibles en ingénierie?",
    "Comment choisir mon orientation post-bac?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                  Guide El Bac
                </h1>
                <p className="text-slate-400 text-sm">Assistant intelligent pour l'orientation post-bac</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
              >
                Nouvelle conversation
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar with sample questions */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 h-fit">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
                Questions fréquentes
              </h3>
              <div className="space-y-3">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="w-full text-left p-3 text-sm text-slate-300 hover:text-white bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all duration-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-3 bg-slate-700/20 rounded-lg text-xs text-slate-400">
                  <div>Environment: {process.env.NODE_ENV}</div>
                  <div>API URL: /api/chat</div>
                </div>
              )}
            </div>
          </div>
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl h-[600px] flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 mt-20">
                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Bot className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-3 text-white">Bienvenue sur Guide El Bac!</h2>
                    <p className="text-lg mb-2">Votre assistant intelligent pour l'orientation post-bac</p>
                    <p className="text-sm max-w-md mx-auto">
                      Posez-moi des questions sur les scores du Bac, l'orientation universitaire,
                      les spécialités disponibles et bien plus encore.
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[75%] px-6 py-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-lg'
                          : 'bg-slate-700/50 text-slate-100 border border-slate-600/50 shadow-sm'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse"></span>
                          )}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600/50 px-6 py-4 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-slate-400 text-sm ml-2">Guide El Bac réfléchit...</span>
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 px-6 py-4 rounded-2xl">
                      <p className="text-red-300 text-sm">
                        Erreur: {error}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Input Area */}
              <div className="border-t border-slate-700 p-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Posez votre question sur l'orientation, les scores du Bac, les universités..."
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all duration-200"
                      rows={1}
                      style={{minHeight: '48px', maxHeight: '120px'}}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">
                      {isLoading ? 'Envoi...' : 'Envoyer'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}