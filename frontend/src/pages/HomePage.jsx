import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, PenLine } from 'lucide-react';
import { getAllPostsApi } from '../api/posts';
import { toggleLikeApi } from '../api/likes';
import { toggleBookmarkApi, getMyBookmarksApi } from '../api/bookmarks';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const [likedSet, setLikedSet] = useState(new Set());
  const [bookmarkSet, setBookmarkSet] = useState(new Set());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllPostsApi({
        page,
        limit: 9,
        search: search || undefined,
        sort,
      });

      const list = Array.isArray(res.data?.allPost)
        ? res.data.allPost
        : Array.isArray(res.data?.posts)
          ? res.data.posts
          : [];

      const pagination = res.data?.pagination || {};
      setPosts(list);
      setTotalPages(pagination.totalPage || 1);
      setTotalPosts(pagination.totalPost || list.length);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (user) {
      getMyBookmarksApi()
        .then((res) => {
          const list = res.data?.userBookmarks || [];
          setBookmarkSet(new Set(list.map((b) => b.post?._id || b.post || b._id)));
        })
        .catch(() => { });
    }
  }, [user]);

  const handleLike = async (postId) => {
    if (!user) {
      toast('Please log in to like this story', 'warning');
      return;
    }
    const wasLiked = likedSet.has(postId);
    setLikedSet((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts((current) =>
      current.map((p) =>
        p._id === postId
          ? { ...p, likeCount: Math.max(0, (p.likeCount ?? 0) + (wasLiked ? -1 : 1)) }
          : p
      )
    );

    try {
      await toggleLikeApi(postId);
    } catch {
      // Revert if API failed
      setLikedSet((prev) => {
        const next = new Set(prev);
        wasLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setPosts((current) =>
        current.map((p) =>
          p._id === postId
            ? { ...p, likeCount: Math.max(0, (p.likeCount ?? 0) + (wasLiked ? 1 : -1)) }
            : p
        )
      );
      toast('Failed to update reaction', 'error');
    }
  };

  const handleBookmark = async (postId) => {
    if (!user) {
      toast('Please log in to bookmark this story', 'warning');
      return;
    }
    const wasSaved = bookmarkSet.has(postId);
    setBookmarkSet((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(postId) : next.add(postId);
      return next;
    });
    toast(wasSaved ? 'Removed from bookmarks' : 'Story saved to bookmarks');

    try {
      await toggleBookmarkApi(postId);
    } catch {
      // Revert if API failed
      setBookmarkSet((prev) => {
        const next = new Set(prev);
        wasSaved ? next.add(postId) : next.delete(postId);
        return next;
      });
      toast('Failed to update bookmark', 'error');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const leadStory = posts[0];
  const sideStories = posts.slice(1, 4);

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* =================================================================
          LOGGED IN VIEW: DIRECT STORIES FEED (NO LANDING HERO)
          Per user request: "no need to show landing page after login bcz i feel its no use"
          ================================================================= */}
      {user ? (
        <section style={hp.authHeaderSection}>
          <div className="container">
            <div style={hp.authHeaderTop}>
              <div>
                <div style={hp.rubricLine}>
                  <span className="type-overline" style={{ color: 'var(--clr-secondary)' }}>INKFLOW</span>
                  <span style={hp.rubricSlash}>/</span>
                  <span className="type-overline">DISPATCH FEED</span>
                </div>
                <h1 style={hp.authHeaderTitle}>STORIES & PERSPECTIVES</h1>
                <p style={hp.authHeaderSub}>
                  Welcome back, <strong style={{ color: 'var(--clr-text-1)' }}>{user.name || 'Writer'}</strong>. Browse the latest community articles or publish your ideas.
                </p>
              </div>

              <div style={hp.authHeaderActions}>
                <Link to="/create-post" className="btn btn-primary btn-md" id="feed-write-btn">
                  <PenLine size={14} />
                  <span>+ WRITE POST</span>
                </Link>
                <Link to="/my-posts" className="btn btn-secondary btn-md">
                  <span>MY STORIES</span>
                </Link>
                <Link to="/bookmarks" className="btn btn-secondary btn-md">
                  <span>BOOKMARKS</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* =================================================================
           GUEST / LOGGED-OUT VIEW: BOLD EDITORIAL MAGAZINE LANDING HERO
           ================================================================= */
        <section style={hp.heroSection}>
          <div className="container">
            <div style={hp.heroGrid} className="home-hero-grid">
              {/* Lead Article Spread */}
              <div style={hp.mainHero}>
                <div style={hp.rubricLine}>
                  <span className="type-overline" style={{ color: 'var(--clr-secondary)' }}>FEATURED PUBLICATION</span>
                  <span style={hp.rubricSlash}>/</span>
                  <span className="type-overline">INKFLOW HIGHLIGHT</span>
                </div>

                <Link to={leadStory ? `/posts/${leadStory._id}` : '/register'} style={{ textDecoration: 'none' }}>
                  <h1 className="type-display" style={hp.heroTitle}>
                    {leadStory?.title || 'STORIES, PERSPECTIVES & IDEAS THAT SHAPE CULTURE.'}
                  </h1>
                </Link>

                <blockquote className="pull-quote" style={{ margin: '24px 0' }}>
                  &ldquo;InkFlow is an editorial blogging platform crafted for thoughtful writers, developers, and thinkers to share knowledge and spark conversation.&rdquo;
                </blockquote>

                <div style={hp.heroMetaRow}>
                  <div style={hp.heroAuthor}>
                    <span className="type-overline" style={{ color: 'var(--clr-text-2)' }}>JOIN THE INKFLOW WRITERS COMMUNITY</span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn btn-primary btn-md" id="landing-signup-btn">
                      <span>START WRITING</span>
                      <ArrowRight size={14} />
                    </Link>
                    <Link to="/login" className="btn btn-secondary btn-md" id="landing-login-btn">
                      <span>SIGN IN</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Side Column: Trending Articles */}
              <div style={hp.sideColumn} className="home-side-column">
                <div style={hp.sideHeader}>
                  <span style={hp.sideHeaderTitle}>TOP COMMUNITY STORIES</span>
                  <div style={hp.sideHeaderDot} />
                </div>

                {sideStories.length === 0 ? (
                  <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', fontStyle: 'italic' }}>
                    Publish articles to see them featured here in the top stories lineup.
                  </p>
                ) : (
                  <div style={hp.sideList}>
                    {sideStories.map((story, idx) => (
                      <article key={story._id} style={hp.sideItem}>
                        <span style={hp.sideNumber}>0{idx + 1}</span>
                        <div style={hp.sideContent}>
                          <Link to={`/posts/${story._id}`} style={{ textDecoration: 'none' }} className="home-side-link">
                            <h4 style={hp.sideTitle} className="home-side-title">{story.title}</h4>
                          </Link>
                          <span style={hp.sideAuthor}>BY {story.author?.name?.toUpperCase() || 'CONTRIBUTOR'}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================
          FEED TOOLBAR: SEARCH & SORT
          ================================================================= */}
      <section id="explore" style={hp.filterSection}>
        <div className="container">
          <div style={hp.filterRow}>
            <div style={hp.rubricLine}>
              <span className="type-overline" style={{ color: 'var(--clr-secondary)' }}>DISPATCHES</span>
              <span style={hp.rubricSlash}>/</span>
              <span className="type-overline">EXPLORE ARCHIVE</span>
            </div>

            <div style={hp.searchBox} className="home-search-box">
              <Search size={14} style={{ color: 'var(--clr-text-2)', flexShrink: 0 }} />
              <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
                <input
                  type="text"
                  placeholder="SEARCH STORIES..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={hp.searchInput}
                  className="home-search-input"
                  id="home-search-input"
                />
              </form>
            </div>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              style={hp.sortSelect}
              id="home-sort-select"
            >
              <option value="latest">LATEST</option>
              <option value="oldest">OLDEST</option>
            </select>
          </div>
        </div>
      </section>

      {/* =================================================================
          STORIES GRID & FEED
          ================================================================= */}
      <section style={{ marginTop: 40 }}>
        <div className="container">
          <div style={hp.feedHeader}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 className="type-headline" style={{ color: 'var(--clr-text-1)' }}>
                ALL STORIES
              </h2>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--clr-text-3)', fontWeight: 700 }}>
                // {totalPosts} {totalPosts === 1 ? 'PIECE' : 'PIECES'}
              </span>
            </div>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--clr-text-3)', fontWeight: 700 }}>
              PAGE {page} OF {totalPages}
            </span>
          </div>

          {loading ? (
            <Loader fullPage={false} />
          ) : posts.length === 0 ? (
            <div className="card" style={{ padding: '60px 40px', textAlign: 'center', border: '2px solid var(--clr-border-strong)' }}>
              <h3 className="type-headline" style={{ marginBottom: 12 }}>NO STORIES FOUND</h3>
              <p style={{ color: 'var(--clr-text-2)', maxWidth: 440, margin: '0 auto 24px' }}>
                {search ? `No published stories matching query "${search}".` : 'Be the first to publish an article on InkFlow.'}
              </p>
              {user && (
                <Link to="/create-post" className="btn btn-primary btn-md">
                  + WRITE FIRST POST
                </Link>
              )}
            </div>
          ) : (
            <div style={hp.postGrid} className="home-post-grid">
              {posts.map((post, idx) => (
                <PostCard
                  key={post._id}
                  post={post}
                  featured={idx === 0}
                  onLike={() => handleLike(post._id)}
                  onBookmark={() => handleBookmark(post._id)}
                  isLiked={likedSet.has(post._id)}
                  isBookmarked={bookmarkSet.has(post._id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                id="pagination-prev"
              >
                ← PREV
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    className={`pagination-btn ${page === pg ? 'active' : ''}`}
                    onClick={() => setPage(pg)}
                    id={`pagination-page-${pg}`}
                  >
                    0{pg}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                id="pagination-next"
              >
                NEXT →
              </button>
            </div>
          )}
        </div>
      </section>


      {/* =================================================================
          CALL TO ACTION BANNER: START WRITING & PUBLISH
          ================================================================= */}
      <section style={{ marginTop: 64 }}>
        <div className="container">
          <div style={hp.ctaBanner} className="home-cta-banner">
            <div style={{ maxWidth: 640 }}>
              <div style={hp.rubricLine}>
                <span className="type-overline" style={{ color: 'var(--clr-secondary)' }}>
                  {user ? 'WRITER STUDIO' : 'INKFLOW COMMUNITY'}
                </span>
                <span style={hp.rubricSlash}>/</span>
                <span className="type-overline">SHARE YOUR VOICE</span>
              </div>
              <h3 style={hp.ctaTitle}>
                {user
                  ? 'HAVE A PERSPECTIVE OR STORY TO SHARE?'
                  : 'READY TO SHARE YOUR STORY WITH THE WORLD?'}
              </h3>
              <p style={hp.ctaDesc}>
                {user
                  ? 'Publish your latest thoughts, technical tutorials, and creative essays directly to the InkFlow community feed.'
                  : 'Join thoughtful writers and readers on InkFlow. Write markdown essays, interact with authors, and build your publication archive.'}
              </p>
            </div>

            <div style={hp.ctaActions} className="home-cta-actions">
              {user ? (
                <>
                  <Link to="/create-post" className="btn btn-primary btn-lg" id="cta-write-post-btn">
                    <PenLine size={15} />
                    <span>WRITE NEW POST</span>
                  </Link>
                  <Link to="/my-posts" className="btn btn-secondary btn-lg" id="cta-my-posts-btn">
                    <span>MY STORIES</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg" id="cta-start-writing-btn">
                    <span>START WRITING TODAY</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg" id="cta-login-btn">
                    <span>SIGN IN</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          FOOTER
          ================================================================= */}
      <footer style={hp.footer}>
        <div className="container">
          <div style={hp.footerInner}>
            <div>
              <div style={hp.footerLogo}>
                <span>INKFLOW</span>
                <span style={hp.footerDot}>.</span>
              </div>
              <p style={hp.footerDesc}>
                A high-contrast editorial publishing platform for opinion blogs, technical essays, and cultural commentary.
              </p>
            </div>

            <div style={hp.footerLinks}>
              <Link to="/" style={hp.footerLink}>HOME</Link>
              <a href="#explore" style={hp.footerLink}>EXPLORE</a>
              <Link to="/login" style={hp.footerLink}>LOG IN</Link>
              <Link to="/register" style={hp.footerLink}>SIGN UP</Link>
            </div>
          </div>

          <div style={hp.footerBottom}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--clr-text-3)' }}>
              © {new Date().getFullYear()} INKFLOW. ALL RIGHTS RESERVED.
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--clr-text-3)' }}>
              DESIGN SYSTEM // VOICEBOX EDITORIAL SPEC
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const hp = {
  authHeaderSection: {
    padding: '36px 0 28px',
    borderBottom: '2px solid var(--clr-border-strong)',
    backgroundColor: 'var(--clr-surface)',
  },
  authHeaderTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
  },
  authHeaderTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
    letterSpacing: '-0.02em',
    color: 'var(--clr-text-1)',
    marginTop: 6,
    marginBottom: 6,
  },
  authHeaderSub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.95rem',
    color: 'var(--clr-text-2)',
  },
  authHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroSection: {
    padding: '48px 0 40px',
    borderBottom: '2px solid var(--clr-border-strong)',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: 48,
    alignItems: 'start',
  },
  mainHero: {
    display: 'flex',
    flexDirection: 'column',
  },
  rubricLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  rubricSlash: {
    color: 'var(--clr-border-medium)',
    fontWeight: 700,
  },
  heroTitle: {
    color: 'var(--clr-text-1)',
    transition: 'color 0.15s ease',
  },
  heroMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTop: '2px solid var(--clr-border-strong)',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--clr-text-1)',
  },
  sideColumn: {
    borderLeft: '2px solid var(--clr-border-subtle)',
    paddingLeft: 40,
    display: 'flex',
    flexDirection: 'column',
  },
  sideHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottom: '2px solid var(--clr-border-strong)',
    marginBottom: 20,
  },
  sideHeaderTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--clr-text-1)',
  },
  sideHeaderDot: {
    width: 6,
    height: 6,
    backgroundColor: 'var(--clr-secondary)',
  },
  sideList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  sideItem: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    paddingBottom: 20,
    borderBottom: '1px solid var(--clr-border-subtle)',
  },
  sideNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    color: 'var(--clr-secondary)',
    lineHeight: 1,
  },
  sideContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sideTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    color: 'var(--clr-text-1)',
  },
  sideAuthor: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--clr-text-3)',
    fontWeight: 700,
    marginTop: 4,
  },
  filterSection: {
    padding: '16px 0',
    borderBottom: '1px solid var(--clr-border-subtle)',
    backgroundColor: 'var(--clr-surface)',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  filterChips: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  searchBox: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '2px solid var(--clr-border-medium)',
    backgroundColor: 'var(--clr-bg)',
    padding: '6px 12px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--clr-text-1)',
    width: 180,
  },
  sortSelect: {
    height: 38,
    padding: '0 12px',
    backgroundColor: 'var(--clr-bg)',
    border: '2px solid var(--clr-border-medium)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--clr-text-1)',
    outline: 'none',
    cursor: 'pointer',
  },
  feedHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottom: '2px solid var(--clr-border-strong)',
    marginBottom: 32,
  },
  postGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 24,
  },
  ctaBanner: {
    border: '2px solid var(--clr-border-strong)',
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 32,
    backgroundColor: 'var(--clr-surface)',
    boxShadow: '4px 4px 0px var(--clr-border-strong)',
  },
  ctaTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.65rem',
    letterSpacing: '-0.02em',
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 1.15,
  },
  ctaDesc: {
    fontSize: '0.925rem',
    color: 'var(--clr-text-2)',
    lineHeight: 1.6,
  },
  ctaActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  footer: {
    marginTop: 80,
    borderTop: '2px solid var(--clr-border-strong)',
    backgroundColor: 'var(--clr-surface)',
    paddingTop: 48,
  },
  footerInner: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 40,
    flexWrap: 'wrap',
    paddingBottom: 40,
  },
  footerLogo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    letterSpacing: '-0.04em',
    color: 'var(--clr-text-1)',
    display: 'flex',
    alignItems: 'baseline',
  },
  footerDot: {
    display: 'inline-block',
    width: 6,
    height: 6,
    backgroundColor: 'var(--clr-secondary)',
    marginLeft: 2,
  },
  footerDesc: {
    fontSize: '0.875rem',
    color: 'var(--clr-text-2)',
    maxWidth: 380,
    marginTop: 8,
    lineHeight: 1.6,
  },
  footerLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  footerLink: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--clr-text-1)',
    textTransform: 'uppercase',
  },
  footerBottom: {
    borderTop: '1px solid var(--clr-border-subtle)',
    padding: '20px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
};
