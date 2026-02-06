import React, { ChangeEvent, useState } from 'react';

const tabs = [
  { key: 'classes', label: 'Lớp học' },
  { key: 'materials', label: 'Học liệu' },
  { key: 'reports', label: 'Báo cáo' },
] as const;

type TeacherTab = typeof tabs[number]['key'];

const initialMaterials = [
  'Đề cương_ôn_tập_HK1.docx',
  'Bài_tập_hàm_số_nâng_cao.docx',
];

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<TeacherTab>('classes');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(initialMaterials);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const validFiles = files
      .filter((file) => /\.(doc|docx)$/i.test(file.name))
      .map((file) => file.name);

    if (validFiles.length) {
      setUploadedFiles((previous) => [...validFiles, ...previous]);
    }

    event.target.value = '';
  };

  return (
    <main className="dashboard-page">
      <aside className="sidebar teacher-sidebar">
        <h2>TOÁN FLOWMAP</h2>
        <p className="sidebar-caption">Không gian giáo viên</p>

        <nav>
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={`sidebar-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="dashboard-content">
        <header className="content-header">
          <h1>Trang giáo viên</h1>
          <p>Quản lý lớp học, học liệu và báo cáo tiến độ.</p>
        </header>

        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'materials' && <MaterialsTab uploadedFiles={uploadedFiles} onUpload={handleUpload} />}
        {activeTab === 'reports' && <ReportsTab />}
      </section>
    </main>
  );
}

function ClassesTab() {
  const classRows = [
    { name: '10A1', subject: 'Toán cơ bản', students: 42 },
    { name: '11A3', subject: 'Luyện thi học kỳ', students: 38 },
    { name: '12A2', subject: 'Luyện thi THPT Quốc gia', students: 45 },
    { name: '12C1', subject: 'Ôn chuyên đề tích phân', students: 32 },
  ];

  return (
    <article className="panel">
      <h3>Danh sách lớp học</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Lớp</th>
            <th>Chuyên đề</th>
            <th>Sĩ số</th>
          </tr>
        </thead>
        <tbody>
          {classRows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.subject}</td>
              <td>{row.students}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function MaterialsTab({
  uploadedFiles,
  onUpload,
}: {
  uploadedFiles: string[];
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <article className="panel">
      <h3>Quản lý học liệu</h3>
      <p>Cho phép tải lên file Word để chia sẻ cho học sinh.</p>
      <label htmlFor="word-upload" className="upload-box">
        <span>Nhấn để tải lên file .doc/.docx</span>
        <input id="word-upload" type="file" accept=".doc,.docx" multiple onChange={onUpload} />
      </label>

      <h4>Danh sách file đã tải lên</h4>
      <ul className="simple-list">
        {uploadedFiles.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
    </article>
  );
}

function ReportsTab() {
  return (
    <article className="panel">
      <h3>Báo cáo</h3>
      <ul className="simple-list">
        <li>Tỉ lệ hoàn thành bài tập tuần này: 82%</li>
        <li>Số học sinh đạt mục tiêu điểm 8+: 21/35</li>
        <li>Top lớp tiến bộ mạnh: 12A2, 11A3</li>
      </ul>
    </article>
  );
}
