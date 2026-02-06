import React, { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_KEYWORDS = ['admin', 'teacher', 'giaovien', 'gv'];

function detectRole(username: string): 'admin' | 'student' {
  const normalized = username.trim().toLowerCase();
  return ADMIN_KEYWORDS.some((keyword) => normalized.includes(keyword)) ? 'admin' : 'student';
}

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    const role = detectRole(username);
    if (role === 'admin') {
      navigate('/admin');
      return;
    }

    navigate('/student');
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-row">
          <div className="brand-logo">F</div>
          <div>
            <p className="brand-name">FlowMAP</p>
            <p className="brand-sub">Path to A+ score</p>
          </div>
        </div>

        <h1>Chào mừng trở lại!</h1>
        <p className="auth-desc">Đăng nhập vào hệ thống để vào đúng khu vực theo vai trò.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="VD: admin_lop10 hoặc hocsinh_01"
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-btn">Đăng nhập</button>
        </form>

        <p className="auth-hint">
          * Tự động phân vai: username chứa <strong>admin/teacher/gv</strong> sẽ vào trang Admin (Giáo viên), còn lại vào trang học sinh.
        </p>
      </section>
    </main>
  );
}
