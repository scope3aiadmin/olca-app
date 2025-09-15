import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Info,
  Database,
  Settings,
  Package
} from "lucide-react";

interface FoundationCreationProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}

export function FoundationCreation({ content, toolCallId, toolName }: FoundationCreationProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSuggestion, setNewSuggestion] = useState("");
  
  const stream = useStreamContext();
  
  // Extract foundation data
  const approvalRequest = content?.approval_request || content;
  const foundationSummary = approvalRequest?.entity_details?.foundation_summary;
  const willCreate = approvalRequest?.entity_details?.will_create || [];
  const entityData = approvalRequest?.entity_data;
  
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

  // Enhanced entity data rendering with expandable sections
  const renderEntityData = () => {
    if (!entityData) return null;
    
    const { output_product, process, foundation_summary } = entityData;
    
    return (
      <div className="space-y-4">
        {/* Output Product */}
        {output_product && (
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-purple-600" />
              <h5 className="font-semibold text-purple-900">Output Product</h5>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="text-gray-900">{output_product.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Category:</span>
                <span className="text-gray-900">{output_product.category?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Reference Unit:</span>
                <span className="text-gray-900">{output_product.reference_unit?.name || 'N/A'}</span>
              </div>
              {output_product.description && (
                <div className="mt-2">
                  <span className="font-medium text-gray-600">Description:</span>
                  <p className="text-gray-900 mt-1">{output_product.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Process */}
        {process && (
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-purple-600" />
              <h5 className="font-semibold text-purple-900">Process</h5>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="text-gray-900">{process.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Category:</span>
                <span className="text-gray-900">{process.category?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Location:</span>
                <span className="text-gray-900">{process.location?.name || 'N/A'}</span>
              </div>
              {process.description && (
                <div className="mt-2">
                  <span className="font-medium text-gray-600">Description:</span>
                  <p className="text-gray-900 mt-1">{process.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Foundation Summary */}
        {foundation_summary && (
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-purple-600" />
              <h5 className="font-semibold text-purple-900">Foundation Summary</h5>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Product Name:</span>
                <span className="text-gray-900">{foundation_summary.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Output Amount:</span>
                <span className="text-gray-900">{foundation_summary.output_amount} {foundation_summary.output_unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Process Name:</span>
                <span className="text-gray-900">{foundation_summary.process_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Location:</span>
                <span className="text-gray-900">{foundation_summary.location}</span>
              </div>
            </div>
          </div>
        )}
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
      // Create the response for foundation approval
      const response = {
        decision: selectedOption, // "approve" or "reject"
        reason: additionalNotes.trim() || (selectedOption === "reject" ? "User rejected the foundation creation" : "User approved the foundation creation"),
        ...(selectedOption === "reject" && suggestions.length > 0 && { suggestions })
      };

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
      toast.success(`Foundation creation ${actionText} successfully`);
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-purple-900">
            Product System Foundation Creation
          </CardTitle>
        </div>
        <CardDescription className="text-purple-700">
          {approvalRequest?.message || `Ready to create foundation for ${foundationSummary?.product_name || 'product system'}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Foundation Summary */}
        {foundationSummary && (
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3">
              {approvalRequest?.entity_summary || `Foundation: ${foundationSummary.product_name} (${foundationSummary.output_amount} ${foundationSummary.output_unit})`}
            </h4>
            {approvalRequest?.impact && (
              <p className="text-sm text-purple-700 mb-3">
                <strong>Impact:</strong> {approvalRequest.impact}
              </p>
            )}
            
            {/* What will be created */}
            {willCreate.length > 0 && (
              <div className="mb-3">
                <h5 className="font-medium text-purple-900 mb-2">Will Create:</h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
                  {willCreate.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Atomic Operation Warning */}
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Atomic Operation</p>
                  <p>This is an all-or-nothing operation. If any part fails, all changes will be automatically rolled back.</p>
                </div>
              </div>
            </div>
            
            {/* Expandable Entity Data */}
            <div className="border-t pt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? "Hide" : "Show"} Entity Details
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
                      {renderEntityData()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Approval Question */}
        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-3">
            Do you want to create this product system foundation?
          </h4>
          
          {/* Options */}
          <div className="space-y-3">
            <div
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedOption === "approve"
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedOption("approve")}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "approve"
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}>
                  {selectedOption === "approve" && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    selectedOption === "approve"
                      ? "text-green-900"
                      : "text-gray-900"
                  }`}>
                    Approve
                  </div>
                  <div className={`text-sm mt-1 ${
                    selectedOption === "approve"
                      ? "text-green-700"
                      : "text-gray-600"
                  }`}>
                    Yes, create the complete foundation for this product system
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedOption === "reject"
                  ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedOption("reject")}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  selectedOption === "reject"
                    ? "border-red-500 bg-red-500"
                    : "border-gray-300"
                }`}>
                  {selectedOption === "reject" && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    selectedOption === "reject"
                      ? "text-red-900"
                      : "text-gray-900"
                  }`}>
                    Reject
                  </div>
                  <div className={`text-sm mt-1 ${
                    selectedOption === "reject"
                      ? "text-red-700"
                      : "text-gray-600"
                  }`}>
                    No, do not create the foundation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="additional-notes" className="text-sm font-medium">
            {selectedOption === "reject" ? "Reason for Rejection" : "Additional Notes (Optional)"}
            {selectedOption === "reject" && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="additional-notes"
            placeholder={
              selectedOption === "reject" 
                ? "Required: Explain why you're rejecting this foundation creation..."
                : "Optional: Add any notes about this foundation creation..."
            }
            value={additionalNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Suggestions for Rejection */}
        {selectedOption === "reject" && (
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
              <input
                type="text"
                placeholder="Add a suggestion..."
                value={newSuggestion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSuggestion(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSuggestion();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              (selectedOption === "reject" && !additionalNotes.trim())
            }
            className={`min-w-[120px] ${
              selectedOption === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : selectedOption === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : ""
            }`}
          >
            {isSubmitting 
              ? "Submitting..." 
              : selectedOption === "approve" 
                ? "Approve Foundation" 
                : selectedOption === "reject"
                ? "Reject Foundation"
                : "Submit Response"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
