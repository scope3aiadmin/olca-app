/**
 * LangGraph Message Logger
 * 
 * A comprehensive logging utility for LangGraph messages that captures all necessary
 * information for debugging with the graph in the backend. Based on LangGraph documentation
 * and streaming capabilities.
 */

import { AIMessage, ToolMessage, HumanMessage, SystemMessage, Message } from "@langchain/langgraph-sdk";

// Types for different message types and their metadata
export interface LangGraphMessageMetadata {
  // Core message identification
  messageId: string;
  messageType: 'ai' | 'tool' | 'human' | 'system';
  timestamp: string;
  
  // LangGraph specific metadata
  threadId?: string;
  checkpointId?: string;
  nodeName?: string;
  step?: number;
  
  // Tool call specific metadata
  toolCallId?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  
  // LLM specific metadata
  modelName?: string;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  
  // Execution metadata
  executionTime?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'interrupted';
  error?: string;
  
  // Streaming metadata
  isStreaming?: boolean;
  streamMode?: 'values' | 'updates' | 'messages' | 'custom' | 'debug';
  
  // Content analysis
  contentLength: number;
  contentType: 'string' | 'json' | 'binary' | 'unknown';
  hasSpecialUI?: boolean;
  specialUIType?: 'approval' | 'validation' | 'foundation_approval' | 'rollback_error' | 'exchange_search' | 'exchange_addition' | 'exchange_addition_error' | 'none';
}

export interface LangGraphStreamEvent {
  type: 'update' | 'message' | 'custom' | 'debug' | 'error';
  data: any;
  metadata: Partial<LangGraphMessageMetadata>;
  timestamp: string;
}

/**
 * Analyzes message content to determine its type and structure
 */
function analyzeContent(content: any): { type: string; length: number; isJson: boolean; parsed?: any } {
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const length = contentStr.length;
  
  let type: 'string' | 'json' | 'binary' | 'unknown' = 'unknown';
  let isJson = false;
  let parsed: any = null;
  
  if (typeof content === 'string') {
    // Check if it's JSON
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      try {
        parsed = JSON.parse(content);
        type = 'json';
        isJson = true;
      } catch (e) {
        type = 'string';
      }
    } else {
      type = 'string';
    }
  } else if (typeof content === 'object' && content !== null) {
    type = 'json';
    isJson = true;
    parsed = content;
  } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
    type = 'binary';
  }
  
  return { type, length, isJson, parsed };
}

/**
 * Detects special UI requirements in tool messages
 */
function detectSpecialUI(content: any, parsedContent?: any): { hasSpecialUI: boolean; type: string } {
  const contentToCheck = parsedContent || content;
  
  if (typeof contentToCheck === 'object' && contentToCheck !== null) {
    // Check for foundation approval requirements
    if (contentToCheck.approval_request?.entity_type === 'product_system_foundation' ||
        contentToCheck.entity_type === 'product_system_foundation') {
      return { hasSpecialUI: true, type: 'foundation_approval' };
    }
    
    // Check for rollback errors
    if (contentToCheck.status === 'error' && 
        contentToCheck.details?.includes('Rollback errors:')) {
      return { hasSpecialUI: true, type: 'rollback_error' };
    }
    
    // Check for approval requirements
    if (contentToCheck.status === 'approval_required' && contentToCheck.approval_request) {
      return { hasSpecialUI: true, type: 'approval' };
    }
    if (contentToCheck.approval_required === true && contentToCheck.entity_type) {
      return { hasSpecialUI: true, type: 'approval' };
    }
    
    // Check for exchange search results
    if (contentToCheck.status === 'success' && 
        contentToCheck.search_results && 
        typeof contentToCheck.search_results === 'object' &&
        Object.keys(contentToCheck.search_results).length > 0) {
      return { hasSpecialUI: true, type: 'exchange_search' };
    }
    
    // Check for exchange addition results
    if (contentToCheck.status === 'success' && 
        contentToCheck.exchanges_added !== undefined &&
        contentToCheck.search_metadata) {
      return { hasSpecialUI: true, type: 'exchange_addition' };
    }
    
    // Check for validation completion
    if (contentToCheck.status === 'validation_complete' && contentToCheck.process_id) {
      return { hasSpecialUI: true, type: 'validation' };
    }
  }
  
  // Check raw content for approval patterns
  if (typeof content === 'string') {
    const rawContent = content.toLowerCase();
    if (rawContent.includes('product_system_foundation')) {
      return { hasSpecialUI: true, type: 'foundation_approval' };
    }
    if (rawContent.includes('rollback errors:')) {
      return { hasSpecialUI: true, type: 'rollback_error' };
    }
    if (rawContent.includes('approval_required') || rawContent.includes('approval required')) {
      return { hasSpecialUI: true, type: 'approval' };
    }
  }
  
  return { hasSpecialUI: false, type: 'none' };
}

/**
 * Extracts metadata from different message types
 */
function extractMessageMetadata(message: Message): Partial<LangGraphMessageMetadata> {
  const baseMetadata: Partial<LangGraphMessageMetadata> = {
    messageId: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    contentLength: 0,
    contentType: 'unknown'
  };

  // Analyze content
  const contentAnalysis = analyzeContent(message.content);
  baseMetadata.contentLength = contentAnalysis.length;
  baseMetadata.contentType = contentAnalysis.type as any;

  // Message type specific metadata
  if ('tool_calls' in message) {
    // AI Message
    baseMetadata.messageType = 'ai';
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0]; // Get first tool call for metadata
      baseMetadata.toolName = toolCall.name;
      baseMetadata.toolArgs = toolCall.args as Record<string, any>;
      baseMetadata.toolCallId = toolCall.id;
    }
  } else if ('tool_call_id' in message) {
    // Tool Message
    baseMetadata.messageType = 'tool';
    baseMetadata.toolCallId = message.tool_call_id;
    baseMetadata.toolName = message.name;
    
    // Detect special UI requirements
    const specialUI = detectSpecialUI(message.content, contentAnalysis.parsed);
    baseMetadata.hasSpecialUI = specialUI.hasSpecialUI;
    baseMetadata.specialUIType = specialUI.type as any;
  } else if (message.constructor.name === 'HumanMessage') {
    // Human Message
    baseMetadata.messageType = 'human';
  } else if (message.constructor.name === 'SystemMessage') {
    // System Message
    baseMetadata.messageType = 'system';
  }

  return baseMetadata;
}

/**
 * Creates a comprehensive log entry for a LangGraph message
 */
export function createMessageLogEntry(
  message: Message,
  additionalMetadata: Partial<LangGraphMessageMetadata> = {}
): { logEntry: any; metadata: LangGraphMessageMetadata } {
  const metadata = {
    ...extractMessageMetadata(message),
    ...additionalMetadata
  } as LangGraphMessageMetadata;

  const contentAnalysis = analyzeContent(message.content);
  
  const logEntry = {
    // Core message data
    message: {
      id: message.id,
      type: metadata.messageType,
      content: message.content,
      contentAnalysis: {
        type: contentAnalysis.type,
        length: contentAnalysis.length,
        isJson: contentAnalysis.isJson,
        parsed: contentAnalysis.parsed
      }
    },
    
    // LangGraph execution context
    execution: {
      threadId: metadata.threadId,
      checkpointId: metadata.checkpointId,
      nodeName: metadata.nodeName,
      step: metadata.step,
      status: metadata.status,
      executionTime: metadata.executionTime,
      error: metadata.error
    },
    
    // Tool execution context
    tool: metadata.toolName ? {
      name: metadata.toolName,
      callId: metadata.toolCallId,
      args: metadata.toolArgs,
      hasSpecialUI: metadata.hasSpecialUI,
      specialUIType: metadata.specialUIType
    } : undefined,
    
    // LLM context
    llm: metadata.modelName ? {
      model: metadata.modelName,
      tokens: metadata.tokens
    } : undefined,
    
    // Streaming context
    streaming: metadata.isStreaming ? {
      enabled: true,
      mode: metadata.streamMode
    } : undefined,
    
    // Timestamps
    timestamps: {
      created: metadata.timestamp,
      logged: new Date().toISOString()
    }
  };

  return { logEntry, metadata };
}

/**
 * Logs a LangGraph message with comprehensive debugging information
 */
export function logLangGraphMessage(
  message: Message,
  additionalMetadata: Partial<LangGraphMessageMetadata> = {},
  options: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    group?: boolean;
    includeRawContent?: boolean;
  } = {}
): void {
  const { level = 'info', group = true, includeRawContent = true } = options;
  
  const { logEntry, metadata } = createMessageLogEntry(message, additionalMetadata);
  
  const logMethod = console[level] || console.log;
  
  if (group) {
    console.group(`🔍 LangGraph Message [${metadata.messageType.toUpperCase()}] - ${metadata.messageId}`);
  }
  
  // Core message information
  logMethod('📋 Message Info:', {
    id: metadata.messageId,
    type: metadata.messageType,
    timestamp: metadata.timestamp,
    contentLength: metadata.contentLength,
    contentType: metadata.contentType
  });
  
  // Execution context
  if (metadata.threadId || metadata.checkpointId || metadata.nodeName) {
    logMethod('⚙️ Execution Context:', {
      threadId: metadata.threadId,
      checkpointId: metadata.checkpointId,
      nodeName: metadata.nodeName,
      step: metadata.step,
      status: metadata.status
    });
  }
  
  // Tool context
  if (metadata.toolName) {
    logMethod('🔧 Tool Context:', {
      name: metadata.toolName,
      callId: metadata.toolCallId,
      hasSpecialUI: metadata.hasSpecialUI,
      specialUIType: metadata.specialUIType,
      args: metadata.toolArgs
    });
  }
  
  // LLM context
  if (metadata.modelName || metadata.tokens) {
    logMethod('🤖 LLM Context:', {
      model: metadata.modelName,
      tokens: metadata.tokens
    });
  }
  
  // Streaming context
  if (metadata.isStreaming) {
    logMethod('📡 Streaming Context:', {
      enabled: true,
      mode: metadata.streamMode
    });
  }
  
  // Content analysis
  logMethod('📄 Content Analysis:', {
    type: logEntry.message.contentAnalysis.type,
    length: logEntry.message.contentAnalysis.length,
    isJson: logEntry.message.contentAnalysis.isJson,
    hasSpecialUI: metadata.hasSpecialUI,
    specialUIType: metadata.specialUIType
  });
  
  // Raw content (if requested and not too large)
  if (includeRawContent && metadata.contentLength < 10000) {
    logMethod('📝 Raw Content:', message.content);
  } else if (includeRawContent) {
    logMethod('📝 Raw Content (truncated):', {
      preview: typeof message.content === 'string' 
        ? message.content.substring(0, 500) + '...' 
        : message.content,
      fullLength: metadata.contentLength
    });
  }
  
  // Parsed content (if JSON)
  if (logEntry.message.contentAnalysis.isJson && logEntry.message.contentAnalysis.parsed) {
    logMethod('🔍 Parsed Content:', logEntry.message.contentAnalysis.parsed);
  }
  
  // Error information
  if (metadata.error) {
    logMethod('❌ Error:', metadata.error);
  }
  
  if (group) {
    console.groupEnd();
  }
}

/**
 * Logs a LangGraph stream event
 */
export function logLangGraphStreamEvent(
  event: LangGraphStreamEvent,
  options: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    group?: boolean;
  } = {}
): void {
  const { level = 'debug', group = true } = options;
  const logMethod = console[level] || console.log;
  
  if (group) {
    console.group(`📡 LangGraph Stream Event [${event.type.toUpperCase()}]`);
  }
  
  logMethod('🕐 Timestamp:', event.timestamp);
  logMethod('📊 Event Type:', event.type);
  logMethod('📋 Metadata:', event.metadata);
  logMethod('📄 Data:', event.data);
  
  if (group) {
    console.groupEnd();
  }
}

/**
 * Creates a logger specifically for debugging LangGraph graph execution
 */
export function createGraphDebugLogger(threadId?: string) {
  return {
    logMessage: (message: AIMessage | ToolMessage | HumanMessage | SystemMessage, additionalMetadata: Partial<LangGraphMessageMetadata> = {}) => {
      logLangGraphMessage(message, {
        ...additionalMetadata,
        threadId: threadId || additionalMetadata.threadId
      }, { level: 'debug', group: true });
    },
    
    logStreamEvent: (event: LangGraphStreamEvent) => {
      logLangGraphStreamEvent(event, { level: 'debug', group: true });
    },
    
    logExecutionStep: (step: number, nodeName: string, status: string, data?: any) => {
      console.group(`🔄 Graph Execution Step ${step} - ${nodeName}`);
      console.log('📊 Status:', status);
      console.log('🕐 Timestamp:', new Date().toISOString());
      if (data) {
        console.log('📄 Data:', data);
      }
      console.groupEnd();
    },
    
    logError: (error: Error, context?: any) => {
      console.group('❌ LangGraph Error');
      console.error('🚨 Error:', error);
      console.error('📍 Stack:', error.stack);
      if (context) {
        console.error('🔍 Context:', context);
      }
      console.groupEnd();
    }
  };
}

/**
 * Utility function to log all messages in a conversation thread
 */
export function logConversationThread(
  messages: any[],
  threadId?: string
): void {
  console.group(`💬 Conversation Thread${threadId ? ` - ${threadId}` : ''}`);
  
  messages.forEach((message, index) => {
    console.group(`Message ${index + 1}`);
    logLangGraphMessage(message, { threadId }, { level: 'info', group: false });
    console.groupEnd();
  });
  
  console.groupEnd();
}

/**
 * Utility to export logs for backend debugging
 */
export function exportLogsForBackend(): string {
  const logs: any[] = [];
  
  // Override console methods to capture logs
  const originalLog = console.log;
  const originalGroup = console.group;
  const originalGroupEnd = console.groupEnd;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  const capturedLogs: any[] = [];
  
  console.log = (...args: any[]) => {
    capturedLogs.push({ type: 'log', timestamp: new Date().toISOString(), args });
    originalLog(...args);
  };
  
  console.group = (...args: any[]) => {
    capturedLogs.push({ type: 'group', timestamp: new Date().toISOString(), args });
    originalGroup(...args);
  };
  
  console.groupEnd = () => {
    capturedLogs.push({ type: 'groupEnd', timestamp: new Date().toISOString() });
    originalGroupEnd();
  };
  
  console.warn = (...args: any[]) => {
    capturedLogs.push({ type: 'warn', timestamp: new Date().toISOString(), args });
    originalWarn(...args);
  };
  
  console.error = (...args: any[]) => {
    capturedLogs.push({ type: 'error', timestamp: new Date().toISOString(), args });
    originalError(...args);
  };
  
  // Restore original methods after a short delay
  setTimeout(() => {
    console.log = originalLog;
    console.group = originalGroup;
    console.groupEnd = originalGroupEnd;
    console.warn = originalWarn;
    console.error = originalError;
  }, 100);
  
  return JSON.stringify(capturedLogs, null, 2);
}

/**
 * Copy logs to clipboard for easy sharing
 */
export async function copyLogsToClipboard(): Promise<void> {
  try {
    const logs = exportLogsForBackend();
    await navigator.clipboard.writeText(logs);
    console.log('📋 Logs copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy logs to clipboard:', error);
  }
}

/**
 * Create a message chain summary for backend debugging
 */
export function createMessageChainSummary(messages: any[]): string {
  const summary = {
    timestamp: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map((msg, index) => {
      const metadata = extractMessageMetadata(msg);
      const contentAnalysis = analyzeContent(msg.content);
      
      return {
        index: index + 1,
        id: msg.id,
        type: metadata.messageType,
        timestamp: metadata.timestamp,
        contentLength: contentAnalysis.length,
        contentType: contentAnalysis.type,
        hasSpecialUI: detectSpecialUI(msg.content, contentAnalysis.parsed).hasSpecialUI,
        specialUIType: detectSpecialUI(msg.content, contentAnalysis.parsed).type,
        content: msg.content,
        parsedContent: contentAnalysis.parsed,
        toolCalls: 'tool_calls' in msg ? msg.tool_calls : undefined,
        toolCallId: 'tool_call_id' in msg ? msg.tool_call_id : undefined,
        toolName: 'name' in msg ? msg.name : undefined
      };
    })
  };
  
  return JSON.stringify(summary, null, 2);
}

export default {
  createMessageLogEntry,
  logLangGraphMessage,
  logLangGraphStreamEvent,
  createGraphDebugLogger,
  logConversationThread,
  exportLogsForBackend,
  copyLogsToClipboard,
  createMessageChainSummary
};
