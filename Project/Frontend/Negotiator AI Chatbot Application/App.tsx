import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { Send, User, Bot, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import { negotiateAPI, NegotiationRequest } from '../../src/services/api';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ProductInfo {
  name: string;
  userPrice: number;
  tone: string;
  negotiationData?: any;
}

// SAFELY create unique IDs for messages
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'initial' | 'product' | 'price' | 'tone' | 'negotiating' | 'email'>('initial');
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingId, setTypingId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- API CALLS ---
  const fetchNegotiationData = async (productName: string, currentPrice: number, tone: string) => {
    try {
      const request: NegotiationRequest = { productName, currentPrice, tone };
      return await negotiateAPI.generateMessage(request);
    } catch (error) {
      throw error;
    }
  };

  const sendEmail = async (content: string, userEmail: string) => {
    try {
      await negotiateAPI.sendMessage(content, 'email', userEmail);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // --- MESSAGE MANAGEMENT ---
  const addMessage = (content: string, type: 'user' | 'bot' | 'system', isTyping = false): string => {
    const msg: Message = { id: uniqueId(), type, content, timestamp: new Date(), isTyping };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  };

  const updateMessage = (id: string, content: string, isTyping = false) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content, isTyping } : msg))
    );
  };

  // --- MAIN FLOW ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const userInput = inputValue.trim();
    setInputValue('');
    addMessage(userInput, 'user');
    setIsLoading(true);


    let typingMsgId = typingId;
    if (!typingMsgId || currentStep === 'initial' || currentStep === 'product' || currentStep === 'price' || currentStep === 'tone') {
      typingMsgId = addMessage('...', 'bot', true);
      setTypingId(typingMsgId);
    }

    const finishTyping = (content: string) => {
      if (typingMsgId) updateMessage(typingMsgId, content, false);
      setIsLoading(false);
    };

    try {
      // --- Greeting ---
      if (currentStep === 'initial') {
        await new Promise((res) => setTimeout(res, 500));
        finishTyping("Hello! I'm your AI negotiation assistant. I'll help you get the best price using real market data. What product are you looking to buy?");
        setCurrentStep('product');
        return;
      }

      // --- Product Name ---
      if (currentStep === 'product') {
        await new Promise((res) => setTimeout(res, 400));
        finishTyping(`Great! I'll help you negotiate the best price for "${userInput}". What's the current asking price for this product?`);
        setProductInfo({ name: userInput, userPrice: 0, tone: 'polite' });
        setCurrentStep('price');
        return;
      }

      // --- Price Entry ---
      if (currentStep === 'price') {
        const price = parseFloat(userInput.replace(/[^0-9.]/g, ''));
        if (isNaN(price)) {
          finishTyping("Please enter a valid price amount (e.g., $150 or 150)");
          return;
        }
        setProductInfo((prev) => ({
          name: prev?.name || '',
          userPrice: price,
          tone: prev?.tone || 'polite'
        }));
        finishTyping("Which tone would you like for your negotiation message? (Polite, Friendly, Assertive)");
        setCurrentStep('tone');
        return;
      }

      // --- Tone Selection ---
      if (currentStep === 'tone') {
        const tone = userInput.toLowerCase();
        const validTones = ['polite', 'friendly', 'assertive'];
        if (!validTones.includes(tone)) {
          finishTyping("Please select one of these tones: Polite, Friendly, or Assertive.");
          return;
        }
        setProductInfo((prev) => ({
          name: prev?.name || '',
          userPrice: prev?.userPrice || 0,
          tone
        }));
        finishTyping(`Great! I'll use a ${tone} tone. Let me analyze the market and generate your negotiation message...`);
        setCurrentStep('negotiating');
        return;
      }

      // --- Negotiation Market Analysis ---
      if (currentStep === 'negotiating') {
        if (!productInfo?.name || !productInfo.userPrice || !productInfo.tone) {
          finishTyping("Sorry, some negotiation details are missing. Please start over.");
          setCurrentStep('initial');
          setProductInfo(null);
          return;
        }
        updateMessage(typingMsgId!, 'Analyzing... Please wait.', true);
        const negotiationData = await fetchNegotiationData(productInfo.name, productInfo.userPrice, productInfo.tone);

        const analysisMessage = `🎯 Real Market Analysis Complete!

Product: ${productInfo.name}
Listed Price: $${productInfo.userPrice}
AI Suggested Price: $${negotiationData.suggestedPrice}
Potential Savings: $${(productInfo.userPrice - negotiationData.suggestedPrice).toFixed(2)}

📊 Competitor Data Found:
${negotiationData.competitorPrices.map((comp: any, index: number) => `${index + 1}. ${comp.title.substring(0, 60)}... - $${comp.price}`).join('\n')}

🤖 AI-Generated Negotiation Message:
"${negotiationData.message}"

Would you like me to send this negotiation message to your email? Just provide your email address!`;

        updateMessage(typingMsgId!, analysisMessage, false);
        setProductInfo((prev) => prev ? { ...prev, negotiationData } : null);
        setCurrentStep('email');
        return;
      }

      // --- Handle Email / Next cycles ---
      if (currentStep === 'email') {
      if (userInput.includes('@')) {
        const emailTypingId = addMessage('...', 'bot', true);

        try {
          const emailContent = productInfo?.negotiationData?.message || "Negotiation message not available";
          await sendEmail(emailContent, userInput);

          updateMessage(emailTypingId, `🎉 Email sent successfully to ${userInput}! Your AI-generated negotiation message has been delivered including market data, competitor price analysis, and strategy.`);
          toast("Email sent successfully!", { description: `Negotiation strategy sent to ${userInput}` });

          setTimeout(() => {
            setCurrentStep('initial');
            setProductInfo(null);
          }, 3000);
        } catch (error) {
          updateMessage(emailTypingId, "Sorry, I couldn't send the email. Please check your backend and try again.");
        }
      } else if (userInput.toLowerCase().includes('new') || userInput.toLowerCase().includes('start')) {
        setCurrentStep('initial');
        setProductInfo(null);
        updateMessage(typingId, "Great! What would you like to negotiate for next?");
      } else {
        updateMessage(typingId, "Please provide your email address or say 'new' to start a new negotiation.", false);
      }
      setIsLoading(false);
      return;
    }

  } catch (error) {
    updateMessage(typingId, "Sorry, an error occurred. Please check your backend and try again.");
    setIsLoading(false);
    return;
  }
};


  // Initial welcome
  useEffect(() => {
    if (messages.length === 0) {
      addMessage("Welcome to AI Negotiator! I'm powered by real market data and AI. What would you like to negotiate for today?", 'bot');
    }
  }, []);

  return (
    <div className="bg-[#fbfbff] min-h-screen flex flex-col" data-name="Negotiator AI Chat">
      {/* Header */}
      <div className="border-b border-[#e3e3e3] px-[50px] py-[17px]">
        <div className="flex items-center justify-between max-w-[1295px] mx-auto">
          <div className="font-semibold text-[#616161] text-[20px]">
            AI Chatbot
          </div>
          <div className="font-normal text-[#616161] text-[40px] md:text-[57px]">
            NEGOTIATOR
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-[#c6c6c6] py-16">
              <Bot className="mx-auto mb-4 size-12" />
              <p className="text-xl mb-2">Welcome to AI Negotiator!</p>
              <p>I'll help you analyze market prices and create winning negotiation strategies using real data.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-[#1938b4]' : 'bg-gray-200'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="size-4 text-white" />
                    ) : message.type === 'system' ? (
                      <TrendingUp className="size-4 text-green-600" />
                    ) : (
                      <Bot className="size-4 text-gray-600" />
                    )}
                  </div>
                  <Card className={`p-4 ${
                    message.type === 'user' 
                      ? 'bg-[#1938b4] text-white' 
                      : message.isTyping 
                        ? 'bg-[#f4f5ff]' 
                        : 'bg-white'
                  } border border-[#e3e3e3] rounded-xl`}>
                    <p className="whitespace-pre-wrap text-[16px] leading-relaxed">
                      {message.isTyping ? (
                        <span className="inline-flex space-x-1">
                          <span className="animate-bounce">•</span>
                          <span className="animate-bounce delay-100">•</span>
                          <span className="animate-bounce delay-200">•</span>
                        </span>
                      ) : (
                        message.content
                      )}
                    </p>
                  </Card>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#e3e3e3] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 bg-[#fbfbff] border border-[#e3e3e3] rounded-xl">
            <form onSubmit={handleSubmit} className="flex items-center gap-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  currentStep === 'initial' ? 'What would you like to negotiate for?' :
                  currentStep === 'product' ? 'Enter the product name...' :
                  currentStep === 'price' ? 'Enter the current asking price...' :
                  currentStep === 'tone' ? 'Polite, Friendly, or Assertive?' :
                  currentStep === 'email' ? 'Enter your email address...' :
                  'Type your message...'
                }
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent text-[#616161] placeholder:text-[#c6c6c6] focus-visible:ring-0 text-[18px]"
              />
              <div className="flex items-center gap-2">
                <div className="w-px h-12 bg-[#dadada]" />
                <Button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-[#1938b4] hover:bg-[#1938b4]/90 text-white size-12 rounded-xl p-0"
                >
                  <Send className="size-5" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
