/**
 * Debug Panel Component
 * 
 * Provides easy access to copy logs and create message chain summaries
 * for backend debugging
 */

import { useState } from 'react';
import { Copy, Download, Bug, Moon, Sun, X } from 'lucide-react';
import { 
  copyLogsToClipboard, 
  createMessageChainSummary,
  logConversationThread 
} from '../../lib/langgraph-logger';
import { Message, AIMessage, ToolMessage, HumanMessage, SystemMessage } from "@langchain/langgraph-sdk";
import { Button } from '../ui/button';

interface DebugPanelProps {
  messages?: any[];
  threadId?: string;
  className?: string;
  onClose?: () => void;
}

export function DebugPanel({ messages = [], threadId, className = "", onClose }: DebugPanelProps) {
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
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    // Apply theme to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };


  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white dark:bg-muted border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Debug Panel</h3>
        <div>
          <button
            onClick={toggleTheme}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 mr-2"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              title="Close Debug Panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p><strong>Thread ID:</strong> {threadId || 'Not specified'}</p>
          <p><strong>Messages:</strong> {messages.length}</p>
        </div>

        <div className="space-y-2 w-full">
          <Button
            onClick={handleCopyLogs}
            variant="brand"
            className="w-full"
          >
            <Copy className="w-4 h-4" />
            Copy Console Logs
          </Button>

          <Button
            onClick={handleExportMessageChain}
            variant="brand"
            className="w-full"
            disabled={messages.length === 0}
          >
            <Download className="w-4 h-4" />
            Export Message Chain
          </Button>

          <Button
            onClick={handleLogConversation}
            variant="brand"
            className="w-full"
            disabled={messages.length === 0}
          >
            <Bug className="w-4 h-4" />
            Log to Console
          </Button>

          <Button
            onClick={toggleLogging}
            variant={isLoggingEnabled ? "brand" : "secondary"}
            className="w-full"
          >
            {isLoggingEnabled ? 'Disable' : 'Enable'} Debug Logging
          </Button>
          <Button
            onClick={() => window.refreshNavigator()}
            variant="brand"
            className="w-full"
          >
            Refresh Navigator
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
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
