/**
 * Debug Panel Usage Example
 * 
 * Shows how to integrate the debug panel into your components
 * for easy log copying and backend debugging
 */

import React from 'react';
import { DebugPanel } from '../components/debug/debug-panel';
import { AIMessage, ToolMessage, HumanMessage } from "@langchain/langgraph-sdk";

// Example component showing how to use the debug panel
export function ExampleComponentWithDebugPanel() {
  // Your messages array (this would come from your state management)
  const messages: (AIMessage | ToolMessage | HumanMessage)[] = [
    new HumanMessage("Create a process for my system"),
    new AIMessage({
      id: "msg_1",
      content: "I'll help you create a process. Let me start by gathering some information.",
      role: "assistant",
      tool_calls: [{
        id: "call_1",
        name: "create_process",
        args: { name: "My Process" }
      }]
    }),
    new ToolMessage({
      id: "msg_2",
      content: JSON.stringify({
        status: "approval_required",
        approval_request: {
          entity_type: "process",
          entity_summary: "New process: My Process"
        }
      }),
      role: "tool",
      tool_call_id: "call_1",
      name: "create_process"
    })
  ];

  const threadId = "thread_789";

  return (
    <div className="relative">
      {/* Your main component content */}
      <div className="p-4">
        <h1>Your Component</h1>
        <p>This is where your main content goes...</p>
        
        {/* Render your messages here */}
        {messages.map((message, index) => (
          <div key={index} className="mb-2 p-2 border rounded">
            <strong>{message.constructor.name}:</strong> {message.content}
          </div>
        ))}
      </div>

      {/* Debug Panel - always visible as a floating button */}
      <DebugPanel 
        messages={messages}
        threadId={threadId}
      />
    </div>
  );
}

// Example of how to use the debug panel in a chat interface
export function ChatInterfaceWithDebugPanel() {
  const [messages, setMessages] = React.useState<(AIMessage | ToolMessage | HumanMessage)[]>([]);
  const [threadId] = React.useState(() => `thread_${Date.now()}`);

  // Your chat logic here...
  const addMessage = (message: AIMessage | ToolMessage | HumanMessage) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className="mb-4 p-3 border rounded-lg">
            <div className="font-semibold text-sm text-gray-600">
              {message.constructor.name}
            </div>
            <div className="mt-1">
              {typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content, null, 2)
              }
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <input 
          type="text" 
          placeholder="Type your message..."
          className="w-full p-2 border rounded"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const content = (e.target as HTMLInputElement).value;
              addMessage(new HumanMessage(content));
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
      </div>

      {/* Debug Panel */}
      <DebugPanel 
        messages={messages}
        threadId={threadId}
      />
    </div>
  );
}

// Example of how to use the debug utilities directly
export function DirectDebugUsage() {
  const handleCopyLogs = async () => {
    const { copyLogsToClipboard } = await import('../lib/langgraph-logger');
    await copyLogsToClipboard();
  };

  const handleExportMessageChain = () => {
    const { createMessageChainSummary } = require('../lib/langgraph-logger');
    
    const messages = [
      new HumanMessage("Test message"),
      new AIMessage({
        id: "msg_1",
        content: "Test response",
        role: "assistant"
      })
    ];

    const summary = createMessageChainSummary(messages);
    console.log('Message Chain Summary:', summary);
  };

  return (
    <div className="p-4">
      <h2>Direct Debug Usage</h2>
      <div className="space-x-2">
        <button 
          onClick={handleCopyLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Copy Logs
        </button>
        <button 
          onClick={handleExportMessageChain}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export Message Chain
        </button>
      </div>
    </div>
  );
}

export default {
  ExampleComponentWithDebugPanel,
  ChatInterfaceWithDebugPanel,
  DirectDebugUsage
};
