import { useState } from 'react';

export default function Auth({ onSignIn, onSignUp, error: externalError }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error: authError } = isSignUp
      ? await onSignUp(trimmedEmail, password)
      : await onSignIn(trimmedEmail, password);

    if (authError) {
      setError(authError.message);
    } else if (isSignUp) {
      setSignUpSuccess(true);
    }
    setLoading(false);
  };

  if (signUpSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">TaskFlow</h1>
          <div className="auth-success">
            <p>Check your email for a confirmation link!</p>
            <button
              className="btn btn-primary auth-btn"
              onClick={() => {
                setSignUpSuccess(false);
                setIsSignUp(false);
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">TaskFlow</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Create your account' : 'Sign in to sync your tasks'}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {(error || externalError) && (
            <div className="auth-error" role="alert">
              {error || externalError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
          <button
            className="auth-toggle-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
