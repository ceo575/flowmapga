import React, { useMemo, useState } from 'react';

const sidebarItems = [
  { key: 'home', label: 'Trang chủ' },
  { key: 'exams', label: 'Bài thi của tôi' },
  { key: 'practice', label: 'Luyện tập' },
  { key: 'profile', label: 'Hồ sơ cá nhân' },
] as const;

type StudentTab = typeof sidebarItems[number]['key'];

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<StudentTab>('home');

  const pageTitle = useMemo(
    () => sidebarItems.find((item) => item.key === activeTab)?.label ?? 'Trang học sinh',
    [activeTab]
  );

  return (
    <main className="dashboard-page">
      <aside className="sidebar student-sidebar">
        <h2>FlowMAP</h2>
        <p className="sidebar-caption">PATH TO A+ SCORE</p>

        <nav>
          {sidebarItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="dashboard-content">
        <header className="content-header">
          <h1>{pageTitle}</h1>
          <button type="button" className="ghost-btn">Thông báo</button>
        </header>

        {activeTab === 'home' && <StudentHome />}
        {activeTab === 'exams' && <StudentExams />}
        {activeTab === 'practice' && <StudentPractice />}
        {activeTab === 'profile' && <StudentProfile />}
      </section>
    </main>
  );
}

function StudentHome() {
  return (
    <div className="stack-grid">
      <article className="panel panel-highlight">
        <h3>Chào học sinh Chăm Chỉ!</h3>
        <p>Hôm nay bạn muốn vượt qua cột mốc nào?</p>
      </article>

      <article className="panel">
        <h3>Đề thi hôm nay</h3>
        <p>Toán 12 - Chuyên đề hàm số (45 phút)</p>
        <button type="button" className="primary-btn">Làm ngay</button>
      </article>

      <article className="panel">
        <h3>Tiến độ trong tuần</h3>
        <p>Hoàn thành 7/10 bài luyện tập.</p>
      </article>
    </div>
  );
}

function StudentExams() {
  const examList = [
    { name: 'Toán 12 • Vi phân', duration: '60 phút', level: 'Nâng cao' },
    { name: 'Đại số tuyến tính', duration: '45 phút', level: 'Cơ bản' },
    { name: 'Xác suất thống kê', duration: '90 phút', level: 'Luyện đề' },
  ];

  const history = [
    'Lần thi thử 1 đạt 7.8 điểm',
    'Nộp bài: Tập hợp và Logic',
    'Hoàn thành đề mục tiêu tuần 3',
    'Được gợi ý học phần phương trình lượng giác',
  ];

  return (
    <div className="two-col">
      <section className="panel">
        <h3>Đề thi của tôi</h3>
        <div className="exam-cards">
          {examList.map((exam) => (
            <article key={exam.name} className="exam-card">
              <p className="exam-title">{exam.name}</p>
              <p>{exam.duration}</p>
              <p className="badge">{exam.level}</p>
              <button type="button" className="ghost-btn">Vào đề cương</button>
            </article>
          ))}
        </div>

        <h4>Lịch sử làm bài</h4>
        <ul className="simple-list">
          {history.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <aside className="panel">
        <h3>Lịch làm đề</h3>
        <ul className="simple-list">
          <li>Thứ 2 - 19:00 • Toán nâng cao</li>
          <li>Thứ 4 - 20:00 • Luyện tốc độ</li>
          <li>Thứ 7 - 08:30 • Thi thử toàn phần</li>
        </ul>
        <button type="button" className="primary-btn">Bắt đầu ngay</button>
      </aside>
    </div>
  );
}

function StudentPractice() {
  return (
    <article className="panel">
      <h3>Luyện tập</h3>
      <p>Danh sách chuyên đề gợi ý theo điểm yếu:</p>
      <ul className="simple-list">
        <li>Giới hạn và liên tục • 12 câu</li>
        <li>Hình học không gian • 20 câu</li>
        <li>Xác suất có điều kiện • 15 câu</li>
      </ul>
    </article>
  );
}

function StudentProfile() {
  return (
    <article className="panel">
      <h3>Hồ sơ cá nhân</h3>
      <p>Học sinh: Nguyễn Văn A</p>
      <p>Lớp: 12A1</p>
      <p>Mục tiêu: 8.5+ kỳ thi THPT Quốc Gia môn Toán</p>
    </article>
  );
}
