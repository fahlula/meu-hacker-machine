import React, { useState } from 'react';
import { Exercise, TestResult } from '../types/exercise.types';
import { TerminalTestResults } from './TerminalTestResults';
import './TabbedResultsPanel.css';

interface TabbedResultsPanelProps {
  exercise: Exercise | null;
  testResult: TestResult | null;
  isRunning: boolean;
  manualRunResult: {
    result: any;
    stdout: string;
    stderr: string;
    executionTime: number;
    args: any[];
  } | null;
  activeTab: 'tests' | 'console' | 'manual';
  onTabChange: (tab: 'tests' | 'console' | 'manual') => void;
  onCloseManualRun: () => void;
}

type TabType = 'tests' | 'console' | 'manual';

export const TabbedResultsPanel: React.FC<TabbedResultsPanelProps> = ({
  exercise,
  testResult,
  isRunning,
  manualRunResult,
  activeTab,
  onTabChange,
  onCloseManualRun
}) => {

  // Collect all console logs from test results
  const consoleLogs = React.useMemo(() => {
    if (!testResult) return [];
    return testResult.results
      .filter(r => r.stdout || r.stderr)
      .map(r => ({
        testName: r.testName,
        stdout: r.stdout || '',
        stderr: r.stderr || ''
      }));
  }, [testResult]);

  return (
    <div className="tabbed-results-container">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => onTabChange('tests')}
        >
          Test Results
          {testResult && (
            <span className={`tab-badge ${testResult.passed ? 'success' : 'error'}`}>
              {testResult.results.filter(r => r.passed).length}/{testResult.results.length}
            </span>
          )}
        </button>

        <button
          className={`tab-button ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => onTabChange('console')}
        >
          Console Output
          {consoleLogs.length > 0 && (
            <span className="tab-badge info">{consoleLogs.length}</span>
          )}
        </button>

        <button
          className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => onTabChange('manual')}
        >
          Manual Run
          {manualRunResult && (
            <span className="tab-badge success">✓</span>
          )}
        </button>
      </div>

      <div className="tabs-content">
        {activeTab === 'tests' && (
          <TerminalTestResults
            testResult={testResult}
            isRunning={isRunning}
          />
        )}

        {activeTab === 'console' && (
          <div className="console-output-tab">
            <div className="terminal-container">
              <div className="terminal-header">
                CONSOLE OUTPUT
              </div>
              <div className="terminal-content">
                {consoleLogs.length === 0 ? (
                  <div className="terminal-line">
                    <span className="terminal-text dim">Nenhum console.log encontrado nos testes</span>
                  </div>
                ) : (
                  consoleLogs.map((log, idx) => (
                    <div key={idx} className="console-log-group">
                      <div className="terminal-line">
                        <span className="terminal-label">{log.testName}:</span>
                      </div>
                      {log.stdout && (
                        <pre className="console-log-output stdout">{log.stdout}</pre>
                      )}
                      {log.stderr && (
                        <pre className="console-log-output stderr">{log.stderr}</pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="manual-run-results-tab">
            <div className="terminal-container">
              <div className="terminal-header">
                <span>MANUAL RUN RESULTS</span>
                {manualRunResult && (
                  <button
                    className="close-manual-run-button"
                    onClick={onCloseManualRun}
                    title="Clear results"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="terminal-content">
                {!manualRunResult ? (
                  <div className="terminal-line">
                    <span className="terminal-text dim">Nenhum resultado ainda. Execute manualmente usando o botão no topo.</span>
                  </div>
                ) : (
                  <>
                    <div className="terminal-section">
                      <div className="terminal-line">
                        <span className="terminal-label">Função:</span>
                        <span className="terminal-value">{exercise?.functionSignature.name}</span>
                      </div>
                      <div className="terminal-line">
                        <span className="terminal-label">Argumentos:</span>
                        <span className="terminal-value">{JSON.stringify(manualRunResult.args)}</span>
                      </div>
                      <div className="terminal-line">
                        <span className="terminal-label">Tempo de Execução:</span>
                        <span className="terminal-value success">{manualRunResult.executionTime}ms</span>
                      </div>
                    </div>

                    <div className="terminal-section">
                      <div className="terminal-line">
                        <span className="terminal-label">Resultado:</span>
                      </div>
                      <pre className="manual-result-output">
                        {JSON.stringify(manualRunResult.result, null, 2)}
                      </pre>
                    </div>

                    {manualRunResult.stdout && (
                      <div className="terminal-section">
                        <div className="terminal-line">
                          <span className="terminal-label">Console Output (stdout):</span>
                        </div>
                        <pre className="console-log-output stdout">{manualRunResult.stdout}</pre>
                      </div>
                    )}

                    {manualRunResult.stderr && (
                      <div className="terminal-section">
                        <div className="terminal-line">
                          <span className="terminal-label">Console Errors (stderr):</span>
                        </div>
                        <pre className="console-log-output stderr">{manualRunResult.stderr}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
