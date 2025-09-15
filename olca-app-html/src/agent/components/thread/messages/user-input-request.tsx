import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import { HelpCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface UserInputRequestProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}

export function UserInputRequest({ content, toolCallId, toolName }: UserInputRequestProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSuggestion, setNewSuggestion] = useState("");
  
  const stream = useStreamContext();
  
  // Handle both new approval format and old user input format
  const isNewApprovalFormat = content?.entity_type && content?.entity_summary && content?.action;
  
  // For new approval format, create the question and options
  const question = isNewApprovalFormat 
    ? `Do you want to ${content.action} this ${content.entity_type}?`
    : content?.question;
    
  const options = isNewApprovalFormat 
    ? [
        { id: "approve", label: "Approve", description: `Yes, ${content.action} the ${content.entity_type}` },
        { id: "reject", label: "Reject", description: `No, do not ${content.action} the ${content.entity_type}` }
      ]
    : content?.options || [];
    
  const context = isNewApprovalFormat 
    ? {
        entity_type: content.entity_type,
        entity_summary: content.entity_summary,
        action: content.action,
        impact: content.impact,
        ...content.entity_details
      }
    : content?.context;

  // No debug logging to avoid re-render spam

  // Helper functions for suggestions
  const addSuggestion = () => {
    if (newSuggestion.trim() && !suggestions.includes(newSuggestion.trim())) {
      setSuggestions([...suggestions, newSuggestion.trim()]);
      setNewSuggestion("");
    }
  };

  const removeSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  // Enhanced entity details rendering (from approval-workflow.tsx)
  const renderEntityDetails = () => {
    if (!isNewApprovalFormat) return null;
    
    const entityDetails = content?.entity_details;
    
    // If no entity_details, try to show basic info
    if (!entityDetails || Object.keys(entityDetails).length === 0) {
      const basicInfo = {
        'Entity Type': content?.entity_type || 'Unknown',
        'Action': content?.action || 'create',
        'Impact': content?.impact || 'Will create a new entity',
        'Status': 'Pending Approval'
      };
      
      return (
        <div className="space-y-2">
          {Object.entries(basicInfo).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1">
              <span className="font-medium text-sm text-gray-600 capitalize">
                {key.replace(/_/g, " ")}:
              </span>
              <span className="text-sm text-gray-900">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    const entries = Object.entries(entityDetails);
    
    if (entries.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          No additional details available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between py-1">
            <span className="font-medium text-sm text-gray-600 capitalize">
              {key.replace(/_/g, " ")}:
            </span>
            <span className="text-sm text-gray-900">
              {Array.isArray(value) ? (
                <div className="space-y-1">
                  {value.map((item, idx) => (
                    <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                      {typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)}
                    </div>
                  ))}
                </div>
              ) : typeof value === "object" ? (
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-w-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                String(value)
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the response based on the format
      let response;
      
      if (isNewApprovalFormat) {
        // For new approval format, send the decision data directly as expected by backend
        response = {
          decision: selectedOption, // "approve" or "reject"
          reason: additionalNotes.trim() || (selectedOption === "reject" ? "User rejected the operation" : "User approved the operation"),
          ...(selectedOption === "reject" && suggestions.length > 0 && { suggestions })
        };
      } else {
        // For old user input format, maintain backward compatibility
        response = {
          tool_response: {
            tool_name: toolName || "request_user_input",
            tool_call_id: toolCallId,
            user_input: {
              selected_option: selectedOption,
              additional_notes: additionalNotes.trim()
            }
          }
        };
      }

      // Use LangGraph Command primitive to resume the interrupted execution
      stream.submit(
        {},
        {
          command: {
            resume: response,
          },
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );

      const actionText = selectedOption === "approve" ? "approved" : "rejected";
      toast.success(`Operation ${actionText} successfully`);
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`${isNewApprovalFormat ? 'border-orange-200 bg-orange-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {isNewApprovalFormat ? (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          ) : (
            <HelpCircle className="h-5 w-5 text-blue-600" />
          )}
          <CardTitle className={isNewApprovalFormat ? "text-orange-900" : "text-blue-900"}>
            {isNewApprovalFormat ? "Approval Required" : "User Input Required"}
          </CardTitle>
        </div>
        <CardDescription className={isNewApprovalFormat ? "text-orange-700" : "text-blue-700"}>
          {isNewApprovalFormat 
            ? (content.message || `Ready to ${content.action} ${content.entity_type?.replace(/_/g, " ")}`)
            : "Please provide your input to continue the workflow"
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entity Summary (for new approval format) */}
        {isNewApprovalFormat && (
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">
              {content?.entity_summary || content?.entity_type?.replace(/_/g, " ")}
            </h4>
            {content?.impact && (
              <p className="text-sm text-gray-600 mb-3">
                <strong>Impact:</strong> {content.impact}
              </p>
            )}
            
            {/* Expandable Details */}
            <div className="border-t pt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? "Hide" : "Show"} Details
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t">
                      {renderEntityDetails()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Context Information (for old user input format) */}
        {!isNewApprovalFormat && context && (
          <div className="bg-white p-3 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">Context</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {Object.entries(context).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-3">{question}</h4>
          
          {/* Options */}
          <div className="space-y-3">
            {options.map((option: any, index: number) => {
              const isApprove = option.id === "approve";
              const isReject = option.id === "reject";
              const isSelected = selectedOption === option.id;
              
              return (
                <div
                  key={option.id || index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? isApprove 
                        ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                        : isReject
                        ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                        : "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? isApprove
                          ? "border-green-500 bg-green-500"
                          : isReject
                          ? "border-red-500 bg-red-500"
                          : "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isSelected
                          ? isApprove
                            ? "text-green-900"
                            : isReject
                            ? "text-red-900"
                            : "text-blue-900"
                          : "text-gray-900"
                      }`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className={`text-sm mt-1 ${
                          isSelected
                            ? isApprove
                              ? "text-green-700"
                              : isReject
                              ? "text-red-700"
                              : "text-blue-700"
                            : "text-gray-600"
                        }`}>
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="additional-notes" className="text-sm font-medium">
            {isNewApprovalFormat 
              ? (selectedOption === "reject" ? "Reason for Rejection" : "Additional Notes (Optional)")
              : "Additional Notes (Optional)"
            }
            {isNewApprovalFormat && selectedOption === "reject" && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="additional-notes"
            placeholder={
              isNewApprovalFormat 
                ? (selectedOption === "reject" 
                    ? "Required: Explain why you're rejecting this request..."
                    : "Optional: Add any notes about this approval...")
                : "Add any additional context or notes..."
            }
            value={additionalNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Suggestions for Rejection (only for new approval format) */}
        {isNewApprovalFormat && selectedOption === "reject" && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Suggestions for Improvement (Optional)</Label>
            
            {/* Existing Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="text-sm flex-1">{suggestion}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSuggestion(index)}
                      className="h-6 w-6 p-0"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Suggestion */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a suggestion..."
                value={newSuggestion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSuggestion(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSuggestion();
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={addSuggestion}
                disabled={!newSuggestion.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              !selectedOption || 
              (isNewApprovalFormat && selectedOption === "reject" && !additionalNotes.trim())
            }
            className={`min-w-[120px] ${
              isNewApprovalFormat && selectedOption === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : isNewApprovalFormat && selectedOption === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : ""
            }`}
          >
            {isSubmitting 
              ? "Submitting..." 
              : isNewApprovalFormat 
                ? selectedOption === "approve" 
                  ? "Approve" 
                  : selectedOption === "reject"
                  ? "Reject"
                  : "Submit Response"
                : "Submit Response"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
