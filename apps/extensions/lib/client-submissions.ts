// Client-side submission handling for static sites

export interface Submission {
  id: string;
  url?: string;
  name?: string;
  description?: string;
  submittedBy?: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

const STORAGE_KEY = 'extension-submissions';

export function getSubmissions(): Submission[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveSubmission(data: Omit<Submission, 'id' | 'status' | 'submittedAt'>): Submission {
  const submissions = getSubmissions();

  const newSubmission: Submission = {
    ...data,
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  submissions.push(newSubmission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));

  return newSubmission;
}

export function updateSubmissionStatus(id: string, status: 'approved' | 'rejected'): void {
  const submissions = getSubmissions();
  const index = submissions.findIndex(s => s.id === id);

  if (index !== -1) {
    submissions[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  }
}

export function deleteSubmission(id: string): void {
  const submissions = getSubmissions();
  const filtered = submissions.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}