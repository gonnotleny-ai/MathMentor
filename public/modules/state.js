// ── Shared application state ─────────────────────────────────────────────────

export const STORAGE_KEY = "maths-gcgp-progress";

// Returns a localStorage key scoped to the current user.
// Usage: userKey("maths-gcgp-progress") → "maths-gcgp-progress-42" (or "-guest")
export function userKey(base) {
  const uid = _currentUser?.id;
  return uid ? `${base}-${uid}` : `${base}-guest`;
}
export const TOKEN_KEY = "maths-gcgp-token";
export const USER_KEY = "maths-gcgp-user";
export const REFRESH_KEY = "maths-gcgp-refresh-token";
export const AUTH_REQUIRED_TABS = new Set(["assistant", "teacher", "prof-content", "student-exams"]);

export const EMPTY_TEACHER_RESOURCES = {
  courses: [],
  exercises: [],
  teacherClasses: [],
  joinedClasses: [],
  devoirs: [],
  exams: [],
};

export const defaultState = {
  viewedExercises: [],
  generatedExercises: [],
  recentQuestions: [],
  selfEvaluations: {},
  chatHistory: [],
  dailyActivity: {},
  earnedBadges: {},
  exerciseSchedule: {},
  topicFailCounts: {},
  learningHistory: [],
  errorHistory: [],
};

// Mutable state variables — use setters to mutate them so all modules share the same reference

let _currentUser = null;
let _authToken = "";
let _studentState = { ...defaultState };
let _teacherResources = { ...EMPTY_TEACHER_RESOURCES };
let _selectedCourse = null;
let _selectedExercise = null;
let _activeTab = "dashboard";

// Getters (direct reads — modules can also import the symbols below for backwards-compatible reads)
export function getCurrentUser() { return _currentUser; }
export function getAuthToken() { return _authToken; }
export function getStudentState() { return _studentState; }
export function getTeacherResources() { return _teacherResources; }
export function getSelectedCourse() { return _selectedCourse; }
export function getSelectedExercise() { return _selectedExercise; }
export function getActiveTab() { return _activeTab; }

// Setters
export function setCurrentUser(value) { _currentUser = value; }
export function setAuthToken(value) { _authToken = value; }
export function setStudentState(value) { _studentState = value; }
export function setTeacherResources(value) { _teacherResources = value; }
export function setSelectedCourse(value) { _selectedCourse = value; }
export function setSelectedExercise(value) { _selectedExercise = value; }
export function setActiveTab(value) { _activeTab = value; }

// Named exports matching the original global variable names — for internal module use
export { _currentUser as currentUser };
export { _authToken as authToken };
export { _studentState as studentState };
export { _teacherResources as teacherResources };
export { _selectedCourse as selectedCourse };
export { _selectedExercise as selectedExercise };
export { _activeTab as activeTab };
