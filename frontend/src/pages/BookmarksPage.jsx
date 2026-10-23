import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { getMyBookmarksApi, toggleBookmarkApi } from '../api/bookmarks';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';

export default function BookmarksPage() {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkSet, setBookmarkSet] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyBookmarksApi();
        const data = res.data?.userBookmarks || [];
        const posts = data.map((b) => b.post || b);
        setBookmarks(posts.filter(Boolean));
        setBookmarkSet(new Set(posts.map((p) => p._id)));
      } catch {
        setBookmarks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBookmark = async (postId) => {
    try {
      await toggleBookmarkApi(postId);
      setBookmarkSet((prev) => {
        const next = new Set(prev);
        next.has(postId) ? next.delete(postId) : next.add(postId);
        return next;
      });
      setBookmarks((prev) =>
        prev.filter((p) => {
          if (bookmarkSet.has(postId)) return p._id !== postId;
          return true;
        })
      );
      toast('Bookmark updated');
    } catch {
      toast('Failed to update bookmark', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div className="container" style={{ paddingTop: 40 }}>
        {/* Header */}
        <div className="section-header">
          <div>
            <span className="type-overline">SAVED STORIES</span>
            <h1 className="section-title">BOOKMARKS</h1>
            <p style={{ color: 'var(--clr-text-2)', marginTop: 4, fontSize: '0.9rem' }}>
              {bookmarks.length} SAVED POST{bookmarks.length === 1 ? '' : 'S'} IN YOUR PERSONAL READING LIST.
            </p>
          </div>
          <Link to="/" className="btn btn-secondary btn-sm">
            <Compass size={14} />
            <span>EXPLORE STORIES</span>
          </Link>
        </div>

        {/* Stories Grid */}
        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-state-title">YOUR BOOKMARKS ARE EMPTY</h2>
            <p className="empty-state-desc">
              When you discover compelling articles, click the bookmark icon on any post to save it for later.
            </p>
            <Link to="/" className="btn btn-primary btn-md">
              <span>EXPLORE LATEST STORIES</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="posts-grid" style={{ marginTop: 32 }}>
            {bookmarks.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={() => {}}
                onBookmark={() => handleBookmark(post._id)}
                isLiked={false}
                isBookmarked={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
