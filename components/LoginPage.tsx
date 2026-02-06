import React from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '48px auto', padding: 24 }}>
      <h1>FlowMap Learning</h1>
      <p>Đăng nhập để vào khu vực học sinh hoặc giáo viên.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/student')} type="button">
          Vào trang học sinh
        </button>
        <button onClick={() => navigate('/teacher')} type="button">
          Vào trang giáo viên
        </button>
      </div>
    </main>
  );
}
