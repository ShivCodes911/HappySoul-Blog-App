import { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Edit3, Trash2, Check, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCommentsApi, addCommentApi, updateCommentApi, deleteCommentApi } from '../api/comments';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  return `${Math.floor(hrs / 24)}D AGO`;
}

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      const res = await getCommentsApi(postId);
      setComments(Array.isArray(res.data?.postComment) ? res.data.postComment : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await addCommentApi(postId, { content: text.trim() });
      setText('');
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      await updateCommentApi(id, { content: editText.trim() });
      setEditId(null);
      fetchComments();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this commentary permanently?')) return;
    try {
      await deleteCommentApi(id);
      fetchComments();
    } catch { /* ignore */ }
  };

  return (
    <section style={vcs.section}>
      <div style={vcs.headerRow}>
        <div style={vcs.titleCluster}>
          <span className="type-overline">DISCOURSE</span>
          <h3 className="type-subhead" style={vcs.heading}>
            DISCUSSION ({comments.length})
          </h3>
        </div>
      </div>

      {/* Add response form */}
      {user ? (
        <form onSubmit={handleAdd} style={vcs.formCard}>
          <div style={vcs.inputRow}>
            {(user.profileImage?.url || user.profileImage) ? (
              <img
                src={user.profileImage?.url || user.profileImage}
                alt={user.name}
                className="avatar"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              />
            ) : (
              <div style={vcs.authorDot}>{(user.name || 'U')[0].toUpperCase()}</div>
            )}
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="comment-input">
                ADD YOUR CRITICAL PERSPECTIVE
              </label>
              <textarea
                style={vcs.textarea}
                placeholder="State your argument or critique clearly…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                id="comment-input"
              />
              {error && <p className="error-msg">{error}</p>}
              <div style={vcs.formFooter}>
                <span style={vcs.hintText}>COMMUNITY GUIDELINE: BE RESPECTFUL, SUBSTANTIVE, AND CONSTRUCTIVE.</span>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting || !text.trim()}
                  id="comment-submit-btn"
                >
                  <Send size={12} />
                  <span>{submitting ? 'POSTING…' : 'SUBMIT RESPONSE'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={vcs.loginCard}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase' }}>
              JOIN THE CRITICAL DISCOURSE
            </div>
            <div style={{ color: 'var(--clr-text-2)', fontSize: '0.85rem', marginTop: 4 }}>
              Sign in with your writer account to challenge, debate, or substantiate this dispatch.
            </div>
          </div>
          <a href="/login" className="btn btn-primary btn-sm">
            SIGN IN TO RESPOND
          </a>
        </div>
      )}

      {/* Responses List */}
      <div style={vcs.list}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={vcs.skeletonCard}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ width: 140, height: 14 }} />
                <div className="skeleton" style={{ width: '80%', height: 12 }} />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 24px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: 6 }}>
              NO RESPONSES ON RECORD
            </h4>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem', margin: 0 }}>
              Be the first to articulate an argument in response to this piece.
            </p>
          </div>
        ) : (
          comments.map((c) => {
            const isOwner = user && (c.author?._id === user._id || c.author === user._id);
            const authorName = c.author?.name || 'Anonymous';
            const authorAvatarUrl = c.author?.profileImage?.url || c.author?.profileImage;

            return (
              <div key={c._id} style={vcs.commentCard}>
                <div style={vcs.commentHeader}>
                  {authorAvatarUrl ? (
                    <img
                      src={authorAvatarUrl}
                      alt={authorName}
                      className="avatar"
                      style={{ width: 36, height: 36, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={vcs.authorDot}>{authorName[0].toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={vcs.commentMeta}>
                      <span style={vcs.commentAuthor}>{authorName.toUpperCase()}</span>
                      <span style={vcs.dotSeparator}>/</span>
                      <span style={vcs.commentTime}>{timeAgo(c.createdAt)}</span>
                    </div>

                    {editId === c._id ? (
                      <div style={{ marginTop: 10 }}>
                        <textarea
                          style={vcs.textarea}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditId(null)}
                          >
                            <X size={12} />
                            <span>CANCEL</span>
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleEdit(c._id)}
                          >
                            <Check size={12} />
                            <span>SAVE REVISION</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={vcs.commentText}>{c.content}</p>
                    )}
                  </div>

                  {isOwner && editId !== c._id && (
                    <div style={vcs.commentActions}>
                      <button
                        style={vcs.actionIconBtn}
                        onClick={() => { setEditId(c._id); setEditText(c.content); }}
                        title="Edit response"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        style={{ ...vcs.actionIconBtn, color: 'var(--clr-secondary)' }}
                        onClick={() => handleDelete(c._id)}
                        title="Delete response"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

const vcs = {
  section: {
    marginTop: 48,
  },
  headerRow: {
    paddingBottom: 16,
    borderBottom: '2px solid var(--clr-border-strong)',
    marginBottom: 24,
  },
  titleCluster: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  heading: {
    margin: 0,
    letterSpacing: '-0.02em',
  },
  formCard: {
    border: '2px solid var(--clr-border-strong)',
    padding: '24px',
    backgroundColor: 'var(--clr-surface)',
    marginBottom: 32,
  },
  inputRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  authorDot: {
    width: 36,
    height: 36,
    borderRadius: '9999px',
    backgroundColor: 'var(--clr-border-strong)',
    color: 'var(--clr-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: '13px',
    flexShrink: 0,
  },
  textarea: {
    width: '100%',
    backgroundColor: 'var(--clr-bg)',
    border: '2px solid var(--clr-border-medium)',
    padding: '10px 14px',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    color: 'var(--clr-text-1)',
    resize: 'vertical',
    minHeight: 88,
    lineHeight: 1.6,
    outline: 'none',
  },
  formFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  hintText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--clr-text-3)',
    fontWeight: 700,
  },
  loginCard: {
    border: '2px solid var(--clr-border-strong)',
    padding: '24px',
    backgroundColor: 'var(--clr-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  skeletonCard: {
    display: 'flex',
    gap: 16,
    padding: '20px',
    border: '1px solid var(--clr-border-subtle)',
    backgroundColor: 'var(--clr-surface)',
  },
  commentCard: {
    border: '1px solid var(--clr-border-subtle)',
    borderLeft: '4px solid var(--clr-border-strong)',
    padding: '20px',
    backgroundColor: 'var(--clr-bg)',
  },
  commentHeader: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  commentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentAuthor: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--clr-text-1)',
  },
  dotSeparator: {
    color: 'var(--clr-border-medium)',
    fontSize: '11px',
  },
  commentTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--clr-text-3)',
    fontWeight: 700,
  },
  commentText: {
    fontSize: '0.925rem',
    lineHeight: 1.65,
    color: 'var(--clr-text-2)',
  },
  commentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionIconBtn: {
    background: 'none',
    border: '1px solid var(--clr-border-medium)',
    cursor: 'pointer',
    color: 'var(--clr-text-2)',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
