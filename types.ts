export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  avatar?: string;
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  colorFrom: string;
  colorTo: string;
  studentCount: number;
  lectureCount: number;
  exerciseCount: number;
  materialCount: number;
  tag: string;
}

export interface LearningProgress {
  subject: string;
  topic: string;
  progress: number; // 0-100
  status: 'critical' | 'warning' | 'good';
  priority: 'Cần gấp' | 'Trung bình' | 'Thấp';
}

export interface Strength {
  topic: string;
  mastery: number;
}