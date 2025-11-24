import React from 'react';
import { TestResult } from '../types/exercise.types';
import './TestResultsPanel.css';

interface TestResultsPanelProps {
  testResult: TestResult | null;
  isRunning: boolean;
}

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({ testResult, isRunning }) => {
  if (isRunning) {
    return (
      <div className="test-results-container">
        <h3 className="test-results-header">Executando Testes...</h3>
        <div className="spinner" />
      </div>
    );
  }

  if (!testResult) {
    return (
      <div className="test-results-container">
        <h3 className="test-results-header">Resultados dos Testes</h3>
        <p className="test-results-empty">
          Execute seu código para ver os resultados aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="test-results-container">
      <div style={{ marginBottom: '20px' }}>
        <h3 className="test-results-header">Resultados dos Testes</h3>
        <div className={`test-results-summary ${testResult.passed ? 'passed' : 'failed'}`}>
          <div className={`test-results-title ${testResult.passed ? 'passed' : 'failed'}`}>
            <span>{testResult.passed ? '✓' : '✗'}</span>
            <span>{testResult.passed ? 'Todos os Testes Passaram!' : 'Alguns Testes Falharam'}</span>
          </div>
          <div className="test-results-score">
            Pontuação: {testResult.score} / {testResult.totalScore} pontos
          </div>
          <div className="test-results-execution-time">
            Tempo de Execução: {testResult.executionTime}ms
          </div>
        </div>
      </div>

      <div>
        <h4 className="test-cases-header">Casos de Teste</h4>
        {testResult.results.map((result) => (
          <div key={result.testId} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
            <div className="test-case-header">
              <span className={`test-case-icon ${result.passed ? 'passed' : 'failed'}`}>
                {result.passed ? '✓' : '✗'}
              </span>
              <span className="test-case-name">
                {result.testName}
              </span>
              <span className="test-case-time">
                {result.executionTime}ms
              </span>
            </div>

            {!result.passed && (
              <div className="test-case-details">
                {result.error && (
                  <div className="test-case-error">
                    <strong>Erro:</strong> {result.error}
                  </div>
                )}
                {result.expected !== undefined && (
                  <div className="test-case-data">
                    <strong>Esperado:</strong>
                    <pre>
                      {JSON.stringify(result.expected, null, 2)}
                    </pre>
                  </div>
                )}
                {result.actual !== undefined && (
                  <div className="test-case-data" style={{ marginTop: '8px' }}>
                    <strong>Recebido:</strong>
                    <pre>
                      {JSON.stringify(result.actual, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {result.passed && (result.expected !== undefined || result.actual !== undefined) && (
              <div className="test-case-details">
                {result.actual !== undefined && (
                  <div className="test-case-data">
                    <strong>Resultado:</strong>
                    <pre>
                      {JSON.stringify(result.actual, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
