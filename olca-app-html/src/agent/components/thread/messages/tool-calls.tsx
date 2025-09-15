import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ApprovalWorkflow } from "./approval-workflow";
import { UserInputRequest } from "./user-input-request";
import { ValidationDisplay } from "./validation-display";

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
function isApprovalRequired(content: any): boolean {
  const hasStatusApproval = content?.status === "approval_required" && content?.approval_request;
  const hasDirectApproval = content?.approval_required === true && content?.entity_type;
  
  // Debug logging for approval detection
  if (hasStatusApproval || hasDirectApproval) {
    console.log('🔍 Approval Detection:', {
      hasStatusApproval,
      hasDirectApproval,
      status: content?.status,
      hasApprovalRequest: !!content?.approval_request,
      approvalRequired: content?.approval_required,
      entityType: content?.entity_type
    });
  }
  
  return hasStatusApproval || hasDirectApproval;
}

function isUserInputRequired(content: any): boolean {
  return content?.user_input_required === true && content?.question;
}

function isValidationComplete(content: any): boolean {
  return content?.status === "validation_complete" && content?.process_id;
}

function getToolCallId(message: ToolMessage): string | undefined {
  return message.tool_call_id;
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <h3 className="font-medium text-gray-900">
                {tc.name}
                {tc.id && (
                  <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                    {tc.id}
                  </code>
                )}
              </h3>
            </div>
            {hasArgs ? (
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(args).map(([key, value], argIdx) => (
                    <tr key={argIdx}>
                      <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                        {key}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {isComplexValue(value) ? (
                          <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
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
              <code className="block p-3 text-sm">{"{}"}</code>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
              console.log('✅ Successfully reconstructed truncated JSON');
            } catch (e) {
              console.warn('❌ Failed to reconstruct JSON, trying original:', e);
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
    console.warn('Failed to parse tool content as JSON:', error);
    parsedContent = message.content;
    isJsonContent = false;
  }

  // Check for special UI requirements - also check raw content for approval patterns
  let hasApproval = false;
  let hasUserInput = false;
  let hasValidation = false;
  
  if (isJsonContent) {
    hasApproval = isApprovalRequired(parsedContent);
    hasUserInput = isUserInputRequired(parsedContent);
    hasValidation = isValidationComplete(parsedContent);
  }
  
  // Also check raw content for approval patterns (in case JSON parsing failed)
  if (!hasApproval && typeof message.content === "string") {
    const rawContent = message.content.toLowerCase();
    if (rawContent.includes("approval_required") || rawContent.includes("approval required")) {
      hasApproval = true;
      console.log('🔍 Approval detected in raw content for tool:', message.name);
      
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
            console.warn('Failed to parse entity_details:', e);
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
  
  // Debug logging for special UI detection
  if (hasApproval || hasUserInput || hasValidation) {
    console.group(`🔧 Tool Result: ${message.name || 'Unknown'}`);
    console.log('📋 Message:', {
      id: message.id,
      name: message.name,
      tool_call_id: message.tool_call_id,
      content_type: typeof message.content,
      is_json: isJsonContent
    });
    console.log('📄 Raw Content:', message.content);
    console.log('📄 Parsed Content:', parsedContent);
    console.log('🎯 Special UI Detection:', {
      approval_required: hasApproval,
      user_input_required: hasUserInput,
      validation_complete: hasValidation
    });
    
    // Additional debugging for approval content structure
    if (hasApproval) {
      console.log('🔍 Approval Content Structure:', {
        hasApprovalRequest: !!parsedContent?.approval_request,
        approvalRequestKeys: parsedContent?.approval_request ? Object.keys(parsedContent.approval_request) : [],
        hasEntityDetails: !!parsedContent?.approval_request?.entity_details,
        entityDetailsKeys: parsedContent?.approval_request?.entity_details ? Object.keys(parsedContent.approval_request.entity_details) : [],
        entityDetailsContent: parsedContent?.approval_request?.entity_details
      });
    }
    
    console.groupEnd();
  }
  
  // Additional debug logging for approval detection specifically
  if (message.name === 'create_process_for_system' || message.name?.includes('process')) {
    console.group(`🔍 Process Tool Debug: ${message.name}`);
    console.log('📄 Raw Content:', message.content);
    console.log('📄 Parsed Content:', parsedContent);
    console.log('🔍 Approval Detection Result:', hasApproval);
    console.log('📊 Content Keys:', Object.keys(parsedContent || {}));
    console.groupEnd();
  }

  if (hasApproval) {
    return (
      <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
        <ApprovalWorkflow 
          content={parsedContent} 
          toolCallId={getToolCallId(message)}
          toolName={message.name}
        />
      </div>
    );
  }

  if (hasUserInput) {
    return (
      <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
        <UserInputRequest 
          content={parsedContent} 
          toolCallId={getToolCallId(message)}
          toolName={message.name}
        />
      </div>
    );
  }

  if (hasValidation) {
    return (
      <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
        <ValidationDisplay 
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
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {message.name ? (
              <h3 className="font-medium text-gray-900">
                Tool Result:{" "}
                <code className="rounded bg-gray-100 px-2 py-1">
                  {message.name}
                </code>
              </h3>
            ) : (
              <h3 className="font-medium text-gray-900">Tool Result</h3>
            )}
            {message.tool_call_id && (
              <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                {message.tool_call_id}
              </code>
            )}
          </div>
        </div>
        <motion.div
          className="min-w-full bg-gray-100"
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
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
                            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {isComplexValue(displayValue) ? (
                                <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
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
                  <code className="block text-sm">{displayedContent}</code>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {((shouldTruncate && !isJsonContent) ||
            (isJsonContent && shouldTruncate)) && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 py-2 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-600"
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
