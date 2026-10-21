import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.codeBlockWrap}>
      <div style={styles.codeBlockHeader}>
        <span style={styles.codeBlockLang}>{language ? language.toUpperCase() : 'CODE'}</span>
        <button
          type="button"
          onClick={handleCopy}
          style={styles.copyBtn}
          title="Copy code to clipboard"
        >
          {copied ? <Check size={12} color="var(--clr-secondary)" /> : <Copy size={12} />}
          <span>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>
      <pre style={styles.pre}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseInline(text) {
  if (!text) return null;

  // Regex tokens for bold, italic, bold+italic, code, links, images
  const tokens = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Images: ![alt](url)
    const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      tokens.push(
        <img
          key={keyIndex++}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          style={styles.inlineImg}
          loading="lazy"
        />
      );
      remaining = remaining.slice(imgMatch[0].length);
      continue;
    }

    // Links: [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={keyIndex++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          {parseInline(linkMatch[1])}
          <ExternalLink size={10} style={{ marginLeft: 3, verticalAlign: 'middle', display: 'inline' }} />
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code key={keyIndex++} style={styles.inlineCode}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold + Italic: ***text*** or ___text___
    const biMatch1 = remaining.match(/^(\*\*\*|___)(?!\s)(.+?)(?<!\s)\1/);
    if (biMatch1) {
      tokens.push(
        <strong key={keyIndex++} style={{ fontWeight: 800, color: 'var(--clr-text-1)' }}>
          <em style={{ fontStyle: 'italic' }}>
            {parseInline(biMatch1[2])}
          </em>
        </strong>
      );
      remaining = remaining.slice(biMatch1[0].length);
      continue;
    }

    // Bold + Italic: **_text_**
    const biMatch2 = remaining.match(/^(\*\*\_)(?!\s)(.+?)(?<!\s)(\_\*\*)/);
    if (biMatch2) {
      tokens.push(
        <strong key={keyIndex++} style={{ fontWeight: 800, color: 'var(--clr-text-1)' }}>
          <em style={{ fontStyle: 'italic' }}>
            {parseInline(biMatch2[2])}
          </em>
        </strong>
      );
      remaining = remaining.slice(biMatch2[0].length);
      continue;
    }

    // Bold + Italic: _**text**_
    const biMatch3 = remaining.match(/^(\_\*\*)(?!\s)(.+?)(?<!\s)(\*\*\_)/);
    if (biMatch3) {
      tokens.push(
        <strong key={keyIndex++} style={{ fontWeight: 800, color: 'var(--clr-text-1)' }}>
          <em style={{ fontStyle: 'italic' }}>
            {parseInline(biMatch3[2])}
          </em>
        </strong>
      );
      remaining = remaining.slice(biMatch3[0].length);
      continue;
    }

    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(?!\s)(.+?)(?<!\s)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={keyIndex++} style={{ fontWeight: 800, color: 'var(--clr-text-1)' }}>
          {parseInline(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic with *: must not be adjacent to another *
    const italicAstMatch = remaining.match(/^\*(?!\*)(?!\s)(.+?)(?<!\s)(?<!\*)\*(?!\*)/);
    if (italicAstMatch) {
      tokens.push(
        <em key={keyIndex++} style={{ fontStyle: 'italic' }}>
          {parseInline(italicAstMatch[1])}
        </em>
      );
      remaining = remaining.slice(italicAstMatch[0].length);
      continue;
    }

    // Italic with _: must not be adjacent to another _
    const italicUndMatch = remaining.match(/^_(?!_)(?!\s)(.+?)(?<!\s)(?<!_)_(?!_)/);
    if (italicUndMatch) {
      tokens.push(
        <em key={keyIndex++} style={{ fontStyle: 'italic' }}>
          {parseInline(italicUndMatch[1])}
        </em>
      );
      remaining = remaining.slice(italicUndMatch[0].length);
      continue;
    }

    // Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(?!\s)(.+?)(?<!\s)~~/);
    if (strikeMatch) {
      tokens.push(
        <del key={keyIndex++} style={{ textDecoration: 'line-through', opacity: 0.7 }}>
          {parseInline(strikeMatch[1])}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Plain text chunk until next special character
    const nextSpecial = remaining.search(/[`*_[!~]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

export default function MarkdownRenderer({ content, fontSize = 17 }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  let elemKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block: ```lang
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <CodeBlock
          key={elemKey++}
          code={codeLines.join('\n')}
          language={language}
        />
      );
      continue;
    }

    // Horizontal Rule: --- or ***
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      elements.push(<hr key={elemKey++} style={styles.hr} />);
      i++;
      continue;
    }

    // Headings: # H1, ## H2, ### H3, #### H4 (strips redundant/repeated hashes like "## ## text")
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(4, headingMatch[1].length);
      const cleanText = headingMatch[2].replace(/^(#{1,6}\s*)+/, '').trim();
      const Tag = `h${level}`;
      const headingStyle = styles[`h${level}`] || styles.h2;
      elements.push(
        <Tag key={elemKey++} style={headingStyle}>
          {parseInline(cleanText)}
        </Tag>
      );
      i++;
      continue;
    }

    // Blockquote: > text
    if (line.trim().startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote key={elemKey++} style={styles.blockquote}>
          {quoteLines.map((ql, idx) => (
            <p key={idx} style={{ margin: idx > 0 ? '8px 0 0' : 0 }}>
              {parseInline(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered List: - item or * item
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={elemKey++} style={styles.ul}>
          {listItems.map((item, idx) => (
            <li key={idx} style={styles.li}>
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List: 1. item
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={elemKey++} style={styles.ol}>
          {listItems.map((item, idx) => (
            <li key={idx} style={styles.li}>
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\s*[-*_]\s*){3,}$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    elements.push(
      <p key={elemKey++} style={{ ...styles.paragraph, fontSize: `${fontSize}px` }}>
        {parseInline(paraLines.join(' '))}
      </p>
    );
  }

  return <div className="markdown-body" style={styles.wrapper}>{elements}</div>;
}

const styles = {
  wrapper: {
    lineHeight: 1.8,
    color: 'var(--clr-text-1)',
  },
  paragraph: {
    marginBottom: '1.4em',
    lineHeight: 1.8,
    color: 'var(--clr-text-1)',
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    letterSpacing: '-0.03em',
    marginTop: '2em',
    marginBottom: '0.8em',
    color: 'var(--clr-text-1)',
    borderBottom: '2px solid var(--clr-border-strong)',
    paddingBottom: '8px',
  },
  h2: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    letterSpacing: '-0.02em',
    marginTop: '1.8em',
    marginBottom: '0.6em',
    color: 'var(--clr-text-1)',
  },
  h3: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    letterSpacing: '-0.01em',
    marginTop: '1.4em',
    marginBottom: '0.5em',
    color: 'var(--clr-text-1)',
  },
  h4: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    marginTop: '1.2em',
    marginBottom: '0.4em',
    color: 'var(--clr-text-1)',
  },
  blockquote: {
    margin: '1.8em 0',
    padding: '16px 24px',
    backgroundColor: 'var(--clr-surface)',
    borderLeft: '4px solid var(--clr-secondary)',
    borderTop: '1px solid var(--clr-border-subtle)',
    borderRight: '1px solid var(--clr-border-subtle)',
    borderBottom: '1px solid var(--clr-border-subtle)',
    fontStyle: 'italic',
    color: 'var(--clr-text-1)',
  },
  ul: {
    margin: '1em 0 1.6em 1.5em',
    paddingLeft: '1em',
    listStyleType: 'square',
  },
  ol: {
    margin: '1em 0 1.6em 1.5em',
    paddingLeft: '1em',
    listStyleType: 'decimal',
  },
  li: {
    marginBottom: '0.5em',
    lineHeight: 1.7,
  },
  hr: {
    border: 'none',
    borderTop: '2px solid var(--clr-border-strong)',
    margin: '2.5em 0',
  },
  inlineCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.88em',
    backgroundColor: 'var(--clr-surface)',
    border: '1px solid var(--clr-border-medium)',
    padding: '2px 6px',
    color: 'var(--clr-secondary)',
    fontWeight: 600,
  },
  codeBlockWrap: {
    margin: '1.8em 0',
    border: '2px solid var(--clr-border-strong)',
    backgroundColor: 'var(--clr-primary)',
    color: 'var(--clr-tertiary)',
    overflow: 'hidden',
  },
  codeBlockHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
  },
  codeBlockLang: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: 'var(--clr-secondary)',
  },
  copyBtn: {
    background: 'none',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    color: '#FAFAFA',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '3px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.15s ease',
  },
  pre: {
    padding: '16px 20px',
    margin: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: '13.5px',
    lineHeight: 1.65,
    overflowX: 'auto',
    color: '#FAFAFA',
  },
  link: {
    color: 'var(--clr-secondary)',
    textDecoration: 'underline',
    fontWeight: 600,
  },
  inlineImg: {
    maxWidth: '100%',
    height: 'auto',
    margin: '1.5em 0',
    border: '2px solid var(--clr-border-strong)',
    display: 'block',
  },
};
