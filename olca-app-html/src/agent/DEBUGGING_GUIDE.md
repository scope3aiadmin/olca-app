# LangGraph Debugging Guide

This guide explains how to use the comprehensive logging system I've created to debug LangGraph messages and easily copy logs for backend troubleshooting.

## 🧹 What I Cleaned Up

I removed all the scattered `console.log` statements from the `tool-calls.tsx` file and replaced them with a structured logging system that:

1. **Removes duplicate logging** - No more multiple console.log statements scattered throughout the code
2. **Provides structured output** - All logs are now organized and consistent
3. **Captures complete message chains** - Every message is logged with full context
4. **Enables easy copying** - You can easily copy logs for backend debugging

## 🔧 New Logging System

### 1. **Enhanced Tool Call Logging**
- Each AI message with tool calls is logged with detailed information
- Tool calls show: name, ID, arguments, and timestamp
- Grouped console output for easy reading

### 2. **Comprehensive Tool Result Logging**
- Every tool result message is logged with full context
- Content analysis (JSON parsing, type detection)
- Special UI detection (approval, user input, validation)
- Approval content structure analysis

### 3. **Structured Console Output**
```
🔧 AI Tool Calls Debug: 1 calls
  📋 Tool Call 1: { name: "create_process", id: "call_123", args: {...}, timestamp: "..." }

🔍 Tool Result Debug: create_process
  📋 Message Details: { id: "msg_456", name: "create_process", ... }
  📄 Raw Content: { "status": "approval_required", ... }
  📄 Parsed Content: { status: "approval_required", approval_request: {...} }
  🎯 Special UI Detection: { approval_required: true, special_ui_type: "approval" }
  🔍 Approval Content Structure: { hasApprovalRequest: true, ... }
```

## 🚀 How to Use for Backend Debugging

### Method 1: Use the Debug Panel (Recommended)

1. **Add the Debug Panel to your component:**
```tsx
import { DebugPanel } from '../components/debug/debug-panel';

function YourComponent() {
  const [messages, setMessages] = useState([]);
  const threadId = "your-thread-id";

  return (
    <div>
      {/* Your component content */}
      
      {/* Debug Panel - shows as floating button */}
      <DebugPanel 
        messages={messages}
        threadId={threadId}
      />
    </div>
  );
}
```

2. **Click the eye icon** in the bottom-right corner to open the debug panel
3. **Use the buttons:**
   - **"Copy Console Logs"** - Copies all console output to clipboard
   - **"Export Message Chain"** - Downloads a JSON file with complete message chain
   - **"Log to Console"** - Shows the conversation in console
   - **"Enable/Disable Debug Logging"** - Toggle logging on/off

### Method 2: Direct Console Access

1. **Open browser dev tools** (F12)
2. **Go to Console tab**
3. **Look for the structured logs** with emoji prefixes
4. **Copy the relevant sections** for backend debugging

### Method 3: Programmatic Access

```typescript
import { copyLogsToClipboard, createMessageChainSummary } from '../lib/langgraph-logger';

// Copy all console logs
await copyLogsToClipboard();

// Create message chain summary
const summary = createMessageChainSummary(messages);
console.log(summary);
```

## 📋 What Gets Logged

### For Each AI Message (Tool Calls):
- Message ID and type
- Tool call details (name, ID, arguments)
- Timestamp
- Execution context

### For Each Tool Result:
- Message ID and type
- Tool name and call ID
- Content analysis (JSON parsing, type detection)
- Special UI detection results
- Approval content structure (if applicable)
- Raw and parsed content

### For Special UI Detection:
- Approval workflows
- User input requests
- Validation displays
- Content structure analysis

## 🔍 Debugging Workflow

1. **Reproduce the issue** in your application
2. **Open the debug panel** (eye icon in bottom-right)
3. **Click "Copy Console Logs"** to copy all debug output
4. **Paste the logs** into your backend debugging environment
5. **Use the structured information** to trace the message flow

## 📊 Log Structure for Backend

The logs contain all the information needed for backend debugging:

```json
{
  "type": "log",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "args": [
    "🔍 Tool Result Debug: create_process",
    {
      "id": "msg_456",
      "name": "create_process",
      "tool_call_id": "call_123",
      "content_type": "string",
      "content_length": 1024,
      "is_json": true
    }
  ]
}
```

## 🎯 Key Benefits

1. **No More Scattered Logs** - All logging is centralized and structured
2. **Complete Message Chain** - Every message is logged with full context
3. **Easy Copy/Paste** - One-click copying for backend debugging
4. **Structured Output** - Consistent, readable log format
5. **Special UI Detection** - Automatic detection and logging of approval workflows
6. **Content Analysis** - JSON parsing and type detection for all messages

## 🚨 Troubleshooting

### If you don't see logs:
1. Make sure debug logging is enabled in the debug panel
2. Check that the `useLangGraphLogger` hook is being used
3. Verify that messages are being passed to the components

### If logs are too verbose:
1. Use the "Disable Debug Logging" button in the debug panel
2. Or set `enableDebugLogging: false` in the logger hook

### If copying doesn't work:
1. Make sure you're using a modern browser with clipboard API support
2. Try the "Export Message Chain" option instead
3. Use the "Log to Console" option and copy manually

## 📝 Example Usage

```tsx
// In your main component
import { DebugPanel } from './components/debug/debug-panel';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const threadId = "thread_123";

  return (
    <div className="chat-container">
      {/* Your chat UI */}
      
      {/* Debug panel for easy log access */}
      <DebugPanel 
        messages={messages}
        threadId={threadId}
      />
    </div>
  );
}
```

This system gives you complete visibility into the LangGraph message flow and makes it easy to copy logs for backend debugging!
