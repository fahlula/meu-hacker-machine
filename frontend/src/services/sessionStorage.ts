/**
 * Session storage service using localStorage
 * Persists user's work across page reloads and different ngrok URLs
 */

export interface SessionData {
  selectedExerciseId: string | null;
  exerciseCode: Record<string, string>; // exerciseId -> code
  activeTab: 'tests' | 'console' | 'manual';
  lastUpdated: number;
}

const STORAGE_KEY = 'meu-hacker-machine-session';
const AUTO_SAVE_DELAY = 1000; // 1 second debounce

class SessionStorageService {
  private autoSaveTimer: number | null = null;

  /**
   * Load session data from localStorage
   */
  load(): SessionData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as SessionData;
        console.log('📂 Session loaded:', {
          exercise: data.selectedExerciseId,
          codeCount: Object.keys(data.exerciseCode).length,
          lastUpdated: new Date(data.lastUpdated).toLocaleString()
        });
        return data;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }

    // Return default session
    return {
      selectedExerciseId: null,
      exerciseCode: {},
      activeTab: 'tests',
      lastUpdated: Date.now()
    };
  }

  /**
   * Save session data to localStorage (debounced)
   */
  save(data: SessionData): void {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Debounce to avoid too many writes
    this.autoSaveTimer = setTimeout(() => {
      try {
        data.lastUpdated = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('💾 Session saved');
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }, AUTO_SAVE_DELAY);
  }

  /**
   * Save immediately without debounce
   */
  saveNow(data: SessionData): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    try {
      data.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('💾 Session saved (immediate)');
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Clear all session data
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ Session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Update selected exercise
   */
  updateSelectedExercise(exerciseId: string): void {
    const data = this.load();
    data.selectedExerciseId = exerciseId;
    this.save(data);
  }

  /**
   * Update code for an exercise
   */
  updateExerciseCode(exerciseId: string, code: string): void {
    const data = this.load();
    data.exerciseCode[exerciseId] = code;
    this.save(data);
  }

  /**
   * Get code for an exercise
   */
  getExerciseCode(exerciseId: string): string | null {
    const data = this.load();
    const code = data.exerciseCode[exerciseId] || null;
    console.log(`🔍 Retrieving code for ${exerciseId}:`, code ? `${code.substring(0, 50)}...` : 'null');
    return code;
  }

  /**
   * Remove code for a specific exercise (useful for debugging)
   */
  clearExerciseCode(exerciseId: string): void {
    const data = this.load();
    delete data.exerciseCode[exerciseId];
    this.saveNow(data);
    console.log(`🗑️ Cleared code for ${exerciseId}`);
  }

  /**
   * Get all saved exercise IDs (for debugging)
   */
  getSavedExercises(): string[] {
    const data = this.load();
    return Object.keys(data.exerciseCode);
  }

  /**
   * Update active tab
   */
  updateActiveTab(tab: 'tests' | 'console' | 'manual'): void {
    const data = this.load();
    data.activeTab = tab;
    this.save(data);
  }
}

export const sessionStorage = new SessionStorageService();
