import React, { useEffect, useRef, useState } from 'react';
import { TestResult } from '../types/exercise.types';
import './TerminalTestResults.css';

interface TerminalTestResultsProps {
  testResult: TestResult | null;
  isRunning: boolean;
}

const ExpandableArray: React.FC<{ data: any[]; label: string }> = ({ data, label }) => {
  const [expanded, setExpanded] = useState(false);

  if (data.length === 0) {
    return <span className="array-preview">[0 items]</span>;
  }

  return (
    <div>
      <span
        className="expandable-array"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▶</span>
        <span className="array-preview">[{data.length} items]</span>
      </span>
      {expanded && (
        <div className="array-expanded-content">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export const TerminalTestResults: React.FC<TerminalTestResultsProps> = ({ testResult, isRunning }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [testResult, isRunning]);

  if (isRunning) {
    return (
      <div className="terminal-container" ref={terminalRef}>
        <div className="terminal-header">
          <span className="terminal-icon">❯</span> EXECUTANDO TESTES
        </div>
        <div className="terminal-content">
          <div className="terminal-line">
            <span className="terminal-spinner">⠋</span>
            <span className="terminal-text dim">Aguardando resultados...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!testResult) {
    return (
      <div className="terminal-container" ref={terminalRef}>
        <div className="terminal-header">
          <span className="terminal-icon">❯</span> RESULTADOS DOS TESTES
        </div>
        <div className="terminal-content">
          <div className="terminal-line">
            <span className="terminal-text dim">Aguardando execução...</span>
          </div>
          <div className="terminal-line">
            <span className="terminal-text dim">Execute seu código para ver os resultados aqui.</span>
          </div>
        </div>
      </div>
    );
  }

  const passedCount = testResult.results.filter(r => r.passed).length;
  const totalCount = testResult.results.length;
  const allPassed = testResult.passed;

  return (
    <div className="terminal-container" ref={terminalRef}>
      <div className="terminal-header">
        <span className="terminal-icon">❯</span> RESULTADOS DOS TESTES
      </div>
      <div className="terminal-content">
        {/* Summary line */}
        <div className="terminal-line">
          <span className={`terminal-badge ${allPassed ? 'success' : 'error'}`}>
            {allPassed ? 'PASSOU' : 'FALHOU'}
          </span>
          <span className="terminal-text">
            {passedCount}/{totalCount} testes passaram
          </span>
          <span className="terminal-text dim">
            ({testResult.executionTime}ms)
          </span>
        </div>

        <div className="terminal-divider">─────────────────────────────────────────</div>

        {/* Test cases */}
        {testResult.results.map((result) => (
          <div key={result.testId} className="terminal-test-block">
            <div className="terminal-line">
              <span className={`terminal-icon ${result.passed ? 'success' : 'error'}`}>
                {result.passed ? '✓' : '✗'}
              </span>
              <span className="terminal-text">{result.testName}</span>
              <span className="terminal-text dim">({result.executionTime}ms)</span>
            </div>

            {!result.passed && result.error && (
              <div className="terminal-line error-line">
                <span className="terminal-indent">  </span>
                <span className="terminal-error">⚠ Erro:</span>
                <span className="terminal-text">{result.error}</span>
              </div>
            )}

            {result.expected !== undefined && (
              <div className="terminal-line">
                <span className="terminal-indent">  </span>
                <span className="terminal-label">Esperado:</span>
                <span className="terminal-value">
                  {typeof result.expected === 'string'
                    ? result.expected
                    : result.expected === null
                      ? 'null'
                      : Array.isArray(result.expected)
                        ? <ExpandableArray data={result.expected} label="Esperado" />
                        : JSON.stringify(result.expected, null, 2).split('\n')[0]}
                </span>
              </div>
            )}

            {result.actual !== undefined && (
              <div className="terminal-line">
                <span className="terminal-indent">  </span>
                <span className="terminal-label">Recebido:</span>
                <span className={`terminal-value ${result.passed ? 'success' : 'error'}`}>
                  {typeof result.actual === 'string'
                    ? result.actual
                    : result.actual === null
                      ? 'null'
                      : Array.isArray(result.actual)
                        ? <ExpandableArray data={result.actual} label="Recebido" />
                        : JSON.stringify(result.actual, null, 2).split('\n')[0]}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Footer summary */}
        <div className="terminal-divider">─────────────────────────────────────────</div>
        <div className="terminal-line">
          <span className={`terminal-summary ${allPassed ? 'success' : 'error'}`}>
            {allPassed
              ? `✓ Todos os ${totalCount} testes passaram!`
              : `✗ ${totalCount - passedCount} de ${totalCount} testes falharam`}
          </span>
        </div>
      </div>
    </div>
  );
};
