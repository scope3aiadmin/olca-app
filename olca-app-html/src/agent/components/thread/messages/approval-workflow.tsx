import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";

interface ApprovalWorkflowProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}

export function ApprovalWorkflow({ content, toolCallId, toolName }: ApprovalWorkflowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSuggestion, setNewSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const stream = useStreamContext();
  
  // Handle both data structures: nested approval_request or flat structure
  const approvalRequest = content.approval_request || content;
  const entityDetails = approvalRequest?.entity_details;

  // Debug logging for approval workflow (only on mount)
  React.useEffect(() => {
    console.group(`🔐 Approval Workflow: ${toolName || 'Unknown'}`);
    console.log('📋 Tool Call ID:', toolCallId);
    console.log('📄 Content:', content);
    console.log('🎯 Approval Request:', approvalRequest);
    console.log('📊 Entity Details:', entityDetails);
    console.groupEnd();
  }, []); // Only run once on mount

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Please select a decision");
      return;
    }

    if (decision === "reject" && !reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = {
        tool_response: {
          tool_name: toolName || "request_user_approval",
          tool_call_id: toolCallId,
          approval_decision: {
            decision,
            reason: reason.trim(),
            ...(decision === "reject" && suggestions.length > 0 && { suggestions })
          }
        }
      };

      // Debug logging for response submission
      console.group(`📤 Submitting Approval Response: ${toolName || 'Unknown'}`);
      console.log('🎯 Decision:', decision);
      console.log('📝 Reason:', reason.trim());
      console.log('💡 Suggestions:', suggestions);
      console.log('📋 Full Response:', response);
      console.log('🔗 Tool Call ID:', toolCallId);

      // Submit the response as a human message
      const humanMessage = {
        id: crypto.randomUUID(),
        type: "human" as const,
        content: [{ type: "text" as const, text: JSON.stringify(response) }]
      };

      console.log('📨 Human Message:', humanMessage);
      console.groupEnd();

      stream.submit(
        { messages: [humanMessage] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );

      toast.success("Response submitted successfully");
    } catch (error) {
      console.error("❌ Error submitting approval response:", error);
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSuggestion = () => {
    if (newSuggestion.trim() && !suggestions.includes(newSuggestion.trim())) {
      setSuggestions([...suggestions, newSuggestion.trim()]);
      setNewSuggestion("");
    }
  };

  const removeSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  const renderEntityDetails = () => {
    console.log('🔍 renderEntityDetails called');
    console.log('📊 entityDetails:', entityDetails);
    console.log('📊 approvalRequest:', approvalRequest);
    
    // If no entity_details, try to show basic info from approval_request
    if (!entityDetails || Object.keys(entityDetails).length === 0) {
      console.log('❌ No entityDetails found, showing basic info');
      
      const basicInfo = {
        'Entity Type': approvalRequest?.entity_type || 'Unknown',
        'Action': approvalRequest?.action || 'create',
        'Impact': approvalRequest?.impact || 'Will create a new entity',
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
    console.log('📋 entries:', entries);
    
    if (entries.length === 0) {
      console.log('❌ No entries in entityDetails');
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

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-900">Approval Required</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          {content.message || approvalRequest?.message || `Ready to ${approvalRequest?.action || 'create'} ${approvalRequest?.entity_type?.replace(/_/g, " ")}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entity Summary */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-2">
            {approvalRequest?.entity_summary || approvalRequest?.entity_type?.replace(/_/g, " ")}
          </h4>
          {approvalRequest?.impact && (
            <p className="text-sm text-gray-600 mb-3">
              <strong>Impact:</strong> {approvalRequest.impact}
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

        {/* Decision Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Decision</Label>
          <div className="flex gap-3">
            <Button
              variant={decision === "approve" ? "default" : "outline"}
              onClick={() => setDecision("approve")}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            <Button
              variant={decision === "reject" ? "destructive" : "outline"}
              onClick={() => setDecision("reject")}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>

        {/* Reason Input */}
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm font-medium">
            Reason {decision === "reject" && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="reason"
            placeholder={
              decision === "approve" 
                ? "Optional: Add any notes about this approval..."
                : "Required: Explain why you're rejecting this request..."
            }
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Suggestions for Rejection */}
        {decision === "reject" && (
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
            disabled={isSubmitting || !decision || (decision === "reject" && !reason.trim())}
            className="min-w-[120px]"
          >
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
