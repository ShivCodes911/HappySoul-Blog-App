import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Image as ImageIcon, Send, X, Clock, FileText,
  Bold, Italic, Heading2, Heading3, Quote, Code, List, Link as LinkIcon,
  Eye, PenLine, Check, Trash2, AlertCircle
} from 'lucide-react';
import { createPostApi, uploadCoverImageApi } from '../api/posts';
import { useToast } from '../components/Toast';
import MarkdownRenderer from '../components/MarkdownRenderer';

const DRAFT_KEY = 'inkflow_draft_post';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({ title: '', content: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  const fileRef = useRef(null);
  const contentInputRef = useRef(null);

  // Restore draft from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.content) {
          setForm({ title: parsed.title || '', content: parsed.content || '' });
          setDraftRestored(true);
          setDraftSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : new Date());
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  // Auto-save to localStorage whenever form changes
  useEffect(() => {
    if (form.title.trim() || form.content.trim()) {
      const now = new Date();
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          title: form.title,
          content: form.content,
          savedAt: now.toISOString(),
        })
      );
      setDraftSavedAt(now);
    }
  }, [form.title, form.content]);

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm({ title: '', content: '' });
    setDraftRestored(false);
    setDraftSavedAt(null);
    toast('Draft cleared');
  };

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200) || 1;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Helper for Smart Markdown Toolbar (supports bold, italic, bold+italic combinations)
  const applyFormatting = useCallback((type) => {
    const textarea = contentInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);

    if (type === 'bold') {
      if (!selected) {
        const replacement = '**bold text**';
        const newContent = current.substring(0, start) + replacement + current.substring(end);
        setForm((p) => ({ ...p, content: newContent }));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 11);
        }, 10);
        return;
      }
      let replacement = '';
      if (selected.startsWith('***') && selected.endsWith('***') && selected.length >= 6) {
        replacement = '*' + selected.slice(3, -3) + '*';
      } else if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
        replacement = selected.slice(2, -2);
      } else if (selected.startsWith('*') && selected.endsWith('*') && selected.length >= 2) {
        replacement = '***' + selected.slice(1, -1) + '***';
      } else {
        replacement = '**' + selected + '**';
      }
      const newContent = current.substring(0, start) + replacement + current.substring(end);
      setForm((p) => ({ ...p, content: newContent }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + replacement.length);
      }, 10);
      return;
    }

    if (type === 'italic') {
      if (!selected) {
        const replacement = '*italic text*';
        const newContent = current.substring(0, start) + replacement + current.substring(end);
        setForm((p) => ({ ...p, content: newContent }));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 1, start + 12);
        }, 10);
        return;
      }
      let replacement = '';
      if (selected.startsWith('***') && selected.endsWith('***') && selected.length >= 6) {
        replacement = '**' + selected.slice(3, -3) + '**';
      } else if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
        replacement = '***' + selected.slice(2, -2) + '***';
      } else if (selected.startsWith('*') && selected.endsWith('*') && selected.length >= 2) {
        replacement = selected.slice(1, -1);
      } else {
        replacement = '*' + selected + '*';
      }
      const newContent = current.substring(0, start) + replacement + current.substring(end);
      setForm((p) => ({ ...p, content: newContent }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + replacement.length);
      }, 10);
      return;
    }

    if (type === 'h2' || type === 'h3') {
      const level = type === 'h2' ? 2 : 3;
      const targetPrefix = '#'.repeat(level) + ' ';

      // Find current line boundaries
      const lineStart = current.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = current.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = current.length;

      const currentLine = current.substring(lineStart, lineEnd);
      let newLine = '';

      // Check if line already has any heading prefix (#, ##, ###, etc.)
      const existingHeadingMatch = currentLine.match(/^(#{1,6}\s*)+/);
      if (existingHeadingMatch) {
        const textWithoutHeading = currentLine.replace(/^(#{1,6}\s*)+/, '').trim();
        // If it's already this exact heading level, toggle it off to clean text!
        if (currentLine.startsWith(targetPrefix)) {
          newLine = textWithoutHeading;
        } else {
          // Switch to target heading level
          newLine = targetPrefix + textWithoutHeading;
        }
      } else {
        // Line has no heading yet -> add heading prefix
        const content = currentLine.trim() || (type === 'h2' ? 'Section Heading' : 'Subheading');
        newLine = targetPrefix + content;
      }

      const newContent = current.substring(0, lineStart) + newLine + current.substring(lineEnd);
      setForm((p) => ({ ...p, content: newContent }));
      setTimeout(() => {
        textarea.focus();
        const cursorAfter = lineStart + newLine.length;
        textarea.setSelectionRange(cursorAfter, cursorAfter);
      }, 10);
      return;
    }

    if (type === 'quote') {
      const lineStart = current.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = current.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = current.length;
      const currentLine = current.substring(lineStart, lineEnd);
      let newLine = '';
      if (currentLine.startsWith('> ')) {
        newLine = currentLine.slice(2);
      } else {
        newLine = '> ' + (currentLine.trim() || 'Quote text');
      }
      const newContent = current.substring(0, lineStart) + newLine + current.substring(lineEnd);
      setForm((p) => ({ ...p, content: newContent }));
      setTimeout(() => { textarea.focus(); }, 10);
      return;
    }

    if (type === 'list') {
      const lineStart = current.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = current.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = current.length;
      const currentLine = current.substring(lineStart, lineEnd);
      let newLine = '';
      if (currentLine.startsWith('- ')) {
        newLine = currentLine.slice(2);
      } else {
        newLine = '- ' + (currentLine.trim() || 'List item');
      }
      const newContent = current.substring(0, lineStart) + newLine + current.substring(lineEnd);
      setForm((p) => ({ ...p, content: newContent }));
      setTimeout(() => { textarea.focus(); }, 10);
      return;
    }

    if (type === 'code') {
      const text = selected || '// your code here';
      const replacement = `\n\`\`\`javascript\n${text}\n\`\`\`\n`;
      const newContent = current.substring(0, start) + replacement + current.substring(end);
      setForm((p) => ({ ...p, content: newContent }));
    } else if (type === 'link') {
      const text = selected || 'Link title';
      const replacement = `[${text}](https://example.com)`;
      const newContent = current.substring(0, start) + replacement + current.substring(end);
      setForm((p) => ({ ...p, content: newContent }));
    }

    setTimeout(() => {
      textarea.focus();
    }, 10);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = (e) => {
    e.stopPropagation();
    setCoverFile(null);
    setCoverPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Both a title and post content are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await createPostApi(form);
      const postId = res.data?.post?._id;

      // Clear auto-saved draft upon successful publish
      localStorage.removeItem(DRAFT_KEY);

      if (coverFile && postId) {
        try {
          const fd = new FormData();
          fd.append('coverImage', coverFile);
          await uploadCoverImageApi(postId, fd);
        } catch (imgErr) {
          toast(
            imgErr.response?.data?.message ||
              'Post saved, but cover image upload failed. Check Cloudinary credentials in .env',
            'warning'
          );
          navigate(`/posts/${postId}`);
          return;
        }
      }

      toast('Post published successfully');
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      {/* Top Editorial Rubric Bar */}
      <div style={ved.topHeader}>
        <div className="container" style={ved.topContainer}>
          <Link to="/" style={ved.backLink}>
            <ArrowLeft size={14} />
            <span>RETURN TO STORIES</span>
          </Link>

          <div style={ved.telemetryGroup}>
            {draftSavedAt && (
              <span style={ved.autoSaveIndicator} title="Draft saved automatically in browser storage">
                <Check size={11} color="var(--clr-secondary)" />
                <span>AUTO-SAVED</span>
              </span>
            )}
            <span style={ved.telemetryItem}>
              <FileText size={12} />
              <span>{wordCount} WORDS</span>
            </span>
            <span style={ved.telemetryDivider}>/</span>
            <span style={ved.telemetryItem}>
              <Clock size={12} />
              <span>~{readingTime} MIN READ</span>
            </span>
            <span className="badge badge-yellow" style={{ marginLeft: 8 }}>
              WRITER STUDIO
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 920, paddingTop: 32 }}>
        {/* Restored Draft Alert Banner */}
        {draftRestored && (
          <div style={ved.draftBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={15} color="var(--clr-secondary)" />
              <span style={ved.draftBannerText}>
                UNSAVED DRAFT RESTORED FROM PREVIOUS SESSION
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={discardDraft}
                style={ved.draftDiscardBtn}
                title="Discard this draft"
              >
                <Trash2 size={12} />
                <span>DISCARD DRAFT</span>
              </button>
              <button
                type="button"
                onClick={() => setDraftRestored(false)}
                style={ved.draftCloseBtn}
                title="Dismiss message"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={ved.deskFrame}>
          {error && <div className="form-helper error" style={{ padding: '16px 24px 0' }}>{error}</div>}

          {/* Cover Image Attachment Frame */}
          <div
            style={ved.coverDropzone}
            onClick={() => fileRef.current?.click()}
            id="cover-image-dropzone"
          >
            {coverPreview ? (
              <div style={ved.previewWrap}>
                <img src={coverPreview} alt="Cover preview" style={ved.previewImg} />
                <button
                  type="button"
                  style={ved.removeCoverBtn}
                  onClick={removeCover}
                  title="Remove cover image"
                >
                  <X size={14} />
                  <span>REMOVE</span>
                </button>
              </div>
            ) : (
              <div style={ved.dropzonePrompt}>
                <ImageIcon size={20} style={{ color: 'var(--clr-text-3)' }} />
                <div>
                  <span style={ved.dropzoneTitle}>ATTACH COVER IMAGE</span>
                  <span style={ved.dropzoneSub}>OPTIONAL HIGH-RESOLUTION IMAGE VIA CLOUDINARY</span>
                </div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
              id="cover-image-input"
            />
          </div>

          {/* Editor Body */}
          <div style={ved.editorBody} className="editor-body">
            {/* Title Input */}
            <div style={{ marginBottom: 20 }}>
              <span className="type-overline">POST TITLE</span>
              <input
                id="post-title"
                name="title"
                type="text"
                placeholder="ENTER YOUR POST TITLE…"
                value={form.title}
                onChange={handleChange}
                style={ved.titleInput}
                required
              />
            </div>

            {/* Mode Tabs (Write vs Live Preview) */}
            <div style={ved.tabBar}>
              <div style={ved.tabGroup}>
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  style={{
                    ...ved.tabBtn,
                    ...(activeTab === 'write' ? ved.tabBtnActive : {}),
                  }}
                  id="tab-write-btn"
                >
                  <PenLine size={13} />
                  <span>WRITE (MARKDOWN)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    ...ved.tabBtn,
                    ...(activeTab === 'preview' ? ved.tabBtnActive : {}),
                  }}
                  id="tab-preview-btn"
                >
                  <Eye size={13} />
                  <span>LIVE PREVIEW</span>
                </button>
              </div>

              {/* Formatting Toolbar (shown in write mode) */}
              {activeTab === 'write' && (
                <div style={ved.toolbar} className="editor-toolbar">
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('bold')}
                    title="Bold (**text**)"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('italic')}
                    title="Italic (*text*)"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('h2')}
                    title="Heading 2 (## Heading)"
                  >
                    <Heading2 size={13} />
                  </button>
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('h3')}
                    title="Heading 3 (### Subheading)"
                  >
                    <Heading3 size={13} />
                  </button>
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('quote')}
                    title="Blockquote (> Quote)"
                  >
                    <Quote size={13} />
                  </button>
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('code')}
                    title="Code Block (```)"
                  >
                    <Code size={13} />
                  </button>
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('list')}
                    title="Bulleted List (- item)"
                  >
                    <List size={13} />
                  </button>
                  <button
                    type="button"
                    style={ved.toolBtn}
                    onClick={() => applyFormatting('link')}
                    title="Link ([title](url))"
                  >
                    <LinkIcon size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Content Area: Either Textarea or Live Markdown Preview */}
            {activeTab === 'write' ? (
              <textarea
                ref={contentInputRef}
                id="post-content"
                name="content"
                placeholder="Write your story…"
                value={form.content}
                onChange={handleChange}
                style={ved.contentInput}
                required
              />
            ) : (
              <div style={ved.previewContainer} id="live-markdown-preview">
                {form.content.trim() ? (
                  <MarkdownRenderer content={form.content} />
                ) : (
                  <div style={ved.emptyPreview}>
                    Nothing to preview yet. Switch back to Write mode and type some text or markdown!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Editorial Actions Footer */}
          <div style={ved.footerBar} className="editor-footer-bar">
            <div style={ved.footerNote}>
              MARKDOWN ENABLED // PUBLISHED POSTS ARE IMMEDIATELY VISIBLE TO READERS.
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              id="publish-btn"
            >
              <Send size={14} />
              <span>{loading ? 'PUBLISHING…' : 'PUBLISH POST'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ved = {
  topHeader: {
    borderBottom: '1px solid var(--clr-border-subtle)',
    backgroundColor: 'var(--clr-surface)',
    padding: '12px 0',
  },
  topContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--clr-text-2)',
    textTransform: 'uppercase',
  },
  telemetryGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  autoSaveIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--clr-secondary)',
    backgroundColor: 'var(--clr-bg)',
    border: '1px solid var(--clr-border-medium)',
    padding: '2px 6px',
    letterSpacing: '0.04em',
  },
  telemetryItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--clr-text-2)',
  },
  telemetryDivider: {
    color: 'var(--clr-border-medium)',
  },
  draftBanner: {
    marginBottom: 20,
    padding: '12px 18px',
    backgroundColor: 'var(--clr-surface)',
    border: '2px solid var(--clr-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  draftBannerText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--clr-text-1)',
    letterSpacing: '0.04em',
  },
  draftDiscardBtn: {
    background: 'none',
    border: '1px solid var(--clr-border-strong)',
    color: 'var(--clr-secondary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  draftCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--clr-text-2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  deskFrame: {
    border: '2px solid var(--clr-border-strong)',
    borderTop: '6px solid var(--clr-secondary)',
    backgroundColor: 'var(--clr-bg)',
  },
  coverDropzone: {
    cursor: 'pointer',
    borderBottom: '2px solid var(--clr-border-subtle)',
    backgroundColor: 'var(--clr-surface)',
  },
  dropzonePrompt: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  dropzoneTitle: {
    display: 'block',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--clr-text-1)',
  },
  dropzoneSub: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--clr-text-3)',
    marginTop: 2,
  },
  previewWrap: {
    position: 'relative',
    height: 240,
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeCoverBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: '#0A0A0A',
    color: '#FAFAFA',
    border: '1px solid #FAFAFA',
    padding: '6px 12px',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  editorBody: {
    padding: '36px 40px',
  },
  titleInput: {
    width: '100%',
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
    letterSpacing: '-0.02em',
    color: 'var(--clr-text-1)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--clr-border-medium)',
    padding: '12px 0',
    outline: 'none',
    marginTop: 6,
  },
  tabBar: {
    marginTop: 24,
    borderBottom: '2px solid var(--clr-border-strong)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 8,
  },
  tabGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tabBtn: {
    background: 'none',
    border: '1px solid transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--clr-text-2)',
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    backgroundColor: 'var(--clr-primary)',
    color: 'var(--clr-tertiary)',
    border: '1px solid var(--clr-border-strong)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  toolBtn: {
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border-medium)',
    color: 'var(--clr-text-1)',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  contentInput: {
    width: '100%',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.98rem',
    lineHeight: 1.7,
    color: 'var(--clr-text-1)',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    minHeight: 400,
    resize: 'vertical',
    marginTop: 16,
  },
  previewContainer: {
    minHeight: 400,
    padding: '20px 0',
    marginTop: 16,
  },
  emptyPreview: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--clr-text-3)',
    fontStyle: 'italic',
    padding: '60px 20px',
    textAlign: 'center',
  },
  footerBar: {
    padding: '20px 40px',
    borderTop: '2px solid var(--clr-border-strong)',
    backgroundColor: 'var(--clr-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerNote: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--clr-text-3)',
  },
};
