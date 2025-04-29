
import { ChatMessage } from "@/types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const formatText = (text: string) => {
    // Handle bold text wrapped in **
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const extractFinalResponse = (text: string): string => {
    // If it contains Final_response, extract only that part
    if (text.includes('Final_response')) {
      try {
        // Try to parse as JSON to extract Final_response
        const jsonMatch = text.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.Final_response) {
            return parsed.Final_response;
          }
        }
        
        // Fallback: try to extract anything after "Final_response":
        const finalResponseMatch = text.match(/Final_response["\s:]+([^"]+)/);
        if (finalResponseMatch && finalResponseMatch[1]) {
          return finalResponseMatch[1];
        }
      } catch (e) {
        console.error("Error parsing response:", e);
      }
    }
    
    // If we can't extract it, just return the original text
    return text;
  };

  const formatMessage = (message: ChatMessage) => {
    let text = message.content;
    
    if (!text) return ''; // Add null check for text
    
    // For assistant messages, try to extract the final response if it exists
    if (message.role === 'assistant' && text.includes('Final_response')) {
      text = extractFinalResponse(text);
    }

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

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.filter(msg => msg.role === 'user' || msg.role === 'assistant').map((message) => (
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
            {formatMessage(message)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
