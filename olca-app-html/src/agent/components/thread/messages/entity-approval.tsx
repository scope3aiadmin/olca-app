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
  Package,
  User,
  MapPin,
  Sliders
} from "lucide-react";

interface EntityApprovalProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}

// OpenLCA brand colors based on Colors.java
const ENTITY_THEMES = {
  product_system: {
    primary: "blue",
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    text: "text-blue-900",
    textSecondary: "text-blue-700",
    icon: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
    card: "bg-blue-50/50 border-blue-200"
  },
  product_system_foundation: {
    primary: "blue",
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    text: "text-blue-900",
    textSecondary: "text-blue-700",
    icon: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
    card: "bg-blue-50/50 border-blue-200"
  },
  process: {
    primary: "green",
    bg: "bg-green-50/50",
    border: "border-green-200",
    text: "text-green-900",
    textSecondary: "text-green-700",
    icon: "text-green-600",
    button: "bg-green-600 hover:bg-green-700",
    card: "bg-green-50/50 border-green-200"
  },
  flow: {
    primary: "purple",
    bg: "bg-purple-50/50",
    border: "border-purple-200",
    text: "text-purple-900",
    textSecondary: "text-purple-700",
    icon: "text-purple-600",
    button: "bg-purple-600 hover:bg-purple-700",
    card: "bg-purple-50/50 border-purple-200"
  },
  actor: {
    primary: "orange",
    bg: "bg-orange-50/50",
    border: "border-orange-200",
    text: "text-orange-900",
    textSecondary: "text-orange-700",
    icon: "text-orange-600",
    button: "bg-orange-600 hover:bg-orange-700",
    card: "bg-orange-50/50 border-orange-200"
  },
  location: {
    primary: "teal",
    bg: "bg-teal-50/50",
    border: "border-teal-200",
    text: "text-teal-900",
    textSecondary: "text-teal-700",
    icon: "text-teal-600",
    button: "bg-teal-600 hover:bg-teal-700",
    card: "bg-teal-50/50 border-teal-200"
  },
  parameter: {
    primary: "indigo",
    bg: "bg-indigo-50/50",
    border: "border-indigo-200",
    text: "text-indigo-900",
    textSecondary: "text-indigo-700",
    icon: "text-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700",
    card: "bg-indigo-50/50 border-indigo-200"
  },
  default: {
    primary: "gray",
    bg: "bg-gray-50/50",
    border: "border-gray-200",
    text: "text-gray-900",
    textSecondary: "text-gray-700",
    icon: "text-gray-600",
    button: "bg-gray-600 hover:bg-gray-700",
    card: "bg-gray-50/50 border-gray-200"
  }
};

export function EntityApproval({ content, toolCallId, toolName }: EntityApprovalProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSuggestion, setNewSuggestion] = useState("");
  
  const stream = useStreamContext();
  
  // Extract approval data
  const approvalRequest = content?.approval_request || content;
  const entityType = approvalRequest?.entity_type || content?.entity_type || "entity";
  const entitySummary = approvalRequest?.entity_summary || content?.entity_summary || "Entity requires approval";
  const impact = approvalRequest?.impact || content?.impact;
  const message = approvalRequest?.message || content?.message;
  const entityDetails = approvalRequest?.entity_details || content?.entity_details;
  const action = approvalRequest?.action || content?.action || "create";
  const entityData = approvalRequest?.entity_data || content?.entity_data;
  const willCreate = approvalRequest?.entity_details?.will_create || [];

  // Get theme for entity type
  const theme = ENTITY_THEMES[entityType as keyof typeof ENTITY_THEMES] || ENTITY_THEMES.default;

  // Complexity detection - show detailed mode if complex data exists
  const isComplexEntity = () => {
    return entityData && (
      entityData.output_product || 
      entityData.process || 
      entityData.foundation_summary ||
      Object.keys(entityData).length > 3 ||
      willCreate.length > 0
    );
  };

  const shouldShowDetailedMode = isComplexEntity();

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

  const getEntityIcon = () => {
    switch (entityType.toLowerCase()) {
      case "product_system":
      case "product_system_foundation":
        return <Package className={`h-5 w-5 ${theme.icon}`} />;
      case "process":
        return <Settings className={`h-5 w-5 ${theme.icon}`} />;
      case "flow":
        return <Database className={`h-5 w-5 ${theme.icon}`} />;
      case "actor":
        return <User className={`h-5 w-5 ${theme.icon}`} />;
      case "location":
        return <MapPin className={`h-5 w-5 ${theme.icon}`} />;
      case "parameter":
        return <Sliders className={`h-5 w-5 ${theme.icon}`} />;
      default:
        return <User className={`h-5 w-5 ${theme.icon}`} />;
    }
  };

  const getEntityTypeDisplay = () => {
    switch (entityType.toLowerCase()) {
      case "product_system":
        return "Product System";
      case "product_system_foundation":
        return "Product System Foundation";
      case "process":
        return "Process";
      case "flow":
        return "Flow";
      case "actor":
        return "Actor";
      case "location":
        return "Location";
      case "parameter":
        return "Parameter";
      default:
        return entityType;
    }
  };

  // Enhanced entity data rendering with expandable sections
  const renderEntityData = () => {
    if (!entityData) return null;
    
    const { output_product, process, foundation_summary } = entityData;
    
    return (
      <div className="space-y-4">
        {/* Output Product */}
        {output_product && (
          <div className={`bg-white p-4 rounded-lg border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <Package className={`h-4 w-4 ${theme.icon}`} />
              <h5 className={`font-semibold ${theme.text}`}>Output Product</h5>
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
          <div className={`bg-white p-4 rounded-lg border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <Settings className={`h-4 w-4 ${theme.icon}`} />
              <h5 className={`font-semibold ${theme.text}`}>Process</h5>
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
          <div className={`bg-white p-4 rounded-lg border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <Database className={`h-4 w-4 ${theme.icon}`} />
              <h5 className={`font-semibold ${theme.text}`}>Foundation Summary</h5>
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
    setIsSubmitting(true);

    try {
      // Create the response for approval
      const response = {
        decision: "approve", // "approve" or "reject"
        reason: additionalNotes.trim() || "User approved the request",
        ...(suggestions.length > 0 && { suggestions })
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

      const actionText = "approved";
      toast.success(`Request ${actionText} successfully`);
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back to chat
  const handleBackToChat = () => {
    // This will just let the user continue with normal chat
    toast.info("You can now continue with normal chat");
  };

  return (
    <Card className={`bg-white`}>
      <CardHeader className="pb-3">
      <CardTitle className={`flex items-center gap-2 ${theme.text}`}>
            Approval Required
          </CardTitle>
          <p className="text-sm text-purple-700">{message}</p>
      </CardHeader>

      <CardContent className={`${theme.card} space-y-4 bg-white`}>
        {/* Entity Summary */}
        <div className={`p-4 rounded-lg border ${theme.border}`}>
          <div className="flex items-start gap-3">
            {getEntityIcon()}
            <div className="flex-1">
              <h4 className={`font-semibold ${theme.text} mb-2`}>
                {entitySummary}
              </h4>
              {impact && (
                <p className={`text-sm ${theme.textSecondary} mb-3`}>
                  <strong>Impact:</strong> {impact}
                </p>
              )}
              
              {/* What will be created */}
              {willCreate.length > 0 && (
                <div className="mb-3">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {willCreate.map((item: string, index: number) => (
                      <li key={index} className={theme.textSecondary}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Entity Details - Simple Mode */}
              {!shouldShowDetailedMode && entityDetails && (
                <div className="mb-3">
                  <h5 className={`font-medium ${theme.text} mb-2`}>Details:</h5>
                  <div className="text-sm">
                    <div className="space-y-1">
                      {Object.entries(entityDetails).map(([key, value]) => (
                        <div key={key} className="flex">
                          <div className="w-40 flex-shrink-0">
                            <span className="font-medium text-gray-600">{key}:</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`${theme.textSecondary} break-words`}>{String(value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Atomic Operation Warning for complex entities */}
              {shouldShowDetailedMode && (
                <div className={`${theme.bg} border ${theme.border} rounded-lg p-3 mb-3`}>
                  <div className="flex items-start gap-2">
                    <Info className={`h-4 w-4 ${theme.icon} mt-0.5 flex-shrink-0`} />
                    <div className={`text-sm ${theme.textSecondary}`}>
                      <p className="font-medium mb-1">Atomic Operation</p>
                      <p>This is an all-or-nothing operation. If any part fails, all changes will be automatically rolled back.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Expandable Entity Data - Detailed Mode */}
              {shouldShowDetailedMode && (
                <div className="border-t pt-3">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-2 text-sm ${theme.icon} hover:${theme.text} transition-colors`}
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
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBackToChat}
              disabled={isSubmitting}
            >
              Back to Chat
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting
              }
              className={`min-w-[120px] bg-blue-600 hover:bg-blue-700`}
            >
              {isSubmitting 
                ? "Submitting..." 
                : "Approve"
              }
            </Button>
          </div>
      </CardContent>
    </Card>
  );
}
