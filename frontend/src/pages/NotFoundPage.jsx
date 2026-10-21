import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={vnf.page}>
      <div style={vnf.card}>
        <div style={vnf.rubric}>
          <span className="type-overline">ERROR 404</span>
          <span style={vnf.rubricSlash}>/</span>
          <span style={vnf.edition}>PAGE NOT FOUND</span>
        </div>

        <h1 className="type-display" style={vnf.title}>
          PAGE NOT FOUND.
        </h1>

        <p style={vnf.desc}>
          The page or article you are looking for doesn&apos;t exist, has been removed, or was moved to another URL.
        </p>

        <div style={vnf.actions}>
          <Link to="/" className="btn btn-primary btn-md" id="not-found-home-btn">
            <ArrowLeft size={14} />
            <span>RETURN TO HOME</span>
          </Link>
          <Link to="/#explore" className="btn btn-secondary btn-md">
            <Compass size={14} />
            <span>EXPLORE STORIES</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const vnf = {
  page: {
    minHeight: '75vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    backgroundColor: 'var(--clr-bg)',
  },
  card: {
    maxWidth: 580,
    width: '100%',
    padding: '48px 40px',
    border: '2px solid var(--clr-border-strong)',
    borderTop: '6px solid var(--clr-secondary)',
    backgroundColor: 'var(--clr-bg)',
    textAlign: 'left',
  },
  rubric: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rubricSlash: {
    color: 'var(--clr-border-medium)',
    fontWeight: 700,
  },
  edition: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--clr-text-3)',
    fontWeight: 700,
  },
  title: {
    lineHeight: 1.05,
    marginBottom: 16,
    color: 'var(--clr-text-1)',
  },
  desc: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1rem',
    lineHeight: 1.65,
    color: 'var(--clr-text-2)',
    marginBottom: 32,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
};
