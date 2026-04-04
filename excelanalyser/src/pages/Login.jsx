import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import "./Login.css";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = isRegister 
      ? await signup(email, password)
      : await login(email, password);

    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Something went wrong');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Google login failed');
    }
  };

  return (
    <section>
      {/* Background grid */}
      {[...Array(120)].map((_, i) => (
        <span key={i}></span>
      ))}

      {/* Login Form */}
      {!isRegister && (
        <div className="signin">
          <div className="content">
            <h2>Sign In</h2>

            <form className="form" onSubmit={handleSubmit}>
              <div className="inputBox">
                <input 
                  type="email" 
                  required 
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <i>Email</i>
              </div>

              <div className="inputBox">
                <input 
                  type="password" 
                  required 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i>Password</i>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="button" onClick={handleGoogleLogin} disabled={loading} className="google-btn">
                {loading ? 'Loading...' : 'Continue with Google'}
              </button>

              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
              </button>

              <div className="links">
                <button type="button" onClick={() => setIsRegister(!isRegister)}>
                  {isRegister ? 'Have account? Sign In' : "Don't have account? Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Form */}
      {isRegister && (
        <div className="signin">
          <div className="content">
            <h2>Register</h2>

            <form className="form" onSubmit={handleSubmit}>
              <div className="inputBox">
                <input 
                  type="email" 
                  required 
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <i>Email</i>
              </div>

              <div className="inputBox">
                <input 
                  type="password" 
                  required 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i>Password</i>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="button" onClick={handleGoogleLogin} disabled={loading} className="google-btn">
                {loading ? 'Loading...' : 'Continue with Google'}
              </button>

              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
              </button>

              <div className="links">
                <button type="button" onClick={() => setIsRegister(!isRegister)}>
                  {isRegister ? 'Have account? Sign In' : "Don't have account? Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Login;