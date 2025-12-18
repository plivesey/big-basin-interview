import ReactMarkdown from 'react-markdown';

interface MarkdownMessageProps {
  content: string;
}

/**
 * Renders markdown content as styled React components.
 * Safe by default - strips raw HTML to prevent XSS.
 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
