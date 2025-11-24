import React, { useState, useEffect } from 'react';
import { Exercise } from '../types/exercise.types';
import './ManualRunModal.css';

interface ManualRunModalProps {
  exercise: Exercise | null;
  code: string;
  isOpen: boolean;
  onClose: () => void;
  onRun: (args: any[]) => void;
}

export const ManualRunModal: React.FC<ManualRunModalProps> = ({
  exercise,
  code,
  isOpen,
  onClose,
  onRun
}) => {
  const [manualArgs, setManualArgs] = useState<string[]>([]);

  useEffect(() => {
    if (exercise) {
      setManualArgs(exercise.functionSignature.params.map(() => ''));
    }
  }, [exercise]);

  const handleRun = () => {
    if (!exercise) return;

    // Parse arguments based on param types
    const parsedArgs = manualArgs.map((arg, index) => {
      const paramType = exercise.functionSignature.params[index].type;

      if (paramType === 'number') {
        return parseFloat(arg) || 0;
      } else if (paramType === 'boolean') {
        return arg.toLowerCase() === 'true';
      } else {
        return arg;
      }
    });

    onRun(parsedArgs);
    onClose();
  };

  if (!isOpen || !exercise) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Executar Manualmente</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="function-signature">
            <code>
              {exercise.functionSignature.name}(
              {exercise.functionSignature.params.map((p, i) => (
                <span key={i}>
                  {p.name}: {p.type}
                  {i < exercise.functionSignature.params.length - 1 ? ', ' : ''}
                </span>
              ))}
              ): {exercise.functionSignature.returnType}
            </code>
          </div>

          <div className="manual-args-inputs">
            {exercise.functionSignature.params.map((param, index) => (
              <div key={index} className="arg-input-group">
                <label>
                  {param.name}
                  <span className="arg-type">({param.type})</span>
                </label>
                <input
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={manualArgs[index] || ''}
                  onChange={(e) => {
                    const newArgs = [...manualArgs];
                    newArgs[index] = e.target.value;
                    setManualArgs(newArgs);
                  }}
                  placeholder={`Insira ${param.name}`}
                />
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button
              className="run-manual-button"
              onClick={handleRun}
              disabled={!code || manualArgs.some(arg => arg === '')}
            >
              Executar Função
            </button>
          </div>

          <div className="manual-run-info">
            <p>Execute sua função com argumentos customizados para testar manualmente.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
