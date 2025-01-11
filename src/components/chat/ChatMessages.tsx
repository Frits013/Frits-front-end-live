interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  return (
    <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-800 scrollbar-track-transparent">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              message.sender === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gradient-to-r from-gray-100/80 to-purple-50/80 dark:from-gray-800/80 dark:to-purple-900/80 text-gray-800 dark:text-gray-200'
            } transition-all duration-200 hover:shadow-md backdrop-blur-sm`}
          >
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;