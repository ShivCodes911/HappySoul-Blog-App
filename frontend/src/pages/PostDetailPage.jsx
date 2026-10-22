import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, Bookmark, Share2, Edit3, Trash2, ArrowLeft,
  Eye, EyeOff, Check, Maximize2, Minimize2, Type
} from 'lucide-react';
import { getPostByIdApi, deletePostApi, togglePublishApi } from '../api/posts';
import { toggleLikeApi } from '../api/likes';
import { toggleBookmarkApi, getMyBookmarksApi } from '../api/bookmarks';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import CommentSection from '../components/CommentSection';
import Loader from '../components/Loader';
import MarkdownRenderer from '../components/MarkdownRenderer';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

function calculateReadingTime(content) {
  if (!content) return '1 MIN READ';
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} MIN READ`;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  // Feature 2: Reader Controls & Reading Progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize, setFontSize] = useState(17); // 15, 17, 20
  const [focusMode, setFocusMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Track window scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setScrollProgress(0);
        return;
      }
      const current = window.scrollY;
      const progress = Math.min(100, Math.max(0, (current / total) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPostByIdApi(id);
        const p = res.data?.post;
        setPost(p);
        setLikeCount(p?.likeCount ?? 0);

        if (user && p) {
          const likesArr = Array.isArray(p.likes) ? p.likes : [];
          setLiked(likesArr.some((l) => (l._id || l) === user._id));

          getMyBookmarksApi()
            .then((bRes) => {
              const list = bRes.data?.userBookmarks || [];
              setBookmarked(list.some((b) => (b.post?._id || b.post || b._id) === p._id));
            })
            .catch(() => {});
        }
      } catch {
        toast('Failed to load article', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await toggleLikeApi(id);
      setLiked((p) => !p);
      setLikeCount((c) => (liked ? c - 1 : c + 1));
    } catch {
      toast('Failed to update reaction', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!user) { navigate('/login'); return; }
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    toast(wasBookmarked ? 'Removed from bookmarks' : 'Post saved to bookmarks');
    try {
      await toggleBookmarkApi(id);
    } catch {
      setBookmarked(wasBookmarked);
      toast('Failed to update bookmark', 'error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('Article link copied to clipboard');
    setShareOpen(false);
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`"${post.title}" on InkFlow`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  const shareToWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out "${post.title}" on InkFlow: `);
    window.open(`https://api.whatsapp.com/send?text=${text}${url}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post permanently?')) return;
    try {
      await deletePostApi(id);
      toast('Post deleted successfully');
      navigate('/my-posts');
    } catch {
      toast('Delete failed', 'error');
    }
  };

  const handleTogglePublish = async () => {
    try {
      await togglePublishApi(post._id);
      setPost((p) => ({ ...p, published: !p.published }));
      toast(`Post is now ${!post.published ? 'published live' : 'moved to draft'}`);
    } catch {
      toast('Failed to update visibility', 'error');
    }
  };

  if (loading) return <Loader />;
  if (!post) return null;

  const isOwner = user && (post.author?._id === user._id || post.author === user._id);
  const authorName = post.author?.name || 'Anonymous';
  const coverUrl = post.coverImage?.url || post.coverImage;
  const authorAvatarUrl = post.author?.profileImage?.url || post.author?.profileImage;
  const wordCount = post.content ? post.content.trim().split(/\s+/).length : 0;

  return (
    <article className="page" style={{ paddingBottom: 120 }}>
      {/* Feature 2: Reading Progress Indicator Bar at top */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: 3,
          width: `${scrollProgress}%`,
          backgroundColor: 'var(--clr-secondary)',
          zIndex: 9999,
          transition: 'width 0.1s ease',
        }}
        id="reading-progress-bar"
      />

      {/* Top Editorial Breadcrumb Header (hidden in focus mode) */}
      {!focusMode && (
        <div style={vp.topNav}>
          <div className="container" style={{ maxWidth: 860 }}>
            <Link to="/" style={vp.backLink}>
              <ArrowLeft size={14} />
              <span>RETURN TO ALL STORIES</span>
            </Link>
          </div>
        </div>
      )}

      {/* Floating Focus Mode Exit Pill */}
      {focusMode && (
        <div style={vp.focusPillWrap}>
          <button
            type="button"
            onClick={() => setFocusMode(false)}
            style={vp.focusPill}
            title="Exit distraction-free reading mode"
          >
            <Minimize2 size={13} />
            <span>EXIT FOCUS MODE</span>
          </button>
        </div>
      )}

      <div className="container" style={{ maxWidth: focusMode ? 740 : 860, paddingTop: focusMode ? 48 : 24, transition: 'max-width 0.2s ease' }}>
        {/* Overline Rubric */}
        <div style={vp.rubricRow}>
          <span className="type-overline">ARTICLE</span>
          <span style={vp.rubricDot}>/</span>
          <span style={vp.telemetryMono}>{calculateReadingTime(post.content)}</span>
          <span style={vp.rubricDot}>/</span>
          <span style={vp.telemetryMono}>{wordCount} WORDS</span>
          {!post.published && (
            <span className="badge badge-yellow" style={{ marginLeft: 8 }}>DRAFT</span>
          )}
        </div>

        {/* Headline */}
        <h1 className="type-headline" style={vp.title}>
          {post.title}
        </h1>

        {/* Byline Bar & Reader Controls */}
        <div style={vp.bylineBar} className="post-byline-bar">
          <div style={vp.authorCluster}>
            {authorAvatarUrl ? (
              <img
                src={authorAvatarUrl}
                alt={authorName}
                className="avatar"
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <div style={vp.avatarFallback}>{authorName[0].toUpperCase()}</div>
            )}
            <div style={vp.bylineText}>
              <span style={vp.bylineAuthor}>BY {authorName.toUpperCase()}</span>
              <span style={vp.bylineDate}>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          {/* Action Suite & Reader Controls */}
          <div style={vp.actionsCluster} className="post-actions-cluster">
            {/* Font Size Adjuster */}
            <div style={vp.fontSizeControls} title="Adjust text size">
              <Type size={12} style={{ color: 'var(--clr-text-3)', marginRight: 2 }} />
              <button
                type="button"
                style={{ ...vp.fontBtn, ...(fontSize === 15 ? vp.fontBtnActive : {}) }}
                onClick={() => setFontSize(15)}
                title="Small text"
              >
                A-
              </button>
              <button
                type="button"
                style={{ ...vp.fontBtn, ...(fontSize === 17 ? vp.fontBtnActive : {}) }}
                onClick={() => setFontSize(17)}
                title="Default text"
              >
                A
              </button>
              <button
                type="button"
                style={{ ...vp.fontBtn, ...(fontSize === 20 ? vp.fontBtnActive : {}) }}
                onClick={() => setFontSize(20)}
                title="Large text"
              >
                A+
              </button>
            </div>

            {/* Focus Mode Toggle */}
            <button
              type="button"
              style={{
                ...vp.actionBtn,
                ...(focusMode ? vp.focusBtnActive : {}),
              }}
              onClick={() => setFocusMode((p) => !p)}
              title={focusMode ? 'Exit focus mode' : 'Distraction-free focus mode'}
            >
              {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span style={{ fontSize: '11px' }}>{focusMode ? 'EXIT FOCUS' : 'FOCUS'}</span>
            </button>

            {/* Like Button */}
            <button
              style={{
                ...vp.actionBtn,
                ...(liked ? vp.likedBtn : {}),
              }}
              onClick={handleLike}
              id="detail-like-btn"
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={14} fill={liked ? '#EF4444' : 'none'} color={liked ? '#EF4444' : 'currentColor'} />
              <span>{likeCount}</span>
            </button>

            {/* Bookmark Button */}
            <button
              style={{
                ...vp.actionBtn,
                ...(bookmarked ? vp.bookmarkedBtn : {}),
              }}
              onClick={handleBookmark}
              id="detail-bookmark-btn"
              title={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
            >
              <Bookmark size={14} fill={bookmarked ? 'var(--clr-border-strong)' : 'none'} color="currentColor" />
            </button>

            {/* Share Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                style={{ ...vp.actionBtn, ...(shareOpen ? vp.shareBtnActive : {}) }}
                onClick={() => setShareOpen((p) => !p)}
                title="Share article"
                id="share-article-btn"
              >
                <Share2 size={14} />
              </button>

              {shareOpen && (
                <div style={vp.shareMenu}>
                  <button type="button" onClick={handleCopyLink} style={vp.shareMenuItem}>
                    <Check size={12} />
                    <span>COPY LINK</span>
                  </button>
                  <button type="button" onClick={shareToTwitter} style={vp.shareMenuItem}>
                    <span>SHARE ON X (TWITTER)</span>
                  </button>
                  <button type="button" onClick={shareToLinkedIn} style={vp.shareMenuItem}>
                    <span>SHARE ON LINKEDIN</span>
                  </button>
                  <button type="button" onClick={shareToWhatsApp} style={vp.shareMenuItem}>
                    <span>SHARE ON WHATSAPP</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Owner Management Bar */}
        {isOwner && !focusMode && (
          <div style={vp.ownerToolbar}>
            <span style={vp.ownerLabel}>MANAGE POST:</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to={`/edit-post/${post._id}`} className="btn btn-secondary btn-sm" id="post-edit-btn">
                <Edit3 size={13} />
                <span>EDIT STORY</span>
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={handleTogglePublish} id="post-publish-btn">
                {post.published ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{post.published ? 'MOVE TO DRAFT' : 'PUBLISH LIVE'}</span>
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} id="post-delete-btn">
                <Trash2 size={13} />
                <span>DELETE</span>
              </button>
            </div>
          </div>
        )}

        {/* Cover Image Frame */}
        {coverUrl && (
          <div style={vp.coverFrame}>
            <img src={coverUrl} alt={post.title} style={vp.coverImg} />
          </div>
        )}

        {/* Feature 1: Rich Markdown Body Typography */}
        <div style={vp.bodyContainer}>
          <MarkdownRenderer content={post.content} fontSize={fontSize} />
        </div>

        {/* Reader Discussion (hidden in focus mode) */}
        {!focusMode && (
          <>
            <div className="divider-strong" style={{ margin: '56px 0 40px' }} />
            <CommentSection postId={id} />
          </>
        )}
      </div>
    </article>
  );
}

const vp = {
  topNav: {
    borderBottom: '1px solid var(--clr-border-subtle)',
    padding: '12px 0',
    backgroundColor: 'var(--clr-surface)',
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
  focusPillWrap: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  focusPill: {
    backgroundColor: 'var(--clr-primary)',
    color: 'var(--clr-tertiary)',
    border: '2px solid var(--clr-border-strong)',
    boxShadow: '3px 3px 0px var(--clr-border-strong)',
    padding: '8px 16px',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rubricRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  rubricDot: {
    color: 'var(--clr-border-medium)',
    fontWeight: 700,
  },
  telemetryMono: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--clr-text-3)',
    fontWeight: 700,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.2rem, 4.5vw, 3.25rem)',
    lineHeight: 1.08,
    letterSpacing: '-0.025em',
    color: 'var(--clr-text-1)',
    marginBottom: 24,
  },
  bylineBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderTop: '2px solid var(--clr-border-strong)',
    borderBottom: '1px solid var(--clr-border-subtle)',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  authorCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: '9999px',
    backgroundColor: 'var(--clr-border-strong)',
    color: 'var(--clr-tertiary)',
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bylineText: {
    display: 'flex',
    flexDirection: 'column',
  },
  bylineAuthor: {
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--clr-text-1)',
  },
  bylineDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--clr-text-3)',
    marginTop: 2,
  },
  actionsCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  fontSizeControls: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid var(--clr-border-medium)',
    backgroundColor: 'var(--clr-surface)',
    padding: '2px 4px',
    gap: 2,
  },
  fontBtn: {
    background: 'none',
    border: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--clr-text-2)',
    padding: '3px 6px',
    cursor: 'pointer',
  },
  fontBtnActive: {
    backgroundColor: 'var(--clr-primary)',
    color: 'var(--clr-tertiary)',
  },
  actionBtn: {
    background: 'none',
    border: '2px solid var(--clr-border-medium)',
    padding: '6px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--clr-text-1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s ease',
  },
  focusBtnActive: {
    backgroundColor: 'var(--clr-primary)',
    color: 'var(--clr-tertiary)',
    borderColor: 'var(--clr-border-strong)',
  },
  likedBtn: {
    borderColor: 'var(--clr-secondary)',
    color: 'var(--clr-secondary)',
    backgroundColor: 'var(--clr-danger-bg)',
  },
  bookmarkedBtn: {
    borderColor: 'var(--clr-border-strong)',
    color: 'var(--clr-border-strong)',
    backgroundColor: 'var(--clr-surface)',
  },
  shareBtnActive: {
    backgroundColor: 'var(--clr-primary)',
    color: 'var(--clr-tertiary)',
  },
  shareMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 180,
    backgroundColor: 'var(--clr-bg)',
    border: '2px solid var(--clr-border-strong)',
    boxShadow: '4px 4px 0px var(--clr-border-strong)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
  },
  shareMenuItem: {
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--clr-border-subtle)',
    padding: '10px 14px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--clr-text-1)',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'background-color 0.1s ease',
  },
  ownerToolbar: {
    padding: '12px 18px',
    border: '2px solid var(--clr-border-strong)',
    backgroundColor: 'var(--clr-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  ownerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--clr-text-2)',
  },
  coverFrame: {
    margin: '32px 0 40px',
    border: '2px solid var(--clr-border-strong)',
  },
  coverImg: {
    width: '100%',
    maxHeight: 460,
    objectFit: 'cover',
    display: 'block',
  },
  bodyContainer: {
    marginTop: 32,
  },
};
