
interface Message {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  created_at: Date;
}

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const formatMessage = (text: string) => {
    // Check if the message contains markdown-style headers
    if (text.includes('###') || text.includes('**')) {
      // Remove any ### markers
      text = text.replace(/###/g, '');
      
      // Split by numbered points if they exist
      const points = text.split(/(?=\d+\.\s+)/);
      
      return points.map((point, index) => {
        // Extract header and content, handling both ** and plain text headers
        const match = point.match(/(\d+\.\s+)?\**(.*?)\**:\s*(.*)/s);
        if (match) {
          const [, , header, content] = match;
          return (
            <div key={index} className="mb-6 last:mb-0">
              <div className="font-bold text-lg mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {header.trim()}
              </div>
              <div className="pl-6 border-l-2 border-purple-200 dark:border-purple-800">
                {content.trim()}
              </div>
            </div>
          );
        }
        return <div key={index} className="whitespace-pre-wrap">{point.trim()}</div>;
      });
    }
    
    // If no special formatting, return the text with preserved whitespace
    return <div className="whitespace-pre-wrap">{text}</div>;
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
            {formatMessage(message.message)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
