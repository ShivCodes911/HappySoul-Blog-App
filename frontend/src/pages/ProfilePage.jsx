import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Lock, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
  updateMeApi, changePasswordApi, uploadProfileImageApi, 
  updateProfileImageApi, deleteUserApi 
} from '../api/auth';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await updateMeApi({ updatedName: name });
      setUser((prev) => ({ ...prev, name }));
      toast('Display name updated successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwError('');
    setSavingPw(true);
    try {
      await changePasswordApi({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Password update failed');
    } finally {
      setSavingPw(false);
    }
  };

  const handleProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('profileImage', file);
    try {
      const fn = user?.profileImage ? updateProfileImageApi : uploadProfileImageApi;
      const res = await fn(fd);
      const imgObj = res.data?.profileImage;
      const newUrl = imgObj?.url || imgObj;
      if (newUrl) setUser((prev) => ({ ...prev, profileImage: newUrl }));
      toast('Profile picture updated successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Image upload failed. Check Cloudinary settings.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? All your posts, bookmarks, and comments will be permanently erased.')) return;
    setDeletingAccount(true);
    try {
      await deleteUserApi();
      await logout();
      navigate('/');
      toast('Account and all associated records deleted');
    } catch {
      toast('Delete failed', 'error');
      setDeletingAccount(false);
    }
  };

  const initials = (user?.name || 'U')[0].toUpperCase();

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div className="container" style={{ maxWidth: 760, paddingTop: 40 }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <span className="type-overline">ACCOUNT PREFERENCES</span>
          <h1 className="section-title">PROFILE & SETTINGS</h1>
          <p style={{ color: 'var(--clr-text-2)', marginTop: 4, fontSize: '0.9rem' }}>
            Manage your personal profile, display identity, and security credentials.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Section 1: Avatar */}
          <div className="card" style={vp.sectionCard}>
            <div style={vp.cardHeader}>
              <h2 style={vp.cardTitle}>PROFILE PICTURE</h2>
              <p style={vp.cardSub}>Your author avatar displayed on post bylines and comments</p>
            </div>

            <div style={vp.avatarRow}>
              <div style={vp.avatarWrap}>
                {user?.profileImage ? (
                  <img
                    src={user.profileImage?.url || user.profileImage}
                    alt="Profile"
                    className="avatar"
                    style={{ width: 80, height: 80 }}
                  />
                ) : (
                  <div style={vp.avatarFallback}>{initials}</div>
                )}
                <button
                  type="button"
                  style={vp.avatarTrigger}
                  className="avatar"
                  onClick={() => fileRef.current?.click()}
                  title="Upload picture"
                  disabled={uploadingAvatar}
                >
                  <Camera size={14} />
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'UPLOADING…' : 'CHANGE PICTURE'}
                </button>
                <div style={vp.avatarHint}>
                  Recommended: Square JPG or PNG, at least 400x400px.
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfileImage}
                id="avatar-input"
              />
            </div>
          </div>

          {/* Section 2: Display Name & Email */}
          <div className="card" style={vp.sectionCard}>
            <div style={vp.cardHeader}>
              <h2 style={vp.cardTitle}>PERSONAL DETAILS</h2>
              <p style={vp.cardSub}>Your public author name and registered email</p>
            </div>

            <form onSubmit={handleNameUpdate}>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">DISPLAY NAME</label>
                <div style={{ display: 'flex', gap: 12 }} className="profile-name-row">
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingName}
                    id="save-name-btn"
                  >
                    <Save size={13} />
                    <span>{savingName ? 'SAVING…' : 'SAVE'}</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">EMAIL ADDRESS</label>
                <div style={vp.readOnlyEmail}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{user?.email}</span>
                  <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
                    VERIFIED
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Section 3: Password */}
          <div className="card" style={vp.sectionCard}>
            <div style={vp.cardHeader}>
              <h2 style={vp.cardTitle}>SECURITY & PASSWORD</h2>
              <p style={vp.cardSub}>Update your password to keep your account safe</p>
            </div>

            <form onSubmit={handlePasswordChange}>
              {pwError && <div className="form-helper error" style={{ marginBottom: 16 }}>{pwError}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="current-password">CURRENT PASSWORD</label>
                <input
                  id="current-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">NEW PASSWORD</label>
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    placeholder="MIN 6 CHARACTERS"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-new-password">CONFIRM PASSWORD</label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    className="form-input"
                    placeholder="CONFIRM PASSWORD"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingPw}
                  id="save-pw-btn"
                >
                  <Lock size={13} />
                  <span>{savingPw ? 'UPDATING…' : 'UPDATE PASSWORD'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 4: Danger Zone */}
          <div className="card" style={{ ...vp.sectionCard, border: '2px solid var(--clr-secondary)' }}>
            <div style={vp.cardHeader}>
              <h2 style={{ ...vp.cardTitle, color: 'var(--clr-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} />
                <span>DANGER ZONE</span>
              </h2>
              <p style={vp.cardSub}>Permanently delete your account and all associated posts</p>
            </div>

            <div style={vp.dangerRow}>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>
                  DELETE ACCOUNT & DATA
                </div>
                <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: 2 }}>
                  Once deleted, your account cannot be recovered.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                id="delete-account-btn"
              >
                <Trash2 size={13} />
                <span>{deletingAccount ? 'DELETING…' : 'DELETE ACCOUNT'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const vp = {
  sectionCard: {
    padding: '32px',
    backgroundColor: 'var(--clr-bg)',
    border: '2px solid var(--clr-border-subtle)',
  },
  cardHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid var(--clr-border-subtle)',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    letterSpacing: '-0.01em',
    color: 'var(--clr-text-1)',
    textTransform: 'uppercase',
  },
  cardSub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    color: 'var(--clr-text-2)',
    marginTop: 4,
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  avatarWrap: {
    position: 'relative',
    display: 'inline-block',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: '9999px',
    backgroundColor: 'var(--clr-border-strong)',
    color: 'var(--clr-tertiary)',
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTrigger: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: '9999px',
    border: '2px solid var(--clr-border-strong)',
    backgroundColor: 'var(--clr-bg)',
    color: 'var(--clr-text-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  avatarHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--clr-text-3)',
    marginTop: 8,
  },
  readOnlyEmail: {
    padding: '10px 14px',
    border: '2px solid var(--clr-border-subtle)',
    backgroundColor: 'var(--clr-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'var(--clr-text-2)',
  },
  dangerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
};
