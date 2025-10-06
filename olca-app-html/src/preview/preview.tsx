import React from 'react';
import { createRoot } from 'react-dom/client';
import MessagePreview from './components/MessagePreview';
import "../styles/global.css";

function PreviewApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MessagePreview />
    </div>
  );
}

// Auto-initialize when this module is loaded
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PreviewApp />);
}

export default PreviewApp;
