/**
 * React hook for LangGraph message logging
 * 
 * Provides a consistent interface for logging LangGraph messages throughout the application
 */

import { useCallback, useRef } from 'react';
import { Message } from "@langchain/langgraph-sdk";
import { 
  logLangGraphMessage, 
  logLangGraphStreamEvent, 
  createGraphDebugLogger,
  LangGraphMessageMetadata,
  LangGraphStreamEvent
} from '../lib/langgraph-logger';

export interface UseLangGraphLoggerOptions {
  threadId?: string;
  enableDebugLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  groupLogs?: boolean;
  includeRawContent?: boolean;
}

export function useLangGraphLogger(options: UseLangGraphLoggerOptions = {}) {
  const {
    threadId,
    enableDebugLogging = true,
    logLevel = 'debug',
    groupLogs = true,
    includeRawContent = true
  } = options;

  const debugLogger = useRef(createGraphDebugLogger(threadId));

  const logMessage = useCallback((
    message: Message,
    additionalMetadata: Partial<LangGraphMessageMetadata> = {}
  ) => {
    if (!enableDebugLogging) return;

    logLangGraphMessage(message, {
      ...additionalMetadata,
      threadId: threadId || additionalMetadata.threadId
    }, {
      level: logLevel,
      group: groupLogs,
      includeRawContent
    });
  }, [threadId, enableDebugLogging, logLevel, groupLogs, includeRawContent]);

  const logStreamEvent = useCallback((event: LangGraphStreamEvent) => {
    if (!enableDebugLogging) return;

    logLangGraphStreamEvent(event, {
      level: logLevel,
      group: groupLogs
    });
  }, [enableDebugLogging, logLevel, groupLogs]);

  const logExecutionStep = useCallback((
    step: number, 
    nodeName: string, 
    status: string, 
    data?: any
  ) => {
    if (!enableDebugLogging) return;

    debugLogger.current.logExecutionStep(step, nodeName, status, data);
  }, [enableDebugLogging]);

  const logError = useCallback((error: Error, context?: any) => {
    if (!enableDebugLogging) return;

    debugLogger.current.logError(error, context);
  }, [enableDebugLogging]);

  const logToolCall = useCallback((
    toolName: string,
    toolCallId: string,
    args: Record<string, any>,
    status: 'pending' | 'running' | 'completed' | 'failed' = 'pending'
  ) => {
    if (!enableDebugLogging) return;

    console.group(`🔧 Tool Call: ${toolName}`);
    console.log('📋 Tool Info:', {
      name: toolName,
      callId: toolCallId,
      args,
      status,
      timestamp: new Date().toISOString(),
      threadId
    });
    console.groupEnd();
  }, [enableDebugLogging, threadId]);

  const logLLMInvocation = useCallback((
    modelName: string,
    prompt: string,
    response?: string,
    tokens?: { prompt?: number; completion?: number; total?: number }
  ) => {
    if (!enableDebugLogging) return;

    console.group(`🤖 LLM Invocation: ${modelName}`);
    console.log('📋 Model Info:', {
      model: modelName,
      timestamp: new Date().toISOString(),
      threadId
    });
    console.log('📝 Prompt:', prompt);
    if (response) {
      console.log('📄 Response:', response);
    }
    if (tokens) {
      console.log('🔢 Tokens:', tokens);
    }
    console.groupEnd();
  }, [enableDebugLogging, threadId]);

  const logGraphState = useCallback((
    state: any,
    nodeName?: string,
    step?: number
  ) => {
    if (!enableDebugLogging) return;

    console.group(`📊 Graph State${nodeName ? ` - ${nodeName}` : ''}`);
    console.log('📋 State Info:', {
      nodeName,
      step,
      timestamp: new Date().toISOString(),
      threadId
    });
    console.log('📄 State Data:', state);
    console.groupEnd();
  }, [enableDebugLogging, threadId]);

  const logSpecialUI = useCallback((
    uiType: 'approval' | 'foundation_approval' | 'exchange_search' | 'exchange_addition' | 'error',
    data: any,
    toolName?: string
  ) => {
    if (!enableDebugLogging) return;

    console.group(`🎯 Special UI: ${uiType.toUpperCase()}`);
    console.log('📋 UI Info:', {
      type: uiType,
      toolName,
      timestamp: new Date().toISOString(),
      threadId
    });
    console.log('📄 UI Data:', data);
    console.groupEnd();
  }, [enableDebugLogging, threadId]);

  return {
    logMessage,
    logStreamEvent,
    logExecutionStep,
    logError,
    logToolCall,
    logLLMInvocation,
    logGraphState,
    logSpecialUI,
    debugLogger: debugLogger.current
  };
}

export default useLangGraphLogger;
