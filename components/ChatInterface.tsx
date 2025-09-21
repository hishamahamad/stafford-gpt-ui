import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, FileText, MessageCircle, Shield, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: {
    document: string;
    chunk: string;
    relevanceScore: number;
    isInternal?: boolean;
  }[];
  isTyping?: boolean;
}

type ChatMode = 'customer' | 'internal';

export function ChatInterface() {
  const [activeMode, setActiveMode] = useState<ChatMode>('customer');
  const [customerMessages, setCustomerMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Hello! I\'m your virtual education consultant. I can help you find information about our affiliated universities, courses, and programs. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to internal mode! I have access to all company documents including sales reports, marketing data, and other related information. What would you like to know?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Session management for API calls
  const [customerSessionId, setCustomerSessionId] = useState<string | null>(null);
  const [internalSessionId, setInternalSessionId] = useState<string | null>(null);

  // Ref for the messages container to enable auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeMode === 'customer' ? customerMessages : internalMessages;
  const setMessages = activeMode === 'customer' ? setCustomerMessages : setInternalMessages;
  const sessionId = activeMode === 'customer' ? customerSessionId : internalSessionId;
  const setSessionId = activeMode === 'customer' ? setCustomerSessionId : setInternalSessionId;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // API call to the real chat service
  const sendMessageToAPI = async (query: string, namespace: string, sessionId: string | null) => {
    try {
      const requestBody: any = {
        query: query,
        namespace: namespace
      };

      // Only include session_id if we have one
      if (sessionId) {
        requestBody.session_id = sessionId;
      }

      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        answer: data.answer,
        session_id: data.session_id
      };
    } catch (error) {
      console.error('Error calling chat API:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const currentQuery = inputValue;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Call the real API
      const result = await sendMessageToAPI(currentQuery, activeMode, sessionId);

      // Update session ID if we got a new one
      if (result.session_id && result.session_id !== sessionId) {
        setSessionId(result.session_id);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.answer,
        timestamp: new Date(),
      };

      setMessages(prev => prev.filter(m => m.id !== 'typing').concat(assistantMessage));
    } catch (error) {
      // Handle API errors
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again or check if the API service is running.',
        timestamp: new Date(),
      };

      setMessages(prev => prev.filter(m => m.id !== 'typing').concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: activeMode === 'customer'
        ? 'Chat cleared. How can I help you with our products and services today?'
        : 'Chat cleared. What internal information would you like to access?',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const getQuickQueries = (mode: ChatMode) => {
    if (mode === 'customer') {
      return [
        "What online degree programs do you offer?",
        "How do I apply for an MBA program?",
        "What are the admission requirements?"
      ];
    } else {
      return [
        "Show me student enrollment statistics",
        "What are our most popular degree programs?",
        "How is student satisfaction trending?"
      ];
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-4 h-[calc(100vh-12rem)]">
      {/* Chat Sidebar */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selector */}
            <div className="space-y-3">
              <h4 className="text-sm">Mode</h4>
              <Tabs value={activeMode} onValueChange={(value: string) => setActiveMode(value as ChatMode)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="customer" className="flex items-center gap-1 text-xs">
                    <Globe className="h-3 w-3" />
                    Customer
                  </TabsTrigger>
                  <TabsTrigger value="internal" className="flex items-center gap-1 text-xs">
                    <Shield className="h-3 w-3" />
                    Internal
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="text-xs text-muted-foreground">
                {activeMode === 'customer' ? (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Public website content only
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    All company data
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-sm">Quick Questions</h4>
              <div className="space-y-2">
                {getQuickQueries(activeMode).map((query, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 text-xs bg-muted/50 hover:bg-muted rounded-md transition-colors cursor-pointer border-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setInputValue(query)}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  {activeMode === 'customer' ? (
                    <Globe className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Shield className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                Stafford Assistant - {activeMode === 'customer' ? 'Customer Mode' : 'Internal Mode'}
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearChat}
                  variant="outline"
                  size="sm"
                  disabled={messages.length <= 1}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
                <Badge variant={activeMode === 'customer' ? 'secondary' : 'default'} className="text-xs">
                  {activeMode === 'customer' ? (
                    <><Globe className="h-3 w-3 mr-1" />Public</>
                  ) : (
                    <><Shield className="h-3 w-3 mr-1" />Internal</>
                  )}
                </Badge>
                <Badge variant="secondary">
                  {messages.filter(m => m.type === 'user').length} queries
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-20rem)] px-6">
                <div className="space-y-4 py-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] space-y-2 ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-lg px-4 py-3 text-sm ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : message.type === 'system'
                              ? 'bg-muted text-muted-foreground text-xs py-2'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.isTyping ? (
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-2">
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Sources ({message.sources.length})
                            </Badge>
                            {message.sources.map((source, index) => (
                              <div key={index} className="text-xs bg-muted/50 p-3 rounded border text-muted-foreground">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{source.document}</span>
                                    {source.isInternal && (
                                      <Badge variant="destructive" className="text-xs">
                                        <Shield className="h-2 w-2 mr-1" />
                                        Internal
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(source.relevanceScore * 100)}% match
                                  </Badge>
                                </div>
                                <p>{source.chunk}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={`text-xs text-muted-foreground ${
                          message.type === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Input Area */}
            <div className="p-6 bg-background">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    activeMode === 'customer'
                      ? "Ask about our products and services..."
                      : "Ask about internal company data..."
                  }
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
