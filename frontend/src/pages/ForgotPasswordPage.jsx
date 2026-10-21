import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { forgetPasswordApi } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgetPasswordApi({ email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch recovery code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={vAuth.rubric}>
          <span className="type-overline">INKFLOW</span>
          <span style={vAuth.rubricSlash}>/</span>
          <span style={vAuth.edition}>PASSWORD RECOVERY</span>
        </div>

        {sent ? (
          <div>
            <h1 className="auth-title">CODE DISPATCHED</h1>
            <p className="auth-subtitle" style={{ marginBottom: 20 }}>
              A 6-digit recovery code has been sent to <strong>{email}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to={`/reset-password?email=${encodeURIComponent(email)}`}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>ENTER OTP & RESET PASSWORD</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                to="/login"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ArrowLeft size={14} />
                <span>RETURN TO LOG IN</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="auth-title">FORGOT PASSWORD</h1>
            <p className="auth-subtitle">
              Enter your email address to receive a 6-digit password reset verification code.
            </p>

            <form onSubmit={handleSubmit}>
              {error && <div className="form-helper error" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">ACCOUNT EMAIL</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="YOU@EXAMPLE.COM"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
                id="forgot-submit-btn"
              >
                <span>{loading ? 'SENDING CODE…' : 'SEND RESET CODE'}</span>
                <ArrowRight size={15} />
              </button>

              <Link
                to="/login"
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
              >
                <ArrowLeft size={14} />
                <span>RETURN TO LOG IN</span>
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const vAuth = {
  rubric: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
};
