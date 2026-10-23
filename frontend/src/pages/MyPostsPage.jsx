import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, Eye, EyeOff, BookOpen, Calendar } from 'lucide-react';
import { getMyPostsApi, deletePostApi, togglePublishApi } from '../api/posts';
import { useToast } from '../components/Toast';
import Loader from '../components/Loader';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export default function MyPostsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPosts = async () => {
    try {
      const res = await getMyPostsApi();
      setPosts(Array.isArray(res.data?.post) ? res.data.post : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post permanently?')) return;
    try {
      await deletePostApi(id);
      toast('Post deleted successfully');
      setPosts((p) => p.filter((post) => post._id !== id));
    } catch {
      toast('Delete failed', 'error');
    }
  };

  const handleTogglePublish = async (post) => {
    try {
      await togglePublishApi(post._id);
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, published: !p.published } : p))
      );
      toast(`Post is now ${!post.published ? 'published live' : 'saved as draft'}`);
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  if (loading) return <Loader />;

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div className="container" style={{ paddingTop: 40 }}>
        {/* Header */}
        <div className="section-header">
          <div>
            <span className="type-overline">DASHBOARD</span>
            <h1 className="section-title">MY POSTS</h1>
            <p style={{ color: 'var(--clr-text-2)', marginTop: 4, fontSize: '0.9rem' }}>
              Manage, edit, publish, and track all your written articles.
            </p>
          </div>
          <Link to="/create-post" className="btn btn-primary" id="create-post-top-btn">
            <Plus size={15} />
            <span>WRITE NEW POST</span>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div style={vmp.metricsGrid}>
          <div style={vmp.metricBox}>
            <span style={vmp.metricLabel}>TOTAL POSTS</span>
            <span style={vmp.metricNumber}>{posts.length}</span>
          </div>
          <div style={vmp.metricBox}>
            <span style={vmp.metricLabel}>LIVE & PUBLISHED</span>
            <span style={{ ...vmp.metricNumber, color: 'var(--clr-success)' }}>{publishedCount}</span>
          </div>
          <div style={vmp.metricBox}>
            <span style={vmp.metricLabel}>DRAFTS IN PROGRESS</span>
            <span style={{ ...vmp.metricNumber, color: 'var(--clr-warning)' }}>{draftCount}</span>
          </div>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">NO POSTS WRITTEN YET</h2>
            <p className="empty-state-desc">
              Your dashboard is clean. Click below to craft and publish your first article.
            </p>
            <Link to="/create-post" className="btn btn-primary">
              <Plus size={15} />
              <span>START WRITING</span>
            </Link>
          </div>
        ) : (
          <div style={vmp.listContainer}>
            {posts.map((post) => {
              const coverUrl = post.coverImage?.url || post.coverImage;
              return (
                <div key={post._id} style={vmp.storyCard} className="myposts-story-card">
                  {coverUrl && (
                    <div style={vmp.thumbWrap} className="myposts-thumb-wrap">
                      <img src={coverUrl} alt={post.title} style={vmp.thumb} />
                    </div>
                  )}

                  <div style={vmp.cardBody} className="myposts-card-body">
                    <div style={vmp.statusRow}>
                      {post.published ? (
                        <span className="badge badge-green">LIVE</span>
                      ) : (
                        <span className="badge badge-yellow">DRAFT</span>
                      )}
                      <span style={vmp.dateSpan}>
                        <Calendar size={11} />
                        <span>{formatDate(post.createdAt)}</span>
                      </span>
                    </div>

                    <Link to={`/posts/${post._id}`} style={{ textDecoration: 'none' }} className="myposts-title-link">
                      <h3 style={vmp.title} className="myposts-title">{post.title}</h3>
                    </Link>

                    <p style={vmp.excerpt} className="myposts-excerpt">
                      {post.content?.slice(0, 160)}…
                    </p>

                    <div style={vmp.actionRow} className="myposts-action-row">
                      <Link to={`/posts/${post._id}`} className="btn btn-secondary btn-sm">
                        <BookOpen size={13} />
                        <span>VIEW</span>
                      </Link>
                      <Link to={`/edit-post/${post._id}`} className="btn btn-secondary btn-sm">
                        <Edit3 size={13} />
                        <span>EDIT</span>
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTogglePublish(post)}
                      >
                        {post.published ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{post.published ? 'SET DRAFT' : 'PUBLISH'}</span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(post._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const vmp = {
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
    marginBottom: 40,
  },
  metricBox: {
    padding: '24px',
    backgroundColor: 'var(--clr-bg)',
    border: '2px solid var(--clr-border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  metricLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--clr-text-2)',
  },
  metricNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.5rem',
    color: 'var(--clr-text-1)',
    lineHeight: 1,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  storyCard: {
    display: 'flex',
    border: '2px solid var(--clr-border-subtle)',
    backgroundColor: 'var(--clr-bg)',
    flexWrap: 'wrap',
    transition: 'border-color 0.15s ease',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  thumbWrap: {
    width: 220,
    minHeight: 160,
    flexShrink: 0,
    borderRight: '2px solid var(--clr-border-subtle)',
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'grayscale(15%)',
  },
  cardBody: {
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  dateSpan: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--clr-text-3)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.35rem',
    letterSpacing: '-0.015em',
    color: 'var(--clr-text-1)',
    lineHeight: 1.25,
  },
  excerpt: {
    fontSize: '0.925rem',
    color: 'var(--clr-text-2)',
    lineHeight: 1.6,
    margin: 0,
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
};
