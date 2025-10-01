// Test script to validate approval parsing logic
const testContent = "{'status': 'approval_required', 'message': \"Ready to create process 'Sunglasses Manufacturing Process'\", 'approval_request': {'entity_type': 'process', 'entity_summary': 'Process: Sunglasses Manufactu...";

console.log('🧪 Testing approval parsing logic...');
console.log('📄 Test content:', testContent);

// Simulate the parsing logic
function parseToolContent(content) {
  let parsedContent;
  let isJsonContent = false;

  try {
    if (typeof content === "string") {
      // Try to parse as JSON, but also handle single-quoted strings
      let jsonString = content;
      
      // Handle single-quoted JSON strings (common in Python output)
      // Check if it's a Python-style dict string (starts with single quote)
      if (jsonString.startsWith("'")) {
        // Remove outer single quote
        jsonString = jsonString.slice(1);
        console.log('🔄 Removed outer single quote:', jsonString);
      }
      
      // Now handle any remaining single quotes for keys
      if (jsonString.includes("'") && !jsonString.includes('"')) {
        // Replace single quotes with double quotes for JSON parsing
        jsonString = jsonString.replace(/'/g, '"');
        console.log('🔄 Converted single quotes to double quotes:', jsonString);
      }
      
      console.log('🔍 JSON string after processing:', jsonString);
      console.log('🔍 Starts with {:', jsonString.trim().startsWith('{'));
      console.log('🔍 Starts with [:', jsonString.trim().startsWith('['));
      
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
              isJsonContent = true;
              console.log('✅ Successfully reconstructed truncated JSON');
            } catch (e) {
              console.warn('❌ Failed to reconstruct JSON, trying original:', e);
              // If reconstruction fails, try the original
              try {
                parsedContent = JSON.parse(jsonString);
                isJsonContent = true;
              } catch (e2) {
                // If both fail, use raw content
                parsedContent = content;
                isJsonContent = false;
              }
            }
          } else {
            // Fallback to original parsing
            try {
              parsedContent = JSON.parse(jsonString);
              isJsonContent = true;
            } catch (e) {
              parsedContent = content;
              isJsonContent = false;
            }
          }
        } else {
          parsedContent = JSON.parse(jsonString);
          isJsonContent = true;
        }
      } else {
        // Not JSON, use as is
        parsedContent = content;
        isJsonContent = false;
      }
    }
  } catch (error) {
    // Content is not JSON, use as is
    console.warn('Failed to parse tool content as JSON:', error);
    parsedContent = content;
    isJsonContent = false;
  }

  return { parsedContent, isJsonContent };
}

// Test the parsing
const result = parseToolContent(testContent);
console.log('📊 Parsing result:', result);

// Test approval detection
function isApprovalRequired(content) {
  const hasStatusApproval = content?.status === "approval_required" && content?.approval_request;
  const hasDirectApproval = content?.approval_required === true && content?.entity_type;
  
  console.log('🔍 Approval Detection:', {
    hasStatusApproval,
    hasDirectApproval,
    status: content?.status,
    hasApprovalRequest: !!content?.approval_request,
    approvalRequired: content?.approval_required,
    entityType: content?.entity_type
  });
  
  return hasStatusApproval || hasDirectApproval;
}

const hasApproval = isApprovalRequired(result.parsedContent);
console.log('🎯 Has Approval:', hasApproval);

if (hasApproval) {
  const approvalRequest = result.parsedContent.approval_request || result.parsedContent;
  const entityDetails = approvalRequest?.entity_details;
  
  console.log('🔍 Approval Request:', approvalRequest);
  console.log('📊 Entity Details:', entityDetails);
  console.log('📊 Entity Details Keys:', entityDetails ? Object.keys(entityDetails) : 'No entity details');
}
