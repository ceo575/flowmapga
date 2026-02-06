import React, { ChangeEvent, useMemo, useState } from 'react';

type TeacherTab = 'classes' | 'materials' | 'reports';

type ParsedOption = {
  key: string;
  content: string;
  isCorrect: boolean;
};

type ParsedQuestion = {
  order: number;
  question: string;
  options: ParsedOption[];
  correctAnswer: string | null;
  explanation: string;
  questionType: 'single_choice' | 'true_false';
};

type ParsedResponse = {
  totalQuestions: number;
  questions: ParsedQuestion[];
};

type UploadedMaterial = {
  id: string;
  name: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  parsed?: ParsedResponse;
};

const tabs: { key: TeacherTab; label: string }[] = [
  { key: 'classes', label: 'Lớp học' },
  { key: 'materials', label: 'Học liệu' },
  { key: 'reports', label: 'Báo cáo' },
];

const starterMaterials: UploadedMaterial[] = [
  { id: 'file-1', name: 'mẫu equa.docx', status: 'idle' },
  { id: 'file-2', name: 'Đề cương_ôn_tập_HK1.docx', status: 'idle' },
  { id: 'file-3', name: 'Bài_tập_hàm_số_nâng_cao.docx', status: 'idle' },
];

const DOCX_API_URL = import.meta.env.VITE_DOCX_API_URL ?? 'http://localhost:3001';

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<TeacherTab>('materials');
  const [materials, setMaterials] = useState<UploadedMaterial[]>(starterMaterials);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(starterMaterials[0]?.id ?? null);
  const [notice, setNotice] = useState('');

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === selectedFileId) ?? null,
    [materials, selectedFileId],
  );

  const setMaterialState = (id: string, updater: (old: UploadedMaterial) => UploadedMaterial) => {
    setMaterials((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const uploadDocx = async (file: File, materialId: string) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${DOCX_API_URL}/api/exams/parse-docx`, {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || payload.details || 'Không parse được file Word.');
    }

    return payload as ParsedResponse;
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setNotice('');

    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const material: UploadedMaterial = { id, name: file.name, status: 'uploading' };
      setMaterials((prev) => [material, ...prev]);
      setSelectedFileId(id);

      if (!/\.docx$/i.test(file.name)) {
        setMaterialState(id, (old) => ({ ...old, status: 'error', error: 'Hệ thống hiện chỉ hỗ trợ file .docx.' }));
        continue;
      }

      try {
        const parsed = await uploadDocx(file, id);
        setMaterialState(id, (old) => ({ ...old, status: 'success', parsed }));
        setNotice(`Đã parse thành công: ${file.name} (${parsed.totalQuestions} câu).`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload thất bại.';
        setMaterialState(id, (old) => ({ ...old, status: 'error', error: message }));
      }
    }

    event.target.value = '';
  };

  return (
    <main className="dashboard-page teacher-layout">
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

      <section className="dashboard-content teacher-content">
        <header className="content-header teacher-header">
          <h1>Trang giáo viên</h1>
          <p>Quản lý lớp học, học liệu và báo cáo tiến độ.</p>
        </header>

        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'materials' && (
          <MaterialsTab
            materials={materials}
            selectedMaterial={selectedMaterial}
            onUpload={handleUpload}
            onSelect={setSelectedFileId}
            notice={notice}
          />
        )}
        {activeTab === 'reports' && <ReportsTab />}
      </section>
    </main>
  );
}

function ClassesTab() {
  return (
    <article className="panel">
      <h3>Danh sách lớp học</h3>
      <p>12A2, 11A1, 10A3 đang hoạt động tốt. Chuyển sang tab Học liệu để tải đề thi .docx.</p>
    </article>
  );
}

function MaterialsTab({
  materials,
  selectedMaterial,
  onUpload,
  onSelect,
  notice,
}: {
  materials: UploadedMaterial[];
  selectedMaterial: UploadedMaterial | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelect: (id: string) => void;
  notice: string;
}) {
  return (
    <section className="materials-shell">
      <article className="panel materials-main-panel">
        <h3>Quản lý học liệu</h3>
        <p>Cho phép tải lên file Word để chia sẻ cho học sinh.</p>

        <label htmlFor="word-upload" className="upload-box upload-box-large">
          <span>Nhấn để tải lên file .doc/.docx</span>
          <input id="word-upload" type="file" accept=".doc,.docx" multiple onChange={onUpload} />
        </label>

        {notice && <p className="upload-notice">{notice}</p>}

        <h4>Danh sách file đã tải lên</h4>
        <ul className="simple-list uploaded-material-list">
          {materials.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                className={`file-link ${selectedMaterial?.id === file.id ? 'active' : ''}`}
                onClick={() => onSelect(file.id)}
              >
                {file.name}
              </button>
              <span className={`file-status ${file.status}`}>{statusLabel[file.status]}</span>
              {file.error && <div className="file-error">{file.error}</div>}
            </li>
          ))}
        </ul>
      </article>

      <article className="panel parser-preview-panel">
        <h3>Kết quả parse</h3>
        {!selectedMaterial && <p>Chưa có file được chọn.</p>}

        {selectedMaterial?.status === 'uploading' && <p>Đang phân tích file Word...</p>}
        {selectedMaterial?.status === 'error' && <p className="form-error">{selectedMaterial.error}</p>}

        {selectedMaterial?.parsed && (
          <div className="parsed-content">
            <p className="badge">Tổng số câu: {selectedMaterial.parsed.totalQuestions}</p>
            {selectedMaterial.parsed.questions.map((question) => (
              <section key={question.order} className="question-card">
                <h4>Câu {question.order}</h4>
                <p className="question-text">{question.question}</p>
                <ul className="option-list">
                  {question.options.map((option) => (
                    <li key={`${question.order}-${option.key}`} className={option.isCorrect ? 'correct-option' : ''}>
                      <strong>{option.key}.</strong> {option.content}
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>Đáp án:</strong> {question.correctAnswer ?? 'Chưa xác định'}
                </p>
                {question.explanation && (
                  <p>
                    <strong>Lời giải:</strong> {question.explanation}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

const statusLabel: Record<UploadedMaterial['status'], string> = {
  idle: 'Chưa parse',
  uploading: 'Đang xử lý',
  success: 'Thành công',
  error: 'Lỗi',
};

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
