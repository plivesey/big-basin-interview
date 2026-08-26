import { memo, Fragment, type ReactNode } from 'react';
import { View, Text } from 'react-native';

/**
 * A small markdown renderer covering exactly the element set the web app
 * whitelists in MarkdownMessage.tsx: p, ul, ol, li, strong, em.
 *
 * react-markdown is DOM-only. The obvious RN replacement,
 * react-native-markdown-display, has been unmaintained since 2022 and peer-deps
 * React 16/17, so it needs --legacy-peer-deps under React 19. Since the surface
 * is six elements, rendering them directly is smaller, testable, and has no
 * dependency risk. If Scout ever starts emitting headings, tables or code
 * blocks, @ronradtke/react-native-markdown-display is the maintained fork to
 * reach for.
 */

interface MarkdownTextProps {
  content: string;
  /** Class applied to every text run, so the bubble controls colour. */
  textClassName?: string;
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] };

const UNORDERED = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ kind: 'list', ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const line of lines) {
    const unordered = UNORDERED.exec(line);
    const ordered = ORDERED.exec(line);

    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const item = (unordered?.[1] ?? ordered?.[1] ?? '').trim();
      if (list && list.ordered === isOrdered) {
        list.items.push(item);
      } else {
        flushList();
        list = { ordered: isOrdered, items: [item] };
      }
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

/** Renders **bold** and *italic* runs; everything else is plain text. */
export function renderInline(text: string, key: string, textClassName: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    if (!part) return null;
    const id = `${key}-${index}`;

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return (
        <Text key={id} className={`font-semibold ${textClassName}`}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return (
        <Text key={id} className={`italic ${textClassName}`}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Fragment key={id}>{part}</Fragment>;
  });
}

export const MarkdownText = memo(function MarkdownText({
  content,
  textClassName = '',
}: MarkdownTextProps) {
  const blocks = parseBlocks(content);

  return (
    <View>
      {blocks.map((block, blockIndex) => {
        if (block.kind === 'paragraph') {
          return (
            <Text
              key={`p-${blockIndex}`}
              className={`text-base leading-relaxed ${blockIndex > 0 ? 'mt-2' : ''} ${textClassName}`}
            >
              {renderInline(block.text, `p-${blockIndex}`, textClassName)}
            </Text>
          );
        }

        return (
          <View key={`l-${blockIndex}`} className={blockIndex > 0 ? 'mt-2' : ''}>
            {block.items.map((item, itemIndex) => (
              <View key={`l-${blockIndex}-${itemIndex}`} className="flex-row mb-1 pl-1">
                <Text className={`text-base leading-relaxed mr-2 ${textClassName}`}>
                  {block.ordered ? `${itemIndex + 1}.` : '•'}
                </Text>
                <Text className={`flex-1 text-base leading-relaxed ${textClassName}`}>
                  {renderInline(item, `l-${blockIndex}-${itemIndex}`, textClassName)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
});
