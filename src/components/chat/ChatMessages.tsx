
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
    // Check if the message contains numbered points with headers
    if (text.match(/\d+\.\s+\*\*.*?\*\*/)) {
      // Split the text into points
      const points = text.split(/(?=\d+\.\s+\*\*)/);
      
      return points.map((point, index) => {
        // Extract header and content
        const match = point.match(/\d+\.\s+\*\*(.*?)\*\*:\s*(.*)/);
        if (match) {
          const [, header, content] = match;
          return (
            <div key={index} className="mb-4">
              <div className="font-bold text-lg mb-1">{header}</div>
              <div className="pl-4">{content}</div>
            </div>
          );
        }
        return <div key={index}>{point}</div>;
      });
    }
    return text;
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
