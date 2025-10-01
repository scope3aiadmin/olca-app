// Error message formatter utility
// Converts structured error data into conversational human messages

export interface ErrorData {
  type: 'rollback' | 'exchange_addition' | 'validation' | 'generic';
  message: string;
  details?: string;
  suggestion?: string;
  validation_errors?: string[];
  validation_warnings?: string[];
  failed_exchanges?: Array<{
    flow_id: string;
    flow_name: string;
    error: string;
  }>;
  successful_exchanges?: number;
  total_attempted?: number;
  rollbackErrors?: string[];
  process_name?: string;
  is_valid?: boolean;
  exchange_summary?: {
    total_exchanges: number;
    input_exchanges: number;
    output_exchanges: number;
    quantitative_reference_exchanges: number;
  };
  next_steps?: string[];
  process_id?: string;
}

export function formatErrorAsHumanMessage(errorData: ErrorData): string {
  const { type, message, details, suggestion, validation_errors = [], validation_warnings = [], 
          failed_exchanges = [], successful_exchanges = 0, total_attempted = 0, 
          rollbackErrors = [], process_name, is_valid, exchange_summary, 
          next_steps = [], process_id } = errorData;

  let humanMessage = '';

  switch (type) {
    case 'rollback':
      humanMessage = `❌ **Foundation Creation Failed**\n\n`;
      humanMessage += `**Error:** ${message}\n\n`;
      
      if (details) {
        humanMessage += `**Details:** ${details}\n\n`;
      }
      
      if (rollbackErrors.length > 0) {
        humanMessage += `**Rollback Errors:**\n`;
        rollbackErrors.forEach((error, idx) => {
          humanMessage += `• ${error}\n`;
        });
        humanMessage += '\n';
      }
      
      if (suggestion) {
        humanMessage += `**Suggestion:** ${suggestion}\n\n`;
      }
      
      humanMessage += `**Next Steps:**\n`;
      humanMessage += `• Review the error details above\n`;
      humanMessage += `• Check your product name and process name for any issues\n`;
      humanMessage += `• Verify database connection and permissions\n`;
      humanMessage += `• Try creating the foundation again with corrected information\n\n`;
      humanMessage += `What would you like me to do?`;
      break;

    case 'exchange_addition':
      humanMessage = `❌ **Exchange Addition Failed**\n\n`;
      humanMessage += `**Error:** ${message}\n\n`;
      
      if (total_attempted > 0) {
        const failed = total_attempted - successful_exchanges;
        humanMessage += `**Summary:**\n`;
        humanMessage += `• Total attempted: ${total_attempted}\n`;
        humanMessage += `• Failed: ${failed}\n`;
        if (successful_exchanges > 0) {
          humanMessage += `• Succeeded: ${successful_exchanges}\n`;
        }
        humanMessage += '\n';
      }
      
      if (validation_errors.length > 0) {
        humanMessage += `**Validation Errors:**\n`;
        validation_errors.forEach((error, idx) => {
          humanMessage += `• ${error}\n`;
        });
        humanMessage += '\n';
      }
      
      if (failed_exchanges.length > 0) {
        humanMessage += `**Failed Exchanges:**\n`;
        failed_exchanges.forEach((exchange, idx) => {
          humanMessage += `• ${exchange.flow_name} (ID: ${exchange.flow_id}): ${exchange.error}\n`;
        });
        humanMessage += '\n';
      }
      
      if (details) {
        humanMessage += `**Details:** ${details}\n\n`;
      }
      
      if (suggestion) {
        humanMessage += `**Suggestion:** ${suggestion}\n\n`;
      }
      
      humanMessage += `What would you like me to do? You can ask me to retry, go back to searching, or try a different approach.`;
      break;

    case 'validation':
      if (is_valid) {
        humanMessage = `✅ **Process Validation Passed**\n\n`;
        humanMessage += `**Process:** ${process_name}\n\n`;
        
        if (exchange_summary) {
          humanMessage += `**Exchange Summary:**\n`;
          humanMessage += `• Total exchanges: ${exchange_summary.total_exchanges}\n`;
          humanMessage += `• Input exchanges: ${exchange_summary.input_exchanges}\n`;
          humanMessage += `• Output exchanges: ${exchange_summary.output_exchanges}\n`;
          humanMessage += `• Quantitative references: ${exchange_summary.quantitative_reference_exchanges}\n\n`;
        }
        
        if (process_id) {
          humanMessage += `**Process ID:** ${process_id}\n\n`;
        }
        
        humanMessage += `The process is ready to use! What would you like to do next?`;
      } else {
        humanMessage = `❌ **Process Validation Failed**\n\n`;
        humanMessage += `**Process:** ${process_name}\n\n`;
        
        if (validation_errors.length > 0) {
          humanMessage += `**Validation Errors:**\n`;
          validation_errors.forEach((error, idx) => {
            humanMessage += `• ${error}\n`;
          });
          humanMessage += '\n';
        }
        
        if (validation_warnings.length > 0) {
          humanMessage += `**Validation Warnings:**\n`;
          validation_warnings.forEach((warning, idx) => {
            humanMessage += `• ${warning}\n`;
          });
          humanMessage += '\n';
        }
        
        if (exchange_summary) {
          humanMessage += `**Exchange Summary:**\n`;
          humanMessage += `• Total exchanges: ${exchange_summary.total_exchanges}\n`;
          humanMessage += `• Input exchanges: ${exchange_summary.input_exchanges}\n`;
          humanMessage += `• Output exchanges: ${exchange_summary.output_exchanges}\n`;
          humanMessage += `• Quantitative references: ${exchange_summary.quantitative_reference_exchanges}\n\n`;
        }
        
        if (next_steps.length > 0) {
          humanMessage += `**Next Steps:**\n`;
          next_steps.forEach((step, idx) => {
            humanMessage += `• ${step}\n`;
          });
          humanMessage += '\n';
        }
        
        if (process_id) {
          humanMessage += `**Process ID:** ${process_id}\n\n`;
        }
        
        humanMessage += `What would you like me to do to fix these issues?`;
      }
      break;

    case 'generic':
    default:
      humanMessage = `❌ **Error Occurred**\n\n`;
      humanMessage += `**Message:** ${message}\n\n`;
      
      if (details) {
        humanMessage += `**Details:** ${details}\n\n`;
      }
      
      if (suggestion) {
        humanMessage += `**Suggestion:** ${suggestion}\n\n`;
      }
      
      humanMessage += `What would you like me to do?`;
      break;
  }

  return humanMessage;
}

// Helper function to detect error type from content
export function detectErrorType(content: any): ErrorData['type'] {
  if (content?.status === 'rollback_error' || content?.message?.includes('rollback')) {
    return 'rollback';
  }
  
  if (content?.status === 'exchange_addition_error' || content?.failed_exchanges) {
    return 'exchange_addition';
  }
  
  if (content?.process_id || content?.is_valid !== undefined || content?.validation_errors) {
    return 'validation';
  }
  
  return 'generic';
}

// Helper function to extract error data from content
export function extractErrorData(content: any): ErrorData {
  const type = detectErrorType(content);
  
  const baseData: ErrorData = {
    type,
    message: content?.message || 'An error occurred',
    details: content?.details,
    suggestion: content?.suggestion,
  };

  switch (type) {
    case 'rollback':
      return {
        ...baseData,
        rollbackErrors: content?.details ? 
          content.details.match(/Rollback errors:\s*(.+)/s)?.[1]
            ?.split(/Failed to delete/)
            .filter((error: string) => error.trim())
            .map((error: string) => `Failed to delete${error.trim()}`) || [] : [],
      };

    case 'exchange_addition':
      return {
        ...baseData,
        validation_errors: content?.validation_errors || [],
        failed_exchanges: content?.failed_exchanges || [],
        successful_exchanges: content?.successful_exchanges || 0,
        total_attempted: content?.total_attempted || 0,
      };

    case 'validation':
      return {
        ...baseData,
        process_name: content?.process_name,
        is_valid: content?.is_valid,
        validation_errors: content?.validation_errors || [],
        validation_warnings: content?.validation_warnings || [],
        exchange_summary: content?.exchange_summary,
        next_steps: content?.next_steps || [],
        process_id: content?.process_id,
      };

    default:
      return baseData;
  }
}
