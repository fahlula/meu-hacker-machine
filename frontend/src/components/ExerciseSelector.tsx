import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Exercise } from '../types/exercise.types';
import './ExerciseSelector.css';

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  onSelect: (exercise: Exercise) => void;
}

// Generate stable UUID from string
function generateUUID(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0,8)}-${hex.slice(8,12) || '0000'}-4${hex.slice(12,15) || '000'}-a${hex.slice(15,18) || '000'}-${hex.slice(18,30).padEnd(12, '0')}`;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  exercises,
  selectedExercise,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate stable UUIDs for each exercise
  const exercisesWithUUID = useMemo(() => {
    return exercises.map(ex => ({
      ...ex,
      uuid: generateUUID(`exercise-${ex.id}-${ex.title}`)
    }));
  }, [exercises]);

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercisesWithUUID;
    const term = searchTerm.toLowerCase();
    return exercisesWithUUID.filter(ex =>
      ex.title.toLowerCase().includes(term) ||
      ex.id.toLowerCase().includes(term) ||
      ex.difficulty.toLowerCase().includes(term)
    );
  }, [exercisesWithUUID, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="exercise-selector-container" ref={dropdownRef}>
      <div className="exercise-dropdown">
        <button
          className="exercise-dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <span className="exercise-dropdown-text">
            {selectedExercise
              ? `${selectedExercise.title} (${selectedExercise.difficulty.toUpperCase()})`
              : '-- Choose an exercise --'
            }
          </span>
          <span className="exercise-dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div className="exercise-dropdown-menu">
            <input
              type="text"
              className="exercise-dropdown-search"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />

            <div className="exercise-dropdown-list">
              {filteredExercises.length === 0 ? (
                <div className="exercise-dropdown-item-empty">
                  No exercises found
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.uuid}
                    className={`exercise-dropdown-item ${selectedExercise?.id === exercise.id ? 'selected' : ''}`}
                    onClick={() => handleSelect(exercise)}
                    type="button"
                  >
                    <div className="exercise-dropdown-item-title">{exercise.title}</div>
                    <div className="exercise-dropdown-item-meta">
                      <span className={`difficulty-badge difficulty-${exercise.difficulty}`}>
                        {exercise.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
