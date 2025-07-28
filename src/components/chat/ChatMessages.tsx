
import { ChatMessage } from "@/types/chat";
import DOMPurify from 'dompurify';
import { sanitizeInput } from '@/lib/input-validation';

interface ChatMessagesProps {
  messages: ChatMessage[];
  showFinishButton?: boolean;
}

const ChatMessages = ({ messages, showFinishButton = false }: ChatMessagesProps) => {
  const formatText = (text: string) => {
    // First sanitize input to prevent XSS
    const cleanInput = sanitizeInput(text, 10000);
    // Handle bold text wrapped in ** 
    const formatted = cleanInput.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Final sanitization with strict settings
    return DOMPurify.sanitize(formatted, { 
      ALLOWED_TAGS: ['strong', 'em', 'br'],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      FORBID_ATTR: ['style', 'class', 'onclick', 'onload', 'onerror'],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
      KEEP_CONTENT: true,
      SANITIZE_DOM: true
    });
  };

  const formatMessage = (message: ChatMessage) => {
    if (!message || !message.content) return ''; // Add null check for message and content
    
    // Sanitize the entire message content first
    let text = sanitizeInput(message.content, 10000);

    // First, handle any markdown list numbers that might appear
    text = text.replace(/^\d+\.\s+/gm, '');

    // Split the text into sections based on ###, but only if ### exists
    if (text.includes('###')) {
      const sections = text.split('###').filter(Boolean);
      return sections.map((section, index) => {
        const [header, ...contentParts] = section.trim().split('\n');
        const content = contentParts.join('\n');

        return (
          <div key={index} className="mb-4 last:mb-0">
            <div className="font-semibold text-base mb-2 text-purple-700 dark:text-purple-300">
              {header.trim()}
            </div>
            <div 
              className="pl-4 border-l-2 border-purple-200 dark:border-purple-700 text-white"
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
        className="whitespace-pre-wrap text-white"
        dangerouslySetInnerHTML={{ 
          __html: formatText(text)
        }}
      />
    );
  };

  return (
    <div className={`flex flex-col gap-4 p-4 ${showFinishButton ? 'pb-24' : ''}`}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] lg:max-[70%] p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-md'
                : 'bg-gradient-to-br from-blue-600 to-slate-700 dark:from-blue-700 dark:to-slate-800 text-white rounded-bl-md border border-blue-500/30 dark:border-blue-600/30'
            }`}
          >
            {formatMessage(message)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
