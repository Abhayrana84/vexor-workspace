'use client';

import { useState, useRef, useEffect } from 'react';
import { apiRequest, getStoredUser } from '../../../lib/api';
import { Sparkles, Send, Bot, User } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'Which project is losing money?',
  'Which employee is overloaded?',
  'Which client may leave?',
  'Predict next month\'s revenue',
  'Suggest hiring needs',
  'Recommend upsell opportunities',
  'Summarize today\'s business activity',
  'Suggest cost-saving measures',
];


export default function AICopilot() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Hello! I am the **Vexor AI Copilot**, your real-time business intelligence agent. Ask me about project delays, team workloads, or request proposal draft templates.',
    },
  ]);
  const [user, setUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt: text }),
      });

      const assistantMessage = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error communicating with AI: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (text: string) => {
    // A simple, secure markdown renderer helper for bullet points, bold and headers
    return text.split('\n').map((line, idx) => {
      let content = line;
      let isHeader = false;
      let headerClass = '';
      
      // Parse Headers
      if (content.startsWith('### ')) {
        content = content.replace('### ', '');
        isHeader = true;
        headerClass = 'text-sm font-bold text-primary mt-3 mb-1';
      } else if (content.startsWith('#### ')) {
        content = content.replace('#### ', '');
        isHeader = true;
        headerClass = 'text-xs font-semibold text-muted-foreground mt-2 mb-1';
      }

      // Parse bullet points
      const isBullet = content.startsWith('- ') || content.startsWith('* ');
      if (isBullet) {
        content = content.substring(2);
      }

      // Parse Bold text: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-foreground">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const elements = parts.length > 0 ? parts : content;

      if (isHeader) {
        return <div key={idx} className={headerClass}>{elements}</div>;
      }

      if (isBullet) {
        return (
          <li key={idx} className="list-disc list-inside ml-2 py-0.5 text-muted-foreground">
            {elements}
          </li>
        );
      }

      return <p key={idx} className="min-h-[1em] py-0.5 leading-relaxed">{elements}</p>;
    });
  };

  return (
    <div className="space-y-8 flex flex-col h-[78vh] justify-between">
      {/* Header */}
      <div className="shrink-0">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-purple-500" />
          AI Business Agent
        </h2>
        <p className="text-sm text-muted-foreground">Review operational health scores and auto-generate client proposal agreements.</p>
      </div>

      {/* Message Stream */}
      <div className="flex-1 border border-border rounded-2xl bg-card/45 backdrop-blur-md overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => {
          const isAi = m.role === 'assistant';
          return (
            <div key={idx} className={`flex gap-3 text-xs max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              <div className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center ${isAi ? 'bg-purple-500/10 text-purple-500' : 'bg-primary text-primary-foreground'}`}>
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-xl border leading-relaxed space-y-1.5 ${
                isAi 
                  ? 'border-border bg-card/65 text-muted-foreground' 
                  : 'border-accent bg-blue-500/5 text-foreground'
              }`}>
                {isAi ? parseMarkdown(m.content) : m.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 text-xs mr-auto items-center">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input box & Quick triggers */}
      <div className="space-y-4 shrink-0">
        {/* Suggestion list */}
        <div className="flex flex-wrap gap-2 justify-center">
          {((user?.role === 'CO_FOUNDER') 
            ? [
                'Which deals are most likely to close this week?',
                'Which projects need attention?',
                'Which employee is overloaded?',
                'What\'s our expected monthly revenue?',
                'Which clients haven\'t been contacted recently?',
                'Show marketing ROI for the last 30 days.'
              ]
            : (user?.role === 'HR')
            ? [
                'Who has low attendance?',
                'Which employee is overloaded?',
                'Suggest interview questions.',
                'Generate offer letter.',
                'Predict employee attrition.',
                'Recommend training.',
                'Summarize performance reviews.'
              ]
            : (user?.role === 'SALES_MANAGER')
            ? [
                'Which leads are most likely to convert?',
                'Which salesperson needs support?',
                'Which proposals haven\'t received a response?',
                'Identify stalled opportunities.',
                'Recommend the next follow-up.',
                'Generate a proposal.',
                'Draft a follow-up email.'
              ]
            : (user?.role === 'PROJECT_MANAGER')
            ? [
                'Which projects are at risk?',
                'Which developer is overloaded?',
                'Predict project completion date.',
                'Identify blockers.',
                'Generate sprint plan.',
                'Draft a client status update.',
                'Recommend resource allocation.'
              ]
            : (user?.role === 'DEVELOPER')
            ? [
                'Explain this API.',
                'Generate React component.',
                'Optimize SQL query.',
                'Write unit tests.',
                'Explain this error.',
                'Generate Prisma schema.',
                'Suggest code improvements.',
                'Create API endpoint.',
                'Generate validation.',
                'Review my code.',
                'Explain project architecture.'
              ]
            : (user?.role === 'CLIENT')
            ? [
                'What is the status of my project?',
                'When is the next milestone?',
                'Show pending invoices.',
                'Download the latest deliverable.',
                'What changed this week?',
                'Schedule a meeting with my Project Manager.',
                'Show open support tickets.',
                'Explain the latest invoice.'
              ]
            : [
                'Which project is losing money?',
                'Which employee is overloaded?',
                'Which client may leave?',
                'Predict next month\'s revenue',
                'Suggest hiring needs',
                'Recommend upsell opportunities',
                'Summarize today\'s business activity',
                'Suggest cost-saving measures'
              ]
          ).map((sp) => (
            <button
              key={sp}
              onClick={() => handleSendMessage(sp)}
              className="text-[10px] font-semibold border border-border rounded-full px-3.5 py-1.5 hover:bg-secondary transition bg-card"
            >
              {sp}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Query delayed projects or write proposals..."
            disabled={loading}
            required
          />
          <button
            type="submit"
            className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center shrink-0"
            disabled={loading}
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
