import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import { 
  ChevronDown, 
  ChevronUp, 
  Info,
  Database,
  Settings,
  User,
  MapPin,
  Sliders
} from "lucide-react";

interface EntityApprovalProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}


export function EntityApproval({ content, toolCallId, toolName }: EntityApprovalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const stream = useStreamContext();
  
  // Extract approval data
  const approvalRequest = content?.approval_request || content;
  const entityType = approvalRequest?.entity_type || content?.entity_type || "entity";
  const entitySummary = approvalRequest?.entity_summary || content?.entity_summary || "Entity requires approval";
  const impact = approvalRequest?.impact || content?.impact;
  const message = approvalRequest?.message || content?.message;
  const entityDetails = approvalRequest?.entity_details || content?.entity_details;
  const entityData = approvalRequest?.entity_data || content?.entity_data;
  const willCreate = approvalRequest?.entity_details?.will_create || [];


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


  const getEntityIcon = () => {
    switch (entityType.toLowerCase()) {
      case "product_system":
      case "product_system_foundation":
        return <img src="images/product_system.png" alt="Product System" className="h-5 w-5 object-contain" />;
      case "process":
        return <img src="images/process_unit_prod.png" alt="Settings" className="h-5 w-5 object-contain" />;
      case "flow":
        return <img src="images/flow_product.png" alt="Database" className="h-5 w-5 object-contain" />;
      case "actor":
        return <User className="h-5 w-5" style={{ color: '#2F6868' }} />;
      case "location":
        return <MapPin className="h-5 w-5" style={{ color: '#2F6868' }} />;
      case "parameter":
        return <Sliders className="h-5 w-5" style={{ color: '#2F6868' }} />;
      default:
        return <User className="h-5 w-5" style={{ color: '#2F6868' }} />;
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
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600" style={{ borderColor: '#2F6868' }}>
            <div className="flex items-center gap-2 mb-3">
              <img src="images/flow_product.png" alt="Flow" className="h-5 w-5 object-contain" />
              <h5 className="font-semibold text-gray-900 dark:text-white">Flow</h5>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Name:</span>
                <span className="text-gray-900 dark:text-white">{output_product.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Category:</span>
                <span className="text-gray-900 dark:text-white">{output_product.category?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Reference Unit:</span>
                <span className="text-gray-900 dark:text-white">{output_product.reference_unit?.name || 'N/A'}</span>
              </div>
              {output_product.description && (
                <div className="mt-2">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Description:</span>
                  <p className="text-gray-900 dark:text-white mt-1">{output_product.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Process */}
        {process && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600" style={{ borderColor: '#2F6868' }}>
            <div className="flex items-center gap-2 mb-3">
              <img src="images/process_unit_prod.png" alt="Process" className="h-5 w-5 object-contain" />
              <h5 className="font-semibold text-gray-900 dark:text-white">Process</h5>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Name:</span>
                <span className="text-gray-900 dark:text-white">{process.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Category:</span>
                <span className="text-gray-900 dark:text-white">{process.category?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Location:</span>
                <span className="text-gray-900 dark:text-white">{process.location?.name || 'N/A'}</span>
              </div>
              {process.description && (
                <div className="mt-2">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Description:</span>
                  <p className="text-gray-900 dark:text-white mt-1">{process.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Foundation Summary */}
        {foundation_summary && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600" style={{ borderColor: '#2F6868' }}>
            <div className="flex items-center gap-2 mb-3">
              <img src="images/product_system.png" alt="Product System" className="h-5 w-5 object-contain" />
              <h5 className="font-semibold text-gray-900 dark:text-white">Product System</h5>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Product Name:</span>
                <span className="text-gray-900 dark:text-white">{foundation_summary.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Output Amount:</span>
                <span className="text-gray-900 dark:text-white">{foundation_summary.output_amount} {foundation_summary.output_unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Process Name:</span>
                <span className="text-gray-900 dark:text-white">{foundation_summary.process_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">Location:</span>
                <span className="text-gray-900 dark:text-white">{foundation_summary.location}</span>
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
        reason: "User approved the request"
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
    <Card className={`bg-white dark:bg-gray-800`}>
      <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            Approval Required
          </CardTitle>
          <p className="text-sm text-purple-700 dark:text-purple-300">{message}</p>
      </CardHeader>

      <CardContent className="space-y-4 bg-white dark:bg-gray-800">
        {/* Entity Summary */}
        <div className="p-4 rounded-lg border dark:border-gray-600" style={{ borderColor: '#2F6868' }}>
          <div className="flex items-start gap-3">
            {getEntityIcon()}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {entitySummary}
              </h4>
              {impact && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Impact:</strong> {impact}
                </p>
              )}
              
              {/* What will be created */}
              {willCreate.length > 0 && (
                <div className="mb-3">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {willCreate.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Entity Details - Simple Mode */}
              {!shouldShowDetailedMode && entityDetails && (
                <div className="mb-3">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Details:</h5>
                  <div className="text-sm">
                    <div className="space-y-1">
                      {Object.entries(entityDetails).map(([key, value]) => (
                        <div key={key} className="flex">
                          <div className="w-40 flex-shrink-0">
                            <span className="font-medium text-gray-600 dark:text-gray-300">{key}:</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-700 dark:text-gray-300 break-words">{String(value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Atomic Operation Warning for complex entities */}
              {shouldShowDetailedMode && (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-3" style={{ borderColor: '#2F6868' }}>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#2F6868' }} />
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">Atomic Operation</p>
                      <p>This is an all-or-nothing operation. If any part fails, all changes will be automatically rolled back.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Expandable Entity Data - Detailed Mode */}
              {shouldShowDetailedMode && (
                <div className="border-t dark:border-gray-600 pt-3">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-sm transition-colors"
                    style={{
                      color: 'var(--brand-color)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--brand-color-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--brand-color)';
                    }}
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
                        <div className="mt-3 pt-3 border-t dark:border-gray-600">
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
              variant="brand"
              className="min-w-[120px]"
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
