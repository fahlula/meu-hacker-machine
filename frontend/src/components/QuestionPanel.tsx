import React from 'react';
import { Exercise } from '../types/exercise.types';
import { marked } from 'marked';
import './QuestionPanel.css';

interface QuestionPanelProps {
  exercise: Exercise;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({ exercise }) => {
  const descriptionHtml = marked.parse(exercise.description);

  return (
    <div className="question-panel-container">
      <div style={{ marginBottom: '15px' }}>
        <span className={`difficulty-badge ${exercise.difficulty}`}>
          {exercise.difficulty.toUpperCase()}
        </span>
      </div>

      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />

      {exercise.hints && exercise.hints.length > 0 && (
        <details className="hints-section">
          <summary className="hints-summary">
            Hints
          </summary>
          <ul className="hints-list">
            {exercise.hints.map((hint, index) => (
              <li key={index}>
                {hint}
              </li>
            ))}
          </ul>
        </details>
      )}

      {exercise.apiDocumentation && (
        <div className="api-documentation">
          <h3>API Documentation</h3>
          <p><strong>Base URL:</strong> <code>{exercise.apiDocumentation.baseUrl}</code></p>
          {exercise.apiDocumentation.endpoints.map((endpoint, index) => (
            <div key={index} className="api-endpoint">
              <h4><code>{endpoint.method} {endpoint.path}</code></h4>
              <p>{endpoint.description}</p>
              {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                <div className="query-params">
                  <strong>Query Parameters:</strong>
                  <ul>
                    {endpoint.queryParams.map((param, idx) => (
                      <li key={idx}>
                        <code>{param.name}</code> ({param.type}) - {param.required ? 'Required' : 'Optional'}
                        {param.default !== undefined && ` (default: ${param.default})`}
                        {param.description && ` - ${param.description}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {endpoint.responseExample && (
                <details>
                  <summary className="response-example-summary">Example Response</summary>
                  <pre className="response-example-pre">
                    {endpoint.responseExample}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
