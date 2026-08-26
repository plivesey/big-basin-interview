import { render, screen } from '@testing-library/react-native';
import { MarkdownText, parseBlocks } from '../MarkdownText';

describe('parseBlocks', () => {
  it('treats consecutive lines as one paragraph', () => {
    expect(parseBlocks('one\ntwo')).toEqual([{ kind: 'paragraph', text: 'one two' }]);
  });

  it('splits paragraphs on a blank line', () => {
    expect(parseBlocks('one\n\ntwo')).toEqual([
      { kind: 'paragraph', text: 'one' },
      { kind: 'paragraph', text: 'two' },
    ]);
  });

  it('collects an unordered list', () => {
    expect(parseBlocks('- a\n- b')).toEqual([
      { kind: 'list', ordered: false, items: ['a', 'b'] },
    ]);
  });

  it('collects an ordered list', () => {
    expect(parseBlocks('1. a\n2. b')).toEqual([
      { kind: 'list', ordered: true, items: ['a', 'b'] },
    ]);
  });

  it('does not merge an ordered list into an unordered one', () => {
    expect(parseBlocks('- a\n1. b')).toEqual([
      { kind: 'list', ordered: false, items: ['a'] },
      { kind: 'list', ordered: true, items: ['b'] },
    ]);
  });

  it('keeps a paragraph before a list', () => {
    expect(parseBlocks('Here you go:\n- a')).toEqual([
      { kind: 'paragraph', text: 'Here you go:' },
      { kind: 'list', ordered: false, items: ['a'] },
    ]);
  });
});

describe('MarkdownText', () => {
  it('renders plain text', () => {
    render(<MarkdownText content="Hello there" />);
    expect(screen.getByText('Hello there')).toBeTruthy();
  });

  it('renders bold and italic runs without their markers', () => {
    render(<MarkdownText content="a **bold** and *soft* word" />);
    expect(screen.getByText('bold')).toBeTruthy();
    expect(screen.getByText('soft')).toBeTruthy();
    expect(screen.queryByText('**bold**')).toBeNull();
  });

  it('renders list items with bullets', () => {
    render(<MarkdownText content={'- Luxe Salon\n- Top Tress'} />);
    expect(screen.getByText('Luxe Salon')).toBeTruthy();
    expect(screen.getByText('Top Tress')).toBeTruthy();
  });

  it('numbers an ordered list', () => {
    render(<MarkdownText content={'1. first\n2. second'} />);
    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('2.')).toBeTruthy();
  });

  it('renders nothing for empty content', () => {
    const { toJSON } = render(<MarkdownText content="" />);
    expect(toJSON()).toBeTruthy();
  });
});
