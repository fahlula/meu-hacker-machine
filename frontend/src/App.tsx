import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Exercise, TestResult } from './types/exercise.types';
import { api } from './services/api';
import { sessionStorage } from './services/sessionStorage';
import { ExerciseSelector } from './components/ExerciseSelector';
import { QuestionPanel } from './components/QuestionPanel';
import { MonacoEditor } from './components/MonacoEditor';
import { TabbedResultsPanel } from './components/TabbedResultsPanel';
import { ManualRunModal } from './components/ManualRunModal';
import { WireframeCube } from './components/WireframeCube';
import './App.css';

function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState<string>('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManualRunModal, setShowManualRunModal] = useState(false);
  const [manualRunResult, setManualRunResult] = useState<{
    result: any;
    stdout: string;
    stderr: string;
    executionTime: number;
    args: any[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'console' | 'manual'>('tests');

  useEffect(() => {
    loadExercises();

    // Load saved active tab
    const session = sessionStorage.load();
    setActiveTab(session.activeTab || 'tests');
  }, []);

  useEffect(() => {
    // Update code when exercise changes - CRITICAL for preventing wrong code display
    if (selectedExercise) {
      console.log(`🔄 Switching to exercise: ${selectedExercise.id} - ${selectedExercise.title}`);

      // IMMEDIATE reset to prevent lingering code
      setCode('');
      setTestResult(null);

      // Check if we have saved code for THIS SPECIFIC exercise
      const savedCode = sessionStorage.getExerciseCode(selectedExercise.id);

      // Validate that we're loading the right code
      const codeToUse = savedCode || selectedExercise.starterCode;

      // Double-check: does the function name in code match what we expect?
      const expectedFunctionName = selectedExercise.functionSignature.name;
      const hasCorrectFunction = codeToUse.includes(expectedFunctionName);

      if (!hasCorrectFunction) {
        console.warn(`⚠️ Code mismatch detected! Expected function: ${expectedFunctionName}`);
        console.warn(`Using starter code instead of saved code`);
        setCode(selectedExercise.starterCode);
      } else {
        if (savedCode) {
          console.log(`📖 Restored saved code for ${selectedExercise.id}`);
        } else {
          console.log(`🆕 Loading starter code for ${selectedExercise.id}`);
        }
        setCode(codeToUse);
      }

      // Save selected exercise
      sessionStorage.updateSelectedExercise(selectedExercise.id);
    }
  }, [selectedExercise]);

  useEffect(() => {
    // Auto-save code changes - with validation to prevent wrong code being saved
    if (selectedExercise && code && code !== selectedExercise.starterCode) {
      // Validate: does code contain the expected function?
      const expectedFunctionName = selectedExercise.functionSignature.name;
      if (code.includes(expectedFunctionName)) {
        console.log(`💾 Auto-saving code for ${selectedExercise.id}`);
        sessionStorage.updateExerciseCode(selectedExercise.id, code);
      } else {
        console.warn(`⚠️ Not auto-saving - code doesn't match exercise ${selectedExercise.id}`);
      }
    }
  }, [code, selectedExercise]);

  useEffect(() => {
    // Save active tab when it changes
    sessionStorage.updateActiveTab(activeTab);
  }, [activeTab]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await api.getExercises();
      setExercises(data);

      // Try to restore previous session
      const session = sessionStorage.load();
      if (session.selectedExerciseId && data.length > 0) {
        const savedExercise = data.find(ex => ex.id === session.selectedExerciseId);
        if (savedExercise) {
          console.log(`🔄 Restoring session for ${savedExercise.id}`);
          setSelectedExercise(savedExercise);
        } else {
          setSelectedExercise(data[0]);
        }
      } else if (data.length > 0) {
        setSelectedExercise(data[0]);
      }
    } catch (err) {
      setError('Falha ao carregar exercícios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedExercise) return;

    try {
      setIsRunningTests(true);
      setTestResult(null);

      // Submit the code from Monaco editor
      const result = await api.submitCode(selectedExercise.id, code);
      setTestResult(result);
    } catch (err) {
      console.error('Error running tests:', err);
      alert('Falha ao executar testes. Por favor, tente novamente.');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleManualRun = async (args: any[]) => {
    if (!selectedExercise) return;

    try {
      const result = await api.runManually(selectedExercise.id, code, args);

      // Display result in manual run tab
      if (result.error) {
        alert(`Erro: ${result.error}`);
      } else {
        // Store result and switch to manual run tab
        setManualRunResult({
          result: result.result,
          stdout: result.stdout,
          stderr: result.stderr,
          executionTime: result.executionTime,
          args: args
        });
        setActiveTab('manual');
      }
    } catch (err) {
      console.error('Error running code manually:', err);
      alert('Falha ao executar código manualmente. Por favor, tente novamente.');
    }
  };

  const handleDownloadSolution = async () => {
    if (!selectedExercise) return;

    try {
      const solution = await api.getSolution(selectedExercise.id);

      // Create a blob from the solution code
      const blob = new Blob([solution.referenceCode], { type: 'text/typescript' });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExercise.id}-solution.ts`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading solution:', err);
      alert('Falha ao baixar solução. Por favor, tente novamente.');
    }
  };

  const handleCloseManualRun = () => {
    setManualRunResult(null);
    setActiveTab('tests');
  };

  if (loading) {
    return (
      <div className="app-loading">
        Carregando exercícios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        {error}
      </div>
    );
  }

  if (!selectedExercise) {
    return (
      <div className="app-no-exercises">
        Nenhum exercício disponível
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <WireframeCube size={40} />
          <h1 className="app-header-title">
            MeuHackerMachine
          </h1>
        </div>
        <div className="app-header-actions">
          <ExerciseSelector
            exercises={exercises}
            selectedExercise={selectedExercise}
            onSelect={setSelectedExercise}
          />
          <button
            className="manual-run-button"
            onClick={() => setShowManualRunModal(true)}
            title="Executar Manualmente"
          >
            Manual Run
          </button>
          <button
            className="download-solution-button"
            onClick={handleDownloadSolution}
            title="Baixar Código"
          >
            Baixar Código
          </button>
          <button
            className="run-tests-button"
            onClick={handleSubmit}
            disabled={isRunningTests}
          >
            {isRunningTests ? 'Executando...' : 'Executar Testes'}
          </button>
        </div>
      </header>

      <div className="app-content">
        <PanelGroup
          direction="horizontal"
          id="main-horizontal-panels"
          autoSaveId="meu-hacker-horizontal-layout"
        >
          <Panel defaultSize={30} minSize={20}>
            <div className="panel question-panel">
              <QuestionPanel exercise={selectedExercise} />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle-vertical" />

          <Panel defaultSize={70} minSize={25}>
            <PanelGroup
              direction="vertical"
              id="main-vertical-panels"
              autoSaveId="meu-hacker-vertical-layout"
            >
              <Panel defaultSize={60} minSize={30}>
                <div className="panel code-panel">
                  <MonacoEditor
                    key={selectedExercise.id}
                    value={code}
                    onChange={setCode}
                    language="typescript"
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="resize-handle resize-handle-horizontal" />

              <Panel defaultSize={40} minSize={20}>
                <div className="panel results-panel">
                  <TabbedResultsPanel
                    exercise={selectedExercise}
                    testResult={testResult}
                    isRunning={isRunningTests}
                    manualRunResult={manualRunResult}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onCloseManualRun={handleCloseManualRun}
                  />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      <ManualRunModal
        exercise={selectedExercise}
        code={code}
        isOpen={showManualRunModal}
        onClose={() => setShowManualRunModal(false)}
        onRun={handleManualRun}
      />
    </div>
  );
}

export default App;
