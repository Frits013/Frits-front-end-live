
import { ChatMessage, ChatMessageWithState, MultiAgentState } from "@/types/chat";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";

interface ChatMessagesProps {
  messages: ChatMessageWithState[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  const formatText = (text: string) => {
    // Handle bold text wrapped in **
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const toggleExpand = (messageId: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const formatMessage = (text: string) => {
    if (!text) return ''; // Add null check for text

    // First, handle any markdown list numbers that might appear
    text = text.replace(/^\d+\.\s+/gm, '');

    // Split the text into sections based on ###, but only if ### exists
    if (text.includes('###')) {
      const sections = text.split('###').filter(Boolean);
      return sections.map((section, index) => {
        const [header, ...contentParts] = section.trim().split('\n');
        const content = contentParts.join('\n');

        return (
          <div key={index} className="mb-6 last:mb-0">
            <div className="font-bold text-lg mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {header.trim()}
            </div>
            <div 
              className="pl-6 border-l-2 border-purple-200 dark:border-purple-800"
              dangerouslySetInnerHTML={{ 
                __html: formatText(content.trim())
              }}
            />
          </div>
        );
      });
    }

    // If there are no ###, treat the entire text as regular content
    return (
      <div 
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ 
          __html: formatText(text)
        }}
      />
    );
  };

  const renderMultiAgentState = (state: MultiAgentState, messageId: string) => {
    const isExpanded = expandedStates[messageId] || false;
    
    return (
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
        <Collapsible open={isExpanded} className="w-full">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleExpand(messageId)}
              className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Brain size={16} />
                <span>AI Decision Process</span>
              </div>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-sm space-y-3">
            {state.summary && (
              <div className="rounded-md bg-purple-50 dark:bg-purple-900/20 p-3">
                <h4 className="font-medium mb-1">Summary</h4>
                <p>{state.summary}</p>
              </div>
            )}
            
            {state.reviewer_feedback?.length > 0 && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3">
                <h4 className="font-medium mb-1">Reviewer Feedback</h4>
                <ul className="list-disc list-inside">
                  {state.reviewer_feedback.map((feedback, idx) => (
                    <li key={idx}>
                      <strong>{feedback.role}:</strong> {feedback.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {state.RAG_input && state.RAG_response && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3">
                <h4 className="font-medium mb-1">Knowledge Lookup</h4>
                <p><strong>Query:</strong> {state.RAG_input}</p>
                <p><strong>Result:</strong> {state.RAG_response}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gradient-to-r from-gray-100/80 to-purple-50/80 dark:from-gray-800/80 dark:to-purple-900/80 text-gray-800 dark:text-gray-200'
            } transition-all duration-200 hover:shadow-md backdrop-blur-sm`}
          >
            {formatMessage(message.content)}
            
            {/* Render multi-agent state if available */}
            {message.role === 'assistant' && message.multi_agent_state && 
              renderMultiAgentState(message.multi_agent_state, message.id)
            }
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
