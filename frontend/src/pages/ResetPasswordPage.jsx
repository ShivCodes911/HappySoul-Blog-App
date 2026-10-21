import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { resetPasswordApi } from '../api/auth';
import { useToast } from '../components/Toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ 
    email: searchParams.get('email') || '', 
    otp: searchParams.get('token') || searchParams.get('otp') || '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordApi({ 
        email: form.email, 
        otp: form.otp, 
        newPassword: form.newPassword 
      });
      toast('Password reset successfully! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed — code may be invalid or expired');
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
          <span style={vAuth.edition}>PASSWORD RESET</span>
        </div>

        <h1 className="auth-title">RESET PASSWORD</h1>
        <p className="auth-subtitle">Verify your 6-digit OTP code and choose a new password.</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-helper error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="reset-email">ACCOUNT EMAIL</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="YOU@EXAMPLE.COM"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-otp">6-DIGIT VERIFICATION CODE</label>
            <input
              id="reset-otp"
              name="otp"
              type="text"
              className="form-input"
              placeholder="123456"
              maxLength={6}
              value={form.otp}
              onChange={handleChange}
              required
              style={{
                letterSpacing: '0.25em',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '1.2rem',
                textAlign: 'center',
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-new-password">NEW PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-new-password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="MINIMUM 6 CHARACTERS"
                value={form.newPassword}
                onChange={handleChange}
                style={{ paddingRight: 40 }}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={vAuth.eyeBtn}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm-password">CONFIRM PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="CONFIRM NEW PASSWORD"
                value={form.confirmPassword}
                onChange={handleChange}
                style={{ paddingRight: 40 }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
            id="reset-submit-btn"
          >
            <span>{loading ? 'UPDATING…' : 'UPDATE PASSWORD'}</span>
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
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--clr-text-2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
};
