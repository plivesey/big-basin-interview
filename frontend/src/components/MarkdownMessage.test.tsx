import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownMessage } from './MarkdownMessage';

describe('MarkdownMessage', () => {
  describe('bold text', () => {
    it('should render **text** as bold', () => {
      render(<MarkdownMessage content="This is **bold** text" />);
      const bold = screen.getByText('bold');
      expect(bold.tagName).toBe('STRONG');
    });

    it('should render __text__ as bold', () => {
      render(<MarkdownMessage content="This is __bold__ text" />);
      const bold = screen.getByText('bold');
      expect(bold.tagName).toBe('STRONG');
    });
  });

  describe('italic text', () => {
    it('should render *text* as italic', () => {
      render(<MarkdownMessage content="This is *italic* text" />);
      const italic = screen.getByText('italic');
      expect(italic.tagName).toBe('EM');
    });

    it('should render _text_ as italic', () => {
      render(<MarkdownMessage content="This is _italic_ text" />);
      const italic = screen.getByText('italic');
      expect(italic.tagName).toBe('EM');
    });
  });

  describe('unordered lists', () => {
    it('should render - items as unordered list', () => {
      const content = `- Item 1
- Item 2
- Item 3`;
      render(<MarkdownMessage content={content} />);
      const list = document.querySelector('ul');
      expect(list).toBeInTheDocument();
      expect(list?.querySelectorAll('li')).toHaveLength(3);
    });

    it('should render * items as unordered list', () => {
      const content = `* Item A
* Item B`;
      render(<MarkdownMessage content={content} />);
      const list = document.querySelector('ul');
      expect(list).toBeInTheDocument();
      expect(list?.querySelectorAll('li')).toHaveLength(2);
    });
  });

  describe('ordered lists', () => {
    it('should render numbered items as ordered list', () => {
      const content = `1. First
2. Second
3. Third`;
      render(<MarkdownMessage content={content} />);
      const list = document.querySelector('ol');
      expect(list).toBeInTheDocument();
      expect(list?.querySelectorAll('li')).toHaveLength(3);
    });
  });

  describe('paragraphs', () => {
    it('should render text in paragraph tags', () => {
      render(<MarkdownMessage content="Hello world" />);
      const paragraph = document.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('Hello world');
    });

    it('should render multiple paragraphs', () => {
      const content = `First paragraph

Second paragraph`;
      render(<MarkdownMessage content={content} />);
      const paragraphs = document.querySelectorAll('p');
      expect(paragraphs).toHaveLength(2);
    });
  });

  describe('combined formatting', () => {
    it('should render bold and italic together', () => {
      render(<MarkdownMessage content="This has **bold** and *italic* text" />);
      expect(screen.getByText('bold').tagName).toBe('STRONG');
      expect(screen.getByText('italic').tagName).toBe('EM');
    });

    it('should render lists with bold items', () => {
      const content = `- **Bold item**
- Normal item`;
      render(<MarkdownMessage content={content} />);
      const list = document.querySelector('ul');
      expect(list).toBeInTheDocument();
      const boldText = screen.getByText('Bold item');
      expect(boldText.tagName).toBe('STRONG');
    });
  });

  describe('security', () => {
    it('should not render raw HTML tags', () => {
      render(<MarkdownMessage content="<script>alert('xss')</script>" />);
      // Script tag should be stripped or rendered as text, not executed
      const scriptTag = document.querySelector('script');
      expect(scriptTag).not.toBeInTheDocument();
    });

    it('should not render onclick handlers', () => {
      render(<MarkdownMessage content='<div onclick="alert(1)">Click me</div>' />);
      const clickableDiv = document.querySelector('[onclick]');
      expect(clickableDiv).not.toBeInTheDocument();
    });
  });
});
