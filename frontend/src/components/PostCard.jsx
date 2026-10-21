import { Link } from 'react-router-dom';
import { Heart, Bookmark, ArrowUpRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

function truncate(str, n = 140) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function calculateReadingTime(content) {
  if (!content) return '1 MIN READ';
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} MIN READ`;
}

export default function PostCard({ post, onLike, onBookmark, isLiked, isBookmarked, featured = false }) {
  const authorName = post?.author?.name || 'Anonymous';
  const authorInitial = authorName[0]?.toUpperCase() || 'U';
  const coverUrl = post?.coverImage?.url || post?.coverImage;
  const authorAvatarUrl = post?.author?.profileImage?.url || post?.author?.profileImage;

  return (
    <article
      style={{
        ...vc.card,
        ...(featured ? vc.featuredCard : {}),
      }}
      className="card"
    >
      {/* Cover Image Frame */}
      {coverUrl && (
        <Link to={`/posts/${post._id}`} style={vc.imageLink}>
          <img
            src={coverUrl}
            alt={post.title}
            style={vc.image}
            loading="lazy"
          />
        </Link>
      )}

      <div style={vc.body}>
        {/* Overline Rubric */}
        <div style={vc.rubricRow}>
          <span className="type-overline" style={{ color: 'var(--clr-secondary)' }}>STORY</span>
          <span style={vc.dot}>/</span>
          <span style={vc.readingTime}>{calculateReadingTime(post?.content)}</span>
          {!post?.published && (
            <span className="status-chip warning" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '9px' }}>DRAFT</span>
          )}
        </div>

        {/* Archivo Black Headline */}
        <Link to={`/posts/${post._id}`} style={vc.titleLink}>
          <h3 style={vc.title}>{post?.title}</h3>
        </Link>

        {/* Excerpt */}
        <p style={vc.excerpt}>{truncate(post?.content)}</p>

        {/* Editorial Byline & Action Footer */}
        <div style={vc.footer}>
          <div style={vc.author}>
            {authorAvatarUrl ? (
              <img
                src={authorAvatarUrl}
                alt={authorName}
                className="avatar"
                style={{ width: 28, height: 28 }}
              />
            ) : (
              <div style={vc.authorPlaceholder}>{authorInitial}</div>
            )}
            <div style={vc.authorMeta}>
              <span style={vc.authorName}>{authorName}</span>
              <span style={vc.date}>{formatDate(post?.createdAt)}</span>
            </div>
          </div>

          <div style={vc.actions}>
            {onLike && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike(); }}
                style={{
                  ...vc.iconBtn,
                  ...(isLiked ? vc.likedBtn : {}),
                }}
                title={isLiked ? 'Unlike' : 'Like'}
                aria-label="Like post"
              >
                <Heart size={14} fill={isLiked ? '#EF4444' : 'none'} />
                <span style={vc.count}>{post?.likeCount ?? 0}</span>
              </button>
            )}

            {onBookmark && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(); }}
                style={{
                  ...vc.iconBtn,
                  ...(isBookmarked ? vc.bookmarkedBtn : {}),
                }}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                aria-label="Bookmark post"
              >
                <Bookmark size={14} fill={isBookmarked ? 'var(--clr-border-strong)' : 'none'} />
              </button>
            )}

            <Link to={`/posts/${post._id}`} style={vc.readBtn} title="Read article">
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

const vc = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 0,
    backgroundColor: 'var(--clr-bg)',
    border: '2px solid var(--clr-border-medium)',
    transition: 'border-color 0.15s ease',
  },
  featuredCard: {
    borderTop: '4px solid var(--clr-secondary)',
  },
  imageLink: {
    display: 'block',
    borderBottom: '2px solid var(--clr-border-strong)',
    overflow: 'hidden',
    maxHeight: 220,
  },
  image: {
    width: '100%',
    height: 220,
    objectFit: 'cover',
  },
  body: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  rubricRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    color: 'var(--clr-border-medium)',
    fontSize: '11px',
  },
  readingTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--clr-text-3)',
    fontWeight: 700,
  },
  titleLink: {
    textDecoration: 'none',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    lineHeight: 1.25,
    letterSpacing: '-0.015em',
    color: 'var(--clr-text-1)',
    marginBottom: 12,
    transition: 'color 0.15s ease',
  },
  excerpt: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    lineHeight: 1.65,
    color: 'var(--clr-text-2)',
    marginBottom: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTop: '1px solid var(--clr-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  authorPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: '9999px',
    backgroundColor: 'var(--clr-border-strong)',
    color: 'var(--clr-bg)',
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  authorName: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--clr-text-1)',
    letterSpacing: '0.02em',
  },
  date: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--clr-text-3)',
    letterSpacing: '0.02em',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    background: 'none',
    border: '2px solid var(--clr-border-medium)',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: 'var(--clr-text-2)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  count: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
  },
  likedBtn: {
    borderColor: 'var(--clr-secondary)',
    color: 'var(--clr-secondary)',
  },
  bookmarkedBtn: {
    borderColor: 'var(--clr-border-strong)',
    color: 'var(--clr-border-strong)',
  },
  readBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    border: '2px solid var(--clr-border-strong)',
    color: 'var(--clr-text-1)',
    transition: 'all 0.15s ease',
  },
};
