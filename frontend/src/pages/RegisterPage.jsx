import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { signupApi, verifyEmailApi } from '../api/auth';
import { useToast } from '../components/Toast';

const STEPS = { REGISTER: 'register', OTP: 'otp' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(STEPS.REGISTER);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signupApi(form);
      setSuccess('6-digit verification code dispatched to your email');
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmailApi({ email: form.email, otp });
      toast('Email verified successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code');
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
          <span style={vAuth.edition}>NEW WRITER ACCOUNT</span>
        </div>

        {step === STEPS.REGISTER ? (
          <>
            <h1 className="auth-title">CREATE AN ACCOUNT</h1>
            <p className="auth-subtitle">Join InkFlow to read, write, and share your stories with the community.</p>

            <form onSubmit={handleRegister}>
              {error && <div className="form-helper error" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">FULL NAME</label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="E.G. ALEX JOHNSON"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">EMAIL ADDRESS</label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="YOU@EXAMPLE.COM"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="MINIMUM 6 CHARACTERS"
                    value={form.password}
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

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 12 }}
                disabled={loading}
                id="register-submit-btn"
              >
                <span>{loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">VERIFY YOUR EMAIL</h1>
            <p className="auth-subtitle">
              We sent a 6-digit verification code to <strong>{form.email}</strong>.
            </p>

            <form onSubmit={handleVerify}>
              {success && <div className="success-msg" style={{ marginBottom: 16 }}>{success}</div>}
              {error && <div className="form-helper error" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="otp-input" style={{ textAlign: 'center' }}>
                  6-DIGIT VERIFICATION CODE
                </label>
                <input
                  id="otp-input"
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  style={{
                    letterSpacing: '0.3em',
                    fontSize: '1.4rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textAlign: 'center',
                    height: 52,
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
                id="otp-submit-btn"
              >
                <span>{loading ? 'VERIFYING…' : 'VERIFY & COMPLETE'}</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
                onClick={() => { setStep(STEPS.REGISTER); setError(''); setSuccess(''); }}
              >
                <ArrowLeft size={14} />
                <span>EDIT REGISTRATION DETAILS</span>
              </button>
            </form>
          </>
        )}

        <div className="auth-footer">
          ALREADY HAVE AN ACCOUNT? <br />
          <Link to="/login" style={{ marginTop: 6, display: 'inline-block' }}>
            LOG IN HERE →
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
