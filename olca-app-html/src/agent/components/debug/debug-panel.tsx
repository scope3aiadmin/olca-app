/**
 * Debug Panel Component
 * 
 * Provides easy access to copy logs and create message chain summaries
 * for backend debugging
 */

import { useState } from 'react';
import { Copy, Download, Bug, BugOff, Moon, Sun } from 'lucide-react';
import { 
  copyLogsToClipboard, 
  createMessageChainSummary,
  logConversationThread 
} from '../../lib/langgraph-logger';
import { Message, AIMessage, ToolMessage, HumanMessage, SystemMessage } from "@langchain/langgraph-sdk";

interface DebugPanelProps {
  messages?: any[];
  threadId?: string;
  className?: string;
}

export function DebugPanel({ messages = [], threadId, className = "" }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleCopyLogs = async () => {
    try {
      await copyLogsToClipboard();
      alert('Logs copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy logs:', error);
      alert('Failed to copy logs to clipboard');
    }
  };

  const handleExportMessageChain = () => {
    if (messages.length === 0) {
      alert('No messages to export');
      return;
    }

    try {
      const summary = createMessageChainSummary(messages);
      const blob = new Blob([summary], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-chain-${threadId || 'debug'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export message chain:', error);
      alert('Failed to export message chain');
    }
  };

  const handleLogConversation = () => {
    if (messages.length === 0) {
      alert('No messages to log');
      return;
    }

    logConversationThread(messages, threadId);
    alert('Conversation logged to console!');
  };

  const toggleLogging = () => {
    setIsLoggingEnabled(!isLoggingEnabled);
    // You could implement a global logging toggle here
    console.log(`Debug logging ${isLoggingEnabled ? 'disabled' : 'enabled'}`);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Apply theme to document
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors ${className}`}
        title="Open Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Debug Panel</h3>
        <div>
          <button
            onClick={toggleTheme}
            className="text-gray-400 hover:text-gray-600 mr-2"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <BugOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          <p><strong>Thread ID:</strong> {threadId || 'Not specified'}</p>
          <p><strong>Messages:</strong> {messages.length}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCopyLogs}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy Console Logs
          </button>

          <button
            onClick={handleExportMessageChain}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={messages.length === 0}
          >
            <Download className="w-4 h-4" />
            Export Message Chain
          </button>

          <button
            onClick={handleLogConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            disabled={messages.length === 0}
          >
            <Bug className="w-4 h-4" />
            Log to Console
          </button>

          <button
            onClick={toggleLogging}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isLoggingEnabled 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {isLoggingEnabled ? 'Disable' : 'Enable'} Debug Logging
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use "Copy Console Logs" to copy all debug output</li>
            <li>Use "Export Message Chain" to download a JSON summary</li>
            <li>Use "Log to Console" to see conversation in console</li>
            <li>Share the logs with backend team for debugging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DebugPanel;
