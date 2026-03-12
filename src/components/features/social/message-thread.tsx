import { Card } from '@/components/ui/card';

interface Message {
  id: string;
  content: string;
  created_at: string;
  isMine: boolean;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface MessageThreadProps {
  messages: Message[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.isMine ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`max-w-xs rounded-lg p-3 ${
              msg.isMine
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}>
              {!msg.isMine && msg.sender && (
                <p className="text-xs opacity-70 mb-1">{msg.sender.full_name}</p>
              )}
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.isMine ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(msg.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
