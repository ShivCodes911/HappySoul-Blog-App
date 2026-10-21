import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(form);
      if (res.data?.token) {
        localStorage.setItem('accessToken', res.data.token);
      }
      login(res.data?.user);
      toast('Welcome back to InkFlow');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Rubric Header */}
        <div style={vAuth.rubric}>
          <span className="type-overline">INKFLOW</span>
          <span style={vAuth.rubricSlash}>/</span>
          <span style={vAuth.edition}>WRITER PORTAL</span>
        </div>

        <h1 className="auth-title">LOG IN TO INKFLOW</h1>
        <p className="auth-subtitle">Welcome back. Enter your credentials to access your blog.</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-helper error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">EMAIL ADDRESS</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className={`form-input ${error ? 'is-error' : ''}`}
              placeholder="YOU@EXAMPLE.COM"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">PASSWORD</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--clr-text-2)', textTransform: 'uppercase', textDecoration: 'underline' }}
              >
                FORGOT PASSWORD?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: 40 }}
                required
                autoComplete="current-password"
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

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 12 }}
            disabled={loading}
            id="login-submit-btn"
          >
            <span>{loading ? 'AUTHENTICATING…' : 'LOG IN'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="auth-footer">
          DON&apos;T HAVE AN ACCOUNT YET? <br />
          <Link to="/register" style={{ marginTop: 6, display: 'inline-block' }}>
            CREATE INKFLOW ACCOUNT →
          </Link>
        </div>
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
