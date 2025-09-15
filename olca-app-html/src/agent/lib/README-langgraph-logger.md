# LangGraph Message Logger

A comprehensive logging utility for LangGraph messages that captures all necessary information for debugging with the graph in the backend.

## Features

- **Comprehensive Message Logging**: Logs all types of LangGraph messages (AI, Tool, Human, System) with detailed metadata
- **Stream Event Logging**: Captures streaming events including updates, messages, custom data, and debug information
- **Special UI Detection**: Automatically detects and logs approval workflows, user input requests, and validation displays
- **Execution Context**: Tracks thread IDs, checkpoint IDs, node names, and execution steps
- **React Integration**: Provides a custom hook for easy integration in React components
- **Error Handling**: Comprehensive error logging with context information
- **Performance Metrics**: Tracks execution times, token usage, and other performance indicators

## Quick Start

### Basic Usage

```typescript
import { logLangGraphMessage } from './lib/langgraph-logger';

// Log an AI message
const aiMessage = new AIMessage({
  content: "I'll help you create a process.",
  role: "assistant",
  tool_calls: [{
    id: "call_123",
    name: "create_process",
    args: { name: "My Process" }
  }]
});

logLangGraphMessage(aiMessage, {
  threadId: "thread_789",
  nodeName: "agent",
  step: 1,
  status: "completed"
});
```

### Using the React Hook

```typescript
import { useLangGraphLogger } from '../hooks/use-langgraph-logger';

function MyComponent() {
  const { logMessage, logToolCall, logSpecialUI } = useLangGraphLogger({
    threadId: "thread_789",
    enableDebugLogging: true
  });

  useEffect(() => {
    // Log a tool call
    logToolCall("create_process", "call_123", { name: "My Process" }, "running");
    
    // Log special UI detection
    logSpecialUI("approval", approvalData, "create_process");
  }, []);

  return <div>...</div>;
}
```

## API Reference

### Core Functions

#### `logLangGraphMessage(message, metadata, options)`

Logs a LangGraph message with comprehensive debugging information.

**Parameters:**
- `message`: AIMessage | ToolMessage | HumanMessage | SystemMessage
- `metadata`: Partial<LangGraphMessageMetadata> - Additional metadata
- `options`: Logging options (level, group, includeRawContent)

#### `logLangGraphStreamEvent(event, options)`

Logs a LangGraph stream event.

**Parameters:**
- `event`: LangGraphStreamEvent - The stream event to log
- `options`: Logging options

#### `createGraphDebugLogger(threadId)`

Creates a debug logger instance for a specific thread.

**Returns:** Object with logging methods for execution steps, errors, etc.

### React Hook

#### `useLangGraphLogger(options)`

**Options:**
- `threadId?: string` - Thread identifier
- `enableDebugLogging?: boolean` - Enable/disable debug logging
- `logLevel?: 'debug' | 'info' | 'warn' | 'error'` - Log level
- `groupLogs?: boolean` - Group related logs
- `includeRawContent?: boolean` - Include raw message content

**Returns:**
- `logMessage(message, metadata)` - Log a message
- `logStreamEvent(event)` - Log a stream event
- `logExecutionStep(step, nodeName, status, data)` - Log execution step
- `logError(error, context)` - Log an error
- `logToolCall(name, callId, args, status)` - Log a tool call
- `logLLMInvocation(model, prompt, response, tokens)` - Log LLM invocation
- `logGraphState(state, nodeName, step)` - Log graph state
- `logSpecialUI(type, data, toolName)` - Log special UI detection

## Message Types and Metadata

### LangGraphMessageMetadata

```typescript
interface LangGraphMessageMetadata {
  // Core identification
  messageId: string;
  messageType: 'ai' | 'tool' | 'human' | 'system';
  timestamp: string;
  
  // LangGraph context
  threadId?: string;
  checkpointId?: string;
  nodeName?: string;
  step?: number;
  
  // Tool context
  toolCallId?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  
  // LLM context
  modelName?: string;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  
  // Execution context
  executionTime?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'interrupted';
  error?: string;
  
  // Streaming context
  isStreaming?: boolean;
  streamMode?: 'values' | 'updates' | 'messages' | 'custom' | 'debug';
  
  // Content analysis
  contentLength: number;
  contentType: 'string' | 'json' | 'binary' | 'unknown';
  hasSpecialUI?: boolean;
  specialUIType?: 'approval' | 'user_input' | 'validation' | 'none';
}
```

## Special UI Detection

The logger automatically detects special UI requirements in tool messages:

### Approval Workflows
```typescript
// Detects messages with approval_required status
{
  status: "approval_required",
  approval_request: {
    entity_type: "process",
    entity_summary: "New process: My Process",
    action: "create",
    impact: "Will create a new process"
  }
}
```

### User Input Requests
```typescript
// Detects messages requiring user input
{
  user_input_required: true,
  question: "Please confirm the process name"
}
```

### Validation Displays
```typescript
// Detects validation completion messages
{
  status: "validation_complete",
  process_id: "proc_123"
}
```

## Stream Events

### Update Events
```typescript
{
  type: "update",
  data: {
    node: "agent",
    updates: { messages: [...] }
  },
  metadata: { threadId: "thread_789", step: 1 }
}
```

### Message Events
```typescript
{
  type: "message",
  data: {
    token: "I'll",
    metadata: { langgraph_node: "agent" }
  },
  metadata: { threadId: "thread_789" }
}
```

### Custom Events
```typescript
{
  type: "custom",
  data: { progress: "50%", message: "Processing..." },
  metadata: { threadId: "thread_789" }
}
```

## Debug Output Format

The logger produces structured console output with emojis for easy identification:

```
🔍 LangGraph Message [TOOL] - msg_123
📋 Message Info: { id: "msg_123", type: "tool", ... }
⚙️ Execution Context: { threadId: "thread_789", nodeName: "create_process_tool", ... }
🔧 Tool Context: { name: "create_process", callId: "call_456", ... }
📄 Content Analysis: { type: "json", length: 1024, isJson: true, ... }
🎯 Special UI Detection: { hasSpecialUI: true, type: "approval" }
📝 Raw Content: { status: "approval_required", ... }
🔍 Parsed Content: { status: "approval_required", approval_request: {...} }
```

## Integration Examples

### In Tool Components
```typescript
import { useLangGraphLogger } from '../hooks/use-langgraph-logger';

export function ToolResult({ message }: { message: ToolMessage }) {
  const { logMessage, logSpecialUI } = useLangGraphLogger();

  useEffect(() => {
    logMessage(message, {
      messageType: 'tool',
      toolName: message.name,
      status: 'completed'
    });
  }, [message, logMessage]);

  // ... component logic
}
```

### In Graph Execution
```typescript
import { createGraphDebugLogger } from './lib/langgraph-logger';

const debugLogger = createGraphDebugLogger("thread_789");

// Log execution steps
debugLogger.logExecutionStep(1, "agent", "running", { input: "Create process" });
debugLogger.logExecutionStep(2, "create_process_tool", "completed", { result: "Success" });

// Log errors
debugLogger.logError(error, { toolName: "create_process", step: 2 });
```

### In Stream Handlers
```typescript
import { logLangGraphStreamEvent } from './lib/langgraph-logger';

// Handle stream events
streamEvents.forEach(event => {
  logLangGraphStreamEvent(event, { level: 'debug' });
});
```

## Best Practices

1. **Use the React Hook**: For React components, use `useLangGraphLogger` for consistent logging
2. **Include Context**: Always provide threadId, nodeName, and step information when available
3. **Log Special UI**: Use `logSpecialUI` to track approval workflows and user interactions
4. **Handle Errors**: Use the error logging methods to capture and debug failures
5. **Monitor Performance**: Include execution times and token usage in your logs
6. **Group Related Logs**: Use the grouping options to organize related log entries

## Troubleshooting

### Common Issues

1. **Missing Thread ID**: Always provide a threadId for proper context tracking
2. **Large Content**: Use `includeRawContent: false` for very large messages
3. **Performance**: Disable debug logging in production with `enableDebugLogging: false`
4. **Memory Usage**: Be mindful of logging very large objects or arrays

### Debug Tips

1. Use browser dev tools to filter console output by log level
2. Look for the emoji prefixes to quickly identify log types
3. Use the grouping feature to collapse related logs
4. Check the metadata section for execution context information

## Examples

See `examples/langgraph-logger-examples.ts` for comprehensive usage examples covering all features and scenarios.
