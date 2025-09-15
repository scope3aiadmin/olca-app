/**
 * LangGraph Logger Usage Examples
 * 
 * This file demonstrates how to use the LangGraph logger in different scenarios
 * for comprehensive debugging with the graph in the backend.
 */

import { AIMessage, ToolMessage, HumanMessage, SystemMessage } from "@langchain/langgraph-sdk";
import { 
  logLangGraphMessage, 
  logLangGraphStreamEvent, 
  createGraphDebugLogger,
  logConversationThread,
  LangGraphMessageMetadata,
  LangGraphStreamEvent
} from '../lib/langgraph-logger';
import { useLangGraphLogger } from '../hooks/use-langgraph-logger';

// Example 1: Basic message logging
export function exampleBasicMessageLogging() {
  // Log an AI message
  const aiMessage: AIMessage = {
    id: "msg_123",
    content: "I'll help you create a process for your system.",
    role: "assistant",
    tool_calls: [
      {
        id: "call_456",
        name: "create_process",
        args: {
          name: "My Process",
          description: "A new process for the system"
        }
      }
    ]
  };

  logLangGraphMessage(aiMessage, {
    threadId: "thread_789",
    nodeName: "agent",
    step: 1,
    status: "completed"
  });

  // Log a tool message
  const toolMessage: ToolMessage = {
    id: "msg_124",
    content: JSON.stringify({
      status: "approval_required",
      message: "Process creation requires approval",
      approval_request: {
        entity_type: "process",
        entity_summary: "New process: My Process",
        action: "create",
        impact: "Will create a new process in the system"
      }
    }),
    role: "tool",
    tool_call_id: "call_456",
    name: "create_process"
  };

  logLangGraphMessage(toolMessage, {
    threadId: "thread_789",
    nodeName: "create_process_tool",
    step: 2,
    status: "completed",
    hasSpecialUI: true,
    specialUIType: "approval"
  });
}

// Example 2: Stream event logging
export function exampleStreamEventLogging() {
  // Log a stream update event
  const updateEvent: LangGraphStreamEvent = {
    type: "update",
    data: {
      node: "agent",
      updates: {
        messages: [{
          role: "assistant",
          content: "Processing your request..."
        }]
      }
    },
    metadata: {
      threadId: "thread_789",
      step: 1,
      nodeName: "agent"
    },
    timestamp: new Date().toISOString()
  };

  logLangGraphStreamEvent(updateEvent);

  // Log a message stream event
  const messageEvent: LangGraphStreamEvent = {
    type: "message",
    data: {
      token: "I'll",
      metadata: {
        langgraph_node: "agent",
        tags: ["response"]
      }
    },
    metadata: {
      threadId: "thread_789",
      nodeName: "agent",
      modelName: "gpt-4"
    },
    timestamp: new Date().toISOString()
  };

  logLangGraphStreamEvent(messageEvent);
}

// Example 3: Using the debug logger
export function exampleDebugLogger() {
  const debugLogger = createGraphDebugLogger("thread_789");

  // Log execution steps
  debugLogger.logExecutionStep(1, "agent", "running", { input: "Create a process" });
  debugLogger.logExecutionStep(2, "create_process_tool", "completed", { result: "Process created" });

  // Log errors
  try {
    throw new Error("Tool execution failed");
  } catch (error) {
    debugLogger.logError(error as Error, { 
      toolName: "create_process",
      threadId: "thread_789"
    });
  }
}

// Example 4: Using the React hook
export function exampleReactHookUsage() {
  // This would be used inside a React component
  const logger = useLangGraphLogger({
    threadId: "thread_789",
    enableDebugLogging: true,
    logLevel: "debug"
  });

  // Log different types of events
  const handleToolCall = (toolName: string, args: any) => {
    logger.logToolCall(toolName, "call_123", args, "running");
  };

  const handleLLMInvocation = (model: string, prompt: string, response: string) => {
    logger.logLLMInvocation(model, prompt, response, {
      prompt: 100,
      completion: 50,
      total: 150
    });
  };

  const handleGraphState = (state: any, nodeName: string) => {
    logger.logGraphState(state, nodeName, 1);
  };

  const handleSpecialUI = (uiType: "approval" | "user_input" | "validation", data: any) => {
    logger.logSpecialUI(uiType, data, "create_process");
  };

  return {
    handleToolCall,
    handleLLMInvocation,
    handleGraphState,
    handleSpecialUI
  };
}

// Example 5: Logging a complete conversation thread
export function exampleConversationThreadLogging() {
  const messages = [
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

  logConversationThread(messages, "thread_789");
}

// Example 6: Comprehensive debugging setup
export function exampleComprehensiveDebugging() {
  const debugLogger = createGraphDebugLogger("thread_789");

  // Simulate a complete graph execution with logging
  console.group("🚀 LangGraph Execution Debug Session");
  
  // Step 1: User input
  const userMessage = new HumanMessage("Create a process called 'Data Processing'");
  logLangGraphMessage(userMessage, {
    threadId: "thread_789",
    nodeName: "input_handler",
    step: 0,
    status: "completed"
  });

  // Step 2: Agent processing
  debugLogger.logExecutionStep(1, "agent", "running", { 
    input: "Create a process called 'Data Processing'",
    timestamp: new Date().toISOString()
  });

  const agentMessage = new AIMessage({
    id: "msg_agent_1",
    content: "I'll create a process called 'Data Processing' for you.",
    role: "assistant",
    tool_calls: [{
      id: "call_create_process",
      name: "create_process",
      args: {
        name: "Data Processing",
        description: "A process for data processing operations",
        type: "data_processing"
      }
    }]
  });

  logLangGraphMessage(agentMessage, {
    threadId: "thread_789",
    nodeName: "agent",
    step: 1,
    status: "completed",
    modelName: "gpt-4",
    tokens: { prompt: 50, completion: 25, total: 75 }
  });

  // Step 3: Tool execution
  debugLogger.logExecutionStep(2, "create_process_tool", "running", {
    toolName: "create_process",
    args: { name: "Data Processing" }
  });

  const toolMessage = new ToolMessage({
    id: "msg_tool_1",
    content: JSON.stringify({
      status: "approval_required",
      message: "Process creation requires approval",
      approval_request: {
        entity_type: "process",
        entity_summary: "New process: Data Processing",
        action: "create",
        impact: "Will create a new data processing process",
        entity_details: {
          name: "Data Processing",
          description: "A process for data processing operations",
          type: "data_processing"
        }
      }
    }),
    role: "tool",
    tool_call_id: "call_create_process",
    name: "create_process"
  });

  logLangGraphMessage(toolMessage, {
    threadId: "thread_789",
    nodeName: "create_process_tool",
    step: 2,
    status: "completed",
    hasSpecialUI: true,
    specialUIType: "approval"
  });

  // Step 4: Special UI handling
  console.group("🎯 Special UI Detection");
  console.log("Approval workflow triggered for process creation");
  console.log("Entity type: process");
  console.log("Action: create");
  console.log("Impact: Will create a new data processing process");
  console.groupEnd();

  // Step 5: Stream events
  const streamEvents: LangGraphStreamEvent[] = [
    {
      type: "update",
      data: { node: "agent", updates: { status: "processing" } },
      metadata: { threadId: "thread_789", step: 1 },
      timestamp: new Date().toISOString()
    },
    {
      type: "message",
      data: { token: "I'll", metadata: { langgraph_node: "agent" } },
      metadata: { threadId: "thread_789", nodeName: "agent" },
      timestamp: new Date().toISOString()
    },
    {
      type: "custom",
      data: { progress: "50%", message: "Processing tool call" },
      metadata: { threadId: "thread_789", nodeName: "create_process_tool" },
      timestamp: new Date().toISOString()
    }
  ];

  streamEvents.forEach(event => {
    logLangGraphStreamEvent(event);
  });

  console.groupEnd();
}

// Example 7: Error handling and recovery
export function exampleErrorHandling() {
  const debugLogger = createGraphDebugLogger("thread_789");

  try {
    // Simulate a tool execution that might fail
    debugLogger.logExecutionStep(1, "create_process_tool", "running", {
      toolName: "create_process",
      args: { name: "Test Process" }
    });

    // Simulate an error
    throw new Error("Database connection failed");

  } catch (error) {
    // Log the error with context
    debugLogger.logError(error as Error, {
      toolName: "create_process",
      threadId: "thread_789",
      step: 1,
      args: { name: "Test Process" },
      timestamp: new Date().toISOString()
    });

    // Log recovery attempt
    debugLogger.logExecutionStep(2, "create_process_tool", "retrying", {
      toolName: "create_process",
      retryCount: 1,
      maxRetries: 3
    });
  }
}

export default {
  exampleBasicMessageLogging,
  exampleStreamEventLogging,
  exampleDebugLogger,
  exampleReactHookUsage,
  exampleConversationThreadLogging,
  exampleComprehensiveDebugging,
  exampleErrorHandling
};
