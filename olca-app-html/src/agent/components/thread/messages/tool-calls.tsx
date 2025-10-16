import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { EntityApproval } from "./entity-approval";
import { ExchangeSearchResults } from "./exchange-search-results";
import { formatErrorAsHumanMessage, extractErrorData } from "./error-formatter";
import { useLangGraphLogger } from "../../../hooks/use-langgraph-logger";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function shouldTruncateValue(value: any, maxLength: number = 500): boolean {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return JSON.stringify(value, null, 2).length > maxLength;
  }
  return String(value).length > maxLength;
}

function truncateValue(value: any, maxLength: number = 500): any {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    const jsonStr = JSON.stringify(value, null, 2);
    if (jsonStr.length > maxLength) {
      return jsonStr.slice(0, maxLength) + "...";
    }
    return value;
  }
  return String(value).length > maxLength 
    ? String(value).slice(0, maxLength) + "..."
    : value;
}

// Detection functions for special UI requirements
function isFoundationApprovalRequired(content: any): boolean {
  return content?.approval_request?.entity_type === "product_system_foundation" ||
         content?.entity_type === "product_system_foundation";
}

function isApprovalRequired(content: any): boolean {
  const hasStatusApproval = content?.status === "approval_required" && content?.approval_request;
  const hasDirectApproval = content?.approval_required === true && content?.entity_type;
  const hasFoundationApproval = isFoundationApprovalRequired(content);
  
  // Debug logging for approval detection
  if (hasStatusApproval || hasDirectApproval || hasFoundationApproval) {
    // This will be handled by the logger in the component
  }
  
  return hasStatusApproval || hasDirectApproval || hasFoundationApproval;
}


function isExchangeSearchResults(content: any): boolean {
  return content?.status === "success" && 
         content?.search_results && 
         typeof content.search_results === "object" &&
         Object.keys(content.search_results).length > 0;
}

function isExchangeAdditionResults(content: any): boolean {
  return content?.status === "success" && 
         content?.exchanges_added !== undefined &&
         content?.search_metadata;
}

// Helper function to detect if content is an error that should be formatted as human message
function isErrorContent(content: any): boolean {
  return content?.status === "error" || 
         content?.status === "validation_complete" ||
         content?.validation_errors ||
         content?.details?.includes("Rollback errors:") ||
         content?.message?.includes("Exchange validation failed") ||
         content?.message?.includes("Failed to add selected exchanges");
}

// Helper function to format exchange addition success as human message
function formatExchangeAdditionSuccess(content: any): string {
  const { 
    message, 
    exchanges_added = 0, 
    search_metadata, 
    next_action, 
    state_update 
  } = content;

  let humanMessage = `✅ **Exchanges Added Successfully**\n\n`;
  humanMessage += `**Summary:**\n`;
  humanMessage += `• Added ${exchanges_added} exchanges to the process\n`;
  
  if (search_metadata) {
    humanMessage += `• Total exchanges in process: ${search_metadata.total_exchanges_added}\n`;
    if (search_metadata.materials_added.length > 0) {
      humanMessage += `• Materials added: ${search_metadata.materials_added.join(', ')}\n`;
    }
  }
  
  humanMessage += '\n';
  
  if (state_update) {
    humanMessage += `**Current Process State:**\n`;
    humanMessage += `• Stage: ${state_update.process_building_stage}\n`;
    humanMessage += `• Total exchanges: ${state_update.current_process_exchanges.length}\n\n`;
    
    if (state_update.current_process_exchanges.length > 0) {
      humanMessage += `**Current Exchanges:**\n`;
      state_update.current_process_exchanges.forEach((exchange: any) => {
        const badges = [];
        if (exchange.is_input) badges.push('Input');
        if (exchange.is_quantitative_reference) badges.push('Reference');
        const badgeText = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
        humanMessage += `• ${exchange.flow_name} (${exchange.amount})${badgeText}\n`;
      });
      humanMessage += '\n';
    }
  }
  
  if (next_action) {
    humanMessage += `**Next Step:** ${next_action}`;
  }

  return humanMessage;
}

function getToolCallId(message: ToolMessage): string | undefined {
  return message.tool_call_id;
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  const { logToolCall } = useLangGraphLogger({ enableDebugLogging: false });
  
  if (!toolCalls || toolCalls.length === 0) return null;

  // Log tool calls for debugging (minimal)
  useEffect(() => {
    if (toolCalls && toolCalls.length > 0) {
      toolCalls.forEach((toolCall, index) => {
        logToolCall(
          toolCall.name,
          toolCall.id || `call_${index}`,
          toolCall.args as Record<string, any>,
          'pending'
        );
      });
    }
  }, [toolCalls, logToolCall]);

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {tc.name}
                {tc.id && (
                  <code className="ml-2 rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-gray-100">
                    {tc.id}
                  </code>
                )}
              </h3>
            </div>
            {hasArgs ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(args).map(([key, value], argIdx) => (
                    <tr key={argIdx}>
                      <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                        {key}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                        {isComplexValue(value) ? (
                          <code className="rounded bg-gray-50 dark:bg-gray-800 px-2 py-1 font-mono text-sm break-all text-gray-900 dark:text-gray-100">
                            {JSON.stringify(value, null, 2)}
                          </code>
                        ) : (
                          String(value)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <code className="block p-3 text-sm text-gray-900 dark:text-gray-100">{"{}"}</code>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoggedSpecialUI, setHasLoggedSpecialUI] = useState(false);
  const { logMessage, logSpecialUI } = useLangGraphLogger({ enableDebugLogging: false });

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      // Try to parse as JSON, but also handle single-quoted strings
      let jsonString = message.content;
      
      // Handle single-quoted JSON strings (common in Python output)
      if (jsonString.includes("'") && !jsonString.includes('"')) {
        // Replace single quotes with double quotes for JSON parsing
        jsonString = jsonString.replace(/'/g, '"');
      }
      
      // Check if content looks like JSON (starts with { or [)
      if (jsonString.trim().startsWith('{') || jsonString.trim().startsWith('[')) {
        // Check if content appears to be truncated (ends with ...)
        if (jsonString.trim().endsWith('...')) {
          // Try to reconstruct a valid JSON by removing the truncation
          const withoutTruncation = jsonString.trim().slice(0, -3);
          
          // Try to find the last complete object/array, but be more careful
          let lastCompleteBrace = withoutTruncation.lastIndexOf('}');
          let lastCompleteBracket = withoutTruncation.lastIndexOf(']');
          let lastComplete = Math.max(lastCompleteBrace, lastCompleteBracket);
          
          // Also check for incomplete nested objects
          let braceCount = 0;
          let bracketCount = 0;
          let bestPosition = lastComplete;
          
          for (let i = 0; i < withoutTruncation.length; i++) {
            if (withoutTruncation[i] === '{') braceCount++;
            else if (withoutTruncation[i] === '}') braceCount--;
            else if (withoutTruncation[i] === '[') bracketCount++;
            else if (withoutTruncation[i] === ']') bracketCount--;
            
            // If we're at a balanced state, this might be a good cut point
            if (braceCount === 0 && bracketCount === 0 && i > lastComplete) {
              bestPosition = i;
            }
          }
          
          if (bestPosition > 0) {
            const reconstructedJson = withoutTruncation.slice(0, bestPosition + 1);
            try {
              parsedContent = JSON.parse(reconstructedJson);
              isJsonContent = isComplexValue(parsedContent);
            } catch (e) {
              // If reconstruction fails, try the original
              try {
                parsedContent = JSON.parse(jsonString);
                isJsonContent = isComplexValue(parsedContent);
              } catch (e2) {
                // If both fail, use raw content
                parsedContent = message.content;
                isJsonContent = false;
              }
            }
          } else {
            // Fallback to original parsing
            try {
              parsedContent = JSON.parse(jsonString);
              isJsonContent = isComplexValue(parsedContent);
            } catch (e) {
              parsedContent = message.content;
              isJsonContent = false;
            }
          }
        } else {
          parsedContent = JSON.parse(jsonString);
          isJsonContent = isComplexValue(parsedContent);
        }
      } else {
        // Not JSON, use as is
        parsedContent = message.content;
        isJsonContent = false;
      }
    }
  } catch (error) {
    // Content is not JSON, use as is
    parsedContent = message.content;
    isJsonContent = false;
  }

  // Check for special UI requirements - also check raw content for approval patterns
  let hasApproval = false;
  let hasFoundationApproval = false;
  let hasExchangeSearch = false;
  let hasExchangeAddition = false;
  let hasError = false;
  
  if (isJsonContent) {
    hasApproval = isApprovalRequired(parsedContent);
    hasFoundationApproval = isFoundationApprovalRequired(parsedContent);
    hasExchangeSearch = isExchangeSearchResults(parsedContent);
    hasExchangeAddition = isExchangeAdditionResults(parsedContent);
    hasError = isErrorContent(parsedContent);
  }
  
  // Log special UI detection
  useEffect(() => {
    if (hasFoundationApproval) {
      logSpecialUI('foundation_approval', parsedContent, message.name);
    } else if (hasApproval) {
      logSpecialUI('approval', parsedContent, message.name);
    } else if (hasExchangeSearch) {
      logSpecialUI('exchange_search', parsedContent, message.name);
    } else if (hasExchangeAddition) {
      logSpecialUI('exchange_addition', parsedContent, message.name);
    } else if (hasError) {
      logSpecialUI('error', parsedContent, message.name);
    }
  }, [hasFoundationApproval, hasApproval, hasExchangeSearch, hasExchangeAddition, hasError, parsedContent, message.name, logSpecialUI]);
  
  // Also check for interrupt data in parsed JSON content (when it's nested in error responses)
  if (!hasApproval && isJsonContent && parsedContent?.details) {
    const detailsStr = parsedContent.details;
    
    // Check for interrupt data in the details field
    const interruptMatch = detailsStr.match(/Interrupt\(value=(\{.*?)(?:\}\)|$)/s);
    if (interruptMatch) {
      try {
        // Extract the interrupt value and clean it up for JSON parsing
        let interruptValueStr = interruptMatch[1];
        
        // If the string doesn't end with }, it might be truncated, try to find a good stopping point
        if (!interruptValueStr.endsWith('}')) {
          let braceCount = 0;
          let lastGoodIndex = -1;
          
          for (let i = 0; i < interruptValueStr.length; i++) {
            if (interruptValueStr[i] === '{') braceCount++;
            else if (interruptValueStr[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastGoodIndex = i;
                break;
              }
            }
          }
          
          if (lastGoodIndex > 0) {
            interruptValueStr = interruptValueStr.substring(0, lastGoodIndex + 1);
          }
        }
        
        // Replace single quotes with double quotes for JSON parsing
        interruptValueStr = interruptValueStr.replace(/'/g, '"');
        
        // Handle Python-style boolean values
        interruptValueStr = interruptValueStr.replace(/\bTrue\b/g, 'true');
        interruptValueStr = interruptValueStr.replace(/\bFalse\b/g, 'false');
        interruptValueStr = interruptValueStr.replace(/\bNone\b/g, 'null');
        
        // Parse the JSON
        const interruptValue = JSON.parse(interruptValueStr);
        
        // Check if this is an approval format interrupt
        if (interruptValue.entity_type && interruptValue.entity_summary && interruptValue.action) {
          hasApproval = true; // Use approval component
          parsedContent = interruptValue;
          isJsonContent = true;
        }
      } catch (e) {
        // Fallback: try to extract basic fields even if JSON parsing fails
        const entityTypeMatch = detailsStr.match(/entity_type['"]?\s*:\s*['"]([^'"]+)['"]/);
        const entitySummaryMatch = detailsStr.match(/entity_summary['"]?\s*:\s*['"]([^'"]+)['"]/);
        const actionMatch = detailsStr.match(/action['"]?\s*:\s*['"]([^'"]+)['"]/);
        const impactMatch = detailsStr.match(/impact['"]?\s*:\s*['"]([^'"]+)['"]/);
        
        // Try to extract entity_details
        const entityDetailsMatch = detailsStr.match(/entity_details['"]?\s*:\s*\{([^}]+)\}/);
        let entityDetails = {};
        if (entityDetailsMatch) {
          try {
            const detailsStr = entityDetailsMatch[1];
            const nameMatch = detailsStr.match(/name['"]?\s*:\s*['"]([^'"]+)['"]/);
            const flowTypeMatch = detailsStr.match(/flow_type['"]?\s*:\s*['"]([^'"]+)['"]/);
            const flowPropertyMatch = detailsStr.match(/flow_property['"]?\s*:\s*['"]([^'"]+)['"]/);
            
            entityDetails = {
              name: nameMatch ? nameMatch[1] : 'Unknown',
              flow_type: flowTypeMatch ? flowTypeMatch[1] : 'Unknown',
              flow_property: flowPropertyMatch ? flowPropertyMatch[1] : 'Unknown'
            };
          } catch (e) {
            // Silent fail for entity_details parsing
          }
        }
        
        if (entityTypeMatch && entitySummaryMatch && actionMatch) {
          hasApproval = true;
          parsedContent = {
            entity_type: entityTypeMatch[1],
            entity_summary: entitySummaryMatch[1],
            action: actionMatch[1],
            impact: impactMatch ? impactMatch[1] : "Will create a new entity",
            entity_details: entityDetails
          };
          isJsonContent = true;
        }
      }
    }
  }
  
  // Also check raw content for approval patterns (in case JSON parsing failed)
  if (!hasApproval && typeof message.content === "string") {
    const rawContent = message.content.toLowerCase();
    
    // Check for interrupt data in the content (new LangGraph interrupt format)
    const interruptMatch = message.content.match(/Interrupt\(value=(\{.*?)(?:\}\)|$)/s);
    if (interruptMatch) {
      try {
        // Extract the interrupt value and clean it up for JSON parsing
        let interruptValueStr = interruptMatch[1];
        
        // If the string doesn't end with }, it might be truncated, try to find a good stopping point
        if (!interruptValueStr.endsWith('}')) {
          let braceCount = 0;
          let lastGoodIndex = -1;
          
          for (let i = 0; i < interruptValueStr.length; i++) {
            if (interruptValueStr[i] === '{') braceCount++;
            else if (interruptValueStr[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastGoodIndex = i;
                break;
              }
            }
          }
          
          if (lastGoodIndex > 0) {
            interruptValueStr = interruptValueStr.substring(0, lastGoodIndex + 1);
          }
        }
        
        // Replace single quotes with double quotes for JSON parsing
        interruptValueStr = interruptValueStr.replace(/'/g, '"');
        
        // Handle Python-style boolean values
        interruptValueStr = interruptValueStr.replace(/\bTrue\b/g, 'true');
        interruptValueStr = interruptValueStr.replace(/\bFalse\b/g, 'false');
        interruptValueStr = interruptValueStr.replace(/\bNone\b/g, 'null');
        
        // Parse the JSON
        const interruptValue = JSON.parse(interruptValueStr);
        
        // Check if this is an approval format interrupt
        if (interruptValue.entity_type && interruptValue.entity_summary && interruptValue.action) {
          hasApproval = true; // Use approval component
          parsedContent = interruptValue;
          isJsonContent = true;
        }
      } catch (e) {
        // Fallback: try to extract basic fields even if JSON parsing fails
        const entityTypeMatch = message.content.match(/entity_type['"]?\s*:\s*['"]([^'"]+)['"]/);
        const entitySummaryMatch = message.content.match(/entity_summary['"]?\s*:\s*['"]([^'"]+)['"]/);
        const actionMatch = message.content.match(/action['"]?\s*:\s*['"]([^'"]+)['"]/);
        const impactMatch = message.content.match(/impact['"]?\s*:\s*['"]([^'"]+)['"]/);
        
        // Try to extract entity_details
        const entityDetailsMatch = message.content.match(/entity_details['"]?\s*:\s*\{([^}]+)\}/);
        let entityDetails = {};
        if (entityDetailsMatch) {
          try {
            const detailsStr = entityDetailsMatch[1];
            const nameMatch = detailsStr.match(/name['"]?\s*:\s*['"]([^'"]+)['"]/);
            const flowTypeMatch = detailsStr.match(/flow_type['"]?\s*:\s*['"]([^'"]+)['"]/);
            const flowPropertyMatch = detailsStr.match(/flow_property['"]?\s*:\s*['"]([^'"]+)['"]/);
            
            entityDetails = {
              name: nameMatch ? nameMatch[1] : 'Unknown',
              flow_type: flowTypeMatch ? flowTypeMatch[1] : 'Unknown',
              flow_property: flowPropertyMatch ? flowPropertyMatch[1] : 'Unknown'
            };
          } catch (e) {
            // Silent fail for entity_details parsing
          }
        }
        
        if (entityTypeMatch && entitySummaryMatch && actionMatch) {
          hasApproval = true;
          parsedContent = {
            entity_type: entityTypeMatch[1],
            entity_summary: entitySummaryMatch[1],
            action: actionMatch[1],
            impact: impactMatch ? impactMatch[1] : "Will create a new entity",
            entity_details: entityDetails
          };
          isJsonContent = true;
        }
      }
    }
    
    // Fallback: check for old approval patterns
    if (rawContent.includes("approval_required") || rawContent.includes("approval required")) {
      hasApproval = true;
      
      // Try to extract basic info from raw content for approval workflow
      if (!isJsonContent) {
        const messageMatch = message.content.match(/message['"]?\s*:\s*['"]([^'"]+)['"]/);
        const entityTypeMatch = message.content.match(/entity_type['"]?\s*:\s*['"]([^'"]+)['"]/);
        const entitySummaryMatch = message.content.match(/entity_summary['"]?\s*:\s*['"]([^'"]+)['"]/);
        const actionMatch = message.content.match(/action['"]?\s*:\s*['"]([^'"]+)['"]/);
        const impactMatch = message.content.match(/impact['"]?\s*:\s*['"]([^'"]+)['"]/);
        
        // Try to extract entity_details if present
        const entityDetailsMatch = message.content.match(/entity_details['"]?\s*:\s*\{([^}]+)\}/);
        let entityDetails = {};
        if (entityDetailsMatch) {
          try {
            // Try to parse the entity_details object
            const detailsStr = '{' + entityDetailsMatch[1] + '}';
            entityDetails = JSON.parse(detailsStr.replace(/'/g, '"'));
          } catch (e) {
            // Silent fail for entity_details parsing
          }
        }
        
        parsedContent = {
          status: "approval_required",
          message: messageMatch ? messageMatch[1] : "Approval required",
          approval_request: {
            entity_type: entityTypeMatch ? entityTypeMatch[1] : "unknown",
            entity_summary: entitySummaryMatch ? entitySummaryMatch[1] : "Entity requires approval",
            action: actionMatch ? actionMatch[1] : "create",
            impact: impactMatch ? impactMatch[1] : "Will create a new entity",
            entity_details: entityDetails
          }
        };
        isJsonContent = true;
      }
    }
  }
  
  // Log the tool result message for debugging after content parsing
  useEffect(() => {
    // Enhanced logging with content analysis
    const contentAnalysis = {
      type: typeof message.content,
      length: typeof message.content === 'string' ? message.content.length : JSON.stringify(message.content).length,
      isJson: isJsonContent,
      parsed: parsedContent
    };


  // Minimal logging - only log once when special UI is first detected
  if ((hasApproval || hasFoundationApproval || hasExchangeSearch || hasExchangeAddition || hasError) && !hasLoggedSpecialUI) {
    console.log('🔍 Special UI detected:', {
      toolName: message.name,
      type: hasFoundationApproval ? 'foundation_approval' : 
            hasExchangeSearch ? 'exchange_search' :
            hasExchangeAddition ? 'exchange_addition' :
            hasError ? 'error' :
            hasApproval ? 'approval' : 
            'none'
    });
    setHasLoggedSpecialUI(true);
  }

    logMessage(message, {
      messageType: 'tool',
      toolName: message.name,
      toolCallId: message.tool_call_id,
      status: 'completed',
      contentLength: contentAnalysis.length,
      contentType: contentAnalysis.isJson ? 'json' : 'string',
      hasSpecialUI: hasApproval || hasFoundationApproval || hasExchangeSearch || hasExchangeAddition || hasError,
      specialUIType: (hasFoundationApproval ? 'foundation_approval' :
                    hasExchangeSearch ? 'exchange_search' :
                    hasExchangeAddition ? 'exchange_addition' :
                    hasError ? 'error' :
                    hasApproval ? 'approval' : 
                    'none') as 'approval' | 'foundation_approval' | 'exchange_search' | 'exchange_addition' | 'error' | 'none'
    });

    // Trigger navigator refresh only after product_system_foundation tool call
    if (message.name === 'product_system_foundation' && window.refreshNavigator) {
      try {
        window.refreshNavigator();
      } catch (error) {
        console.error('Failed to trigger navigator refresh:', error);
      }
    }

  }, [message, logMessage, isJsonContent, parsedContent, hasApproval, hasFoundationApproval, hasExchangeSearch, hasExchangeAddition, hasError]);

  // Handle foundation approval requests
  if (hasFoundationApproval) {
    return (
      <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
        <EntityApproval 
          content={parsedContent} 
          toolCallId={getToolCallId(message)}
          toolName={message.name}
        />
      </div>
    );
  }

  // Handle exchange search results
  if (hasExchangeSearch) {
    return (
      <div className="w-full grid grid-rows-[1fr_auto] gap-2">
        <ExchangeSearchResults 
          content={parsedContent} 
          toolCallId={getToolCallId(message)}
          toolName={message.name}
        />
      </div>
    );
  }

  // Handle exchange addition results as human messages
  if (hasExchangeAddition) {
    const humanMessage = formatExchangeAdditionSuccess(parsedContent);
    
    return (
      <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
        <div className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap">
          {humanMessage}
        </div>
      </div>
    );
  }

  // Handle errors by formatting them as human messages
  if (hasError) {
    const errorData = extractErrorData(parsedContent);
    const humanMessage = formatErrorAsHumanMessage(errorData);
    
    return (
      <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
        <div className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap">
          {humanMessage}
        </div>
      </div>
    );
  }

  // Handle generic approval requests
  if (hasApproval) {
    return (
      <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
        <EntityApproval 
          content={parsedContent} 
          toolCallId={getToolCallId(message)}
          toolName={message.name}
        />
      </div>
    );
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;
  const displayedContent =
    shouldTruncate && !isExpanded
      ? contentStr.length > 500
        ? contentStr.slice(0, 500) + "..."
        : contentLines.slice(0, 4).join("\n") + "\n..."
      : contentStr;

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {message.name ? (
              <h3 className="font-medium text-gray-900 dark:text-white">
                Tool Result:{" "}
                <code className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-gray-900 dark:text-gray-100">
                  {message.name}
                </code>
              </h3>
            ) : (
              <h3 className="font-medium text-gray-900 dark:text-white">Tool Result</h3>
            )}
            {message.tool_call_id && (
              <code className="ml-2 rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-gray-100">
                {message.tool_call_id}
              </code>
            )}
          </div>
        </div>
        <motion.div
          className="min-w-full bg-gray-100 dark:bg-gray-900"
          initial={false}
          animate={{ height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3">
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.div
                key={isExpanded ? "expanded" : "collapsed"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {isJsonContent ? (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {(Array.isArray(parsedContent)
                        ? parsedContent
                        : Object.entries(parsedContent)
                      ).map((item, argIdx) => {
                        const [key, value] = Array.isArray(parsedContent)
                          ? [argIdx, item]
                          : [item[0], item[1]];
                        
                        // Truncate complex values when not expanded
                        const displayValue = !isExpanded && shouldTruncateValue(value)
                          ? truncateValue(value)
                          : value;
                        
                        return (
                          <tr key={argIdx}>
                            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                              {isComplexValue(displayValue) ? (
                                <code className="rounded bg-gray-50 dark:bg-gray-800 px-2 py-1 font-mono text-sm break-all text-gray-900 dark:text-gray-100">
                                  {typeof displayValue === "string" ? displayValue : JSON.stringify(displayValue, null, 2)}
                                </code>
                              ) : (
                                String(displayValue)
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <code className="block text-sm text-gray-900 dark:text-gray-100">{displayedContent}</code>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {((shouldTruncate && !isJsonContent) ||
            (isJsonContent && shouldTruncate)) && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 dark:border-gray-700 py-2 text-gray-500 dark:text-gray-400 transition-all duration-200 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
