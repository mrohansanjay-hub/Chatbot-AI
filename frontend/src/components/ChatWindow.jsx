import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaCopy, FaShareAlt } from 'react-icons/fa';

export default function ChatWindow({ messages, bottomRef, onFeedback }) {
  const CodeBlock = ({ children, className }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    };

    return (
      <div className="code-container relative">
        <button 
          className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-500"
          onClick={handleCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre className="bg-gray-100 p-4 rounded mt-6"><code className={className}>{children}</code></pre>
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 mt-24 text-lg font-semibold">
          What's on the agenda today?
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`inline-block max-w-[90%] sm:max-w-[70%] px-4 py-2 rounded whitespace-pre-wrap break-words ${
            msg.role === "user"
              ? "ml-auto bg-indigo-600 text-white"
              : "mr-auto bg-gray-200 text-gray-800"
          }`}
        >
          {/* Display text or loading */}
          {msg.text === "" && msg.role === "assistant" ? (
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <>
              {msg.role === 'assistant' ? <ReactMarkdown 
                className="prose"
                components={{
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <CodeBlock className={className}>{children}</CodeBlock>
                    ) : (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                    );
                  }
                }}
              >{msg.text}</ReactMarkdown> : msg.text}

              {/* Display image if any */}
              {msg.image_url && (
                <img src={msg.image_url} alt="Explanation" className="mt-2 max-w-full rounded" />
              )}
            </>
          )}

          {/* Action buttons for assistant messages */}
          {msg.role === 'assistant' && msg.isComplete && (
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => navigator.clipboard.writeText(msg.text)}
                className="text-gray-500 hover:text-gray-700"
                title="Copy"
              >
                <FaCopy size={16} />
              </button>
              <button
                onClick={() => navigator.share ? navigator.share({ text: msg.text }) : alert('Share not supported')}
                className="text-gray-500 hover:text-gray-700"
                title="Share"
              >
                <FaShareAlt size={16} />
              </button>
              <button
                onClick={() => onFeedback(msg.id, 'like')}
                className="text-gray-500 hover:text-gray-700"
                title="Like"
              >
                <FaThumbsUp size={16} />
              </button>
              <button
                onClick={() => onFeedback(msg.id, 'dislike')}
                className="text-gray-500 hover:text-gray-700"
                title="Dislike"
              >
                <FaThumbsDown size={16} />
              </button>
            </div>
          )}

          {/* Display attached files if any */}
          {msg.files && msg.files.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {msg.files.map((file, i) => (
                <div
                  key={i}
                  className="bg-indigo-500 bg-opacity-30 text-indigo-800 px-2 py-1 rounded flex items-center justify-between text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <a
                    href={file.url}
                    download={file.name}
                    className="ml-2 text-indigo-700 underline"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div ref={bottomRef} />
    </main>
  );
}
