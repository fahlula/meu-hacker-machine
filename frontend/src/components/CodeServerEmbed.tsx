import React from 'react';

interface CodeServerEmbedProps {
  codeServerUrl: string;
}

export const CodeServerEmbed: React.FC<CodeServerEmbedProps> = ({ codeServerUrl }) => {
  console.log('[CodeServerEmbed] Received codeServerUrl:', codeServerUrl);
  console.log('[CodeServerEmbed] URL starts with https:', codeServerUrl.startsWith('https'));

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <iframe
        src={codeServerUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="Code Server IDE"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-top-navigation-by-user-activation"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};
