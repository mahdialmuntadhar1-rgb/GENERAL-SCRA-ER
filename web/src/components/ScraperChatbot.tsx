/**
 * Chatbot interface for customizing scraper searches.
 * Allows users to interact conversationally to set search parameters.
 */

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Settings } from 'lucide-react';
import { IRAQ_GOVERNORATES, CATEGORIES, type CategoryKey } from '@/config/iraq';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestedGovernorates?: string[];
    suggestedCategories?: string[];
    maxResults?: number;
    dataQuality?: string;
  };
}

interface ChatbotConfig {
  selectedGovernorates: string[];
  selectedCategories: string[];
  maxResults: number;
  dataQuality: string;
}

interface ChatbotProps {
  onConfigChange: (config: ChatbotConfig) => void;
  initialConfig?: Partial<ChatbotConfig>;
}

export function ScraperChatbot({ onConfigChange, initialConfig = {} }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I can help you customize your scraper search. You can ask me to:\n\n• Select specific governorates (e.g., 'only Baghdad and Basra')\n• Choose categories (e.g., 'restaurants and cafes only')\n• Limit results (e.g., 'show me 10 per category')\n• Set data quality filters (e.g., 'high quality data only')\n\nWhat would you like to search for?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ChatbotConfig>({
    selectedGovernorates: initialConfig.selectedGovernorates || [],
    selectedCategories: initialConfig.selectedCategories || [],
    maxResults: initialConfig.maxResults || 50,
    dataQuality: initialConfig.dataQuality || 'all',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseUserIntent = (message: string): Partial<ChatbotConfig> => {
    const lowerMessage = message.toLowerCase();
    const config: Partial<ChatbotConfig> = {};

    // Parse governorates
    const governorateKeywords = Object.keys(IRAQ_GOVERNORATES);
    for (const gov of governorateKeywords) {
      if (lowerMessage.includes(gov.toLowerCase())) {
        config.selectedGovernorates = config.selectedGovernorates || [];
        if (!config.selectedGovernorates.includes(gov)) {
          config.selectedGovernorates.push(gov);
        }
      }
    }

    // Parse categories
    const categoryKeywords: Record<string, CategoryKey[]> = {
      'restaurant': ['dining_cuisine'],
      'food': ['dining_cuisine', 'cafe_coffee'],
      'cafe': ['cafe_coffee'],
      'coffee': ['cafe_coffee'],
      'shop': ['shopping_retail'],
      'shopping': ['shopping_retail'],
      'hotel': ['hotels_stays'],
      'health': ['health_wellness'],
      'hospital': ['health_wellness'],
      'bank': ['business_services'],
      'education': ['public_essential'],
      'school': ['public_essential'],
      'entertainment': ['events_entertainment'],
      'culture': ['culture_heritage'],
    };

    for (const [keyword, categories] of Object.entries(categoryKeywords)) {
      if (lowerMessage.includes(keyword)) {
        config.selectedCategories = config.selectedCategories || [];
        for (const cat of categories) {
          if (!config.selectedCategories.includes(cat)) {
            config.selectedCategories.push(cat);
          }
        }
      }
    }

    // Parse result limits
    const limitMatches = lowerMessage.match(/(\d+)\s*(results?|business|places?)/);
    if (limitMatches) {
      config.maxResults = parseInt(limitMatches[1]);
    }

    // Parse "per category" limits
    const perCategoryMatches = lowerMessage.match(/(\d+)\s*(per\s+category|each)/);
    if (perCategoryMatches) {
      config.maxResults = parseInt(perCategoryMatches[1]);
    }

    // Parse data quality
    if (lowerMessage.includes('high quality') || lowerMessage.includes('quality')) {
      config.dataQuality = 'real';
    } else if (lowerMessage.includes('partial') || lowerMessage.includes('some')) {
      config.dataQuality = 'partial';
    }

    return config;
  };

  const generateBotResponse = (config: Partial<ChatbotConfig>, userMessage: string): string => {
    const responses: string[] = [];
    
    if (config.selectedGovernorates && config.selectedGovernorates.length > 0) {
      responses.push(`I've selected ${config.selectedGovernorates.join(', ')} governorate${config.selectedGovernorates.length > 1 ? 's' : ''}.`);
    }

    if (config.selectedCategories && config.selectedCategories.length > 0) {
      const categoryNames = config.selectedCategories.map(cat => CATEGORIES[cat as CategoryKey]?.name || cat);
      responses.push(`I've set the categories to ${categoryNames.join(', ')}.`);
    }

    if (config.maxResults) {
      responses.push(`I'll limit results to ${config.maxResults} per category.`);
    }

    if (config.dataQuality && config.dataQuality !== 'all') {
      responses.push(`I'll filter for ${config.dataQuality} quality data.`);
    }

    if (responses.length === 0) {
      return "I didn't quite understand that. Could you try being more specific? For example: 'Show me restaurants in Baghdad' or 'Find 10 cafes with high quality data'.";
    }

    responses.push("\nWould you like me to apply these settings to your scraper?");
    return responses.join(' ');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const parsedConfig = parseUserIntent(inputValue);
    const botResponse = generateBotResponse(parsedConfig, inputValue);

    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: botResponse,
      timestamp: new Date(),
      metadata: {
        suggestedGovernorates: parsedConfig.selectedGovernorates,
        suggestedCategories: parsedConfig.selectedCategories,
        maxResults: parsedConfig.maxResults,
        dataQuality: parsedConfig.dataQuality,
      },
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const applySuggestedConfig = (message: ChatMessage) => {
    if (!message.metadata) return;

    const newConfig: ChatbotConfig = {
      ...currentConfig,
      selectedGovernorates: message.metadata.suggestedGovernorates || currentConfig.selectedGovernorates,
      selectedCategories: message.metadata.suggestedCategories || currentConfig.selectedCategories,
      maxResults: message.metadata.maxResults || currentConfig.maxResults,
      dataQuality: message.metadata.dataQuality || currentConfig.dataQuality,
    };

    setCurrentConfig(newConfig);
    onConfigChange(newConfig);
    toast.success('Search configuration applied!');
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: "Chat cleared! How can I help you configure your scraper search?",
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <Card className="w-full max-w-2xl h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Scraper Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              Clear
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    {message.metadata && message.type === 'bot' && (
                      <div className="mt-2 space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySuggestedConfig(message)}
                          className="text-xs"
                        >
                          Apply These Settings
                        </Button>
                        <div className="flex flex-wrap gap-1">
                          {message.metadata.suggestedGovernorates?.map(gov => (
                            <Badge key={gov} variant="secondary" className="text-xs">
                              {gov}
                            </Badge>
                          ))}
                          {message.metadata.suggestedCategories?.map(cat => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {CATEGORIES[cat as CategoryKey]?.name || cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me to configure your search..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
