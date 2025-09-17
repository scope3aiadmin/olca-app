import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Settings,
  Package,
  User
} from "lucide-react";

interface ApprovalDisplayProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}

export function ApprovalDisplay({ content, toolCallId, toolName }: ApprovalDisplayProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const stream = useStreamContext();
  
  // Extract approval data
  const approvalRequest = content?.approval_request || content;
  const entityType = approvalRequest?.entity_type || content?.entity_type || "entity";
  const entitySummary = approvalRequest?.entity_summary || content?.entity_summary || "Entity requires approval";
  const impact = approvalRequest?.impact || content?.impact;
  const message = approvalRequest?.message || content?.message;
  const entityDetails = approvalRequest?.entity_details || content?.entity_details;
  const action = approvalRequest?.action || content?.action || "create";

  const handleApprove = async () => {
    setIsSubmitting(true);

    try {
      // Create the response for approval
      const response = {
        decision: "approve",
        reason: "User approved the request",
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

      toast.success("Request approved successfully");
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);

    try {
      // Create the response for rejection
      const response = {
        decision: "reject",
        reason: "User rejected the request",
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

      toast.success("Request rejected successfully");
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntityIcon = () => {
    switch (entityType.toLowerCase()) {
      case "product_system":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "process":
        return <Settings className="h-5 w-5 text-green-600" />;
      case "flow":
        return <Database className="h-5 w-5 text-purple-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEntityTypeDisplay = () => {
    switch (entityType.toLowerCase()) {
      case "product_system":
        return "Product System";
      case "process":
        return "Process";
      case "flow":
        return "Flow";
      default:
        return entityType;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">
            {getEntityTypeDisplay()} Approval Required
          </CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          {message || `Ready to ${action} ${getEntityTypeDisplay().toLowerCase()}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entity Summary */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            {getEntityIcon()}
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                {entitySummary}
              </h4>
              {impact && (
                <p className="text-sm text-blue-700 mb-3">
                  <strong>Impact:</strong> {impact}
                </p>
              )}
              
              {/* Entity Details */}
              {entityDetails && (
                <div className="mb-3">
                  <h5 className="font-medium text-blue-900 mb-2">Details:</h5>
                  <div className="text-sm">
                    <div className="space-y-1">
                      {Object.entries(entityDetails).map(([key, value]) => (
                        <div key={key} className="flex">
                          <div className="w-40 flex-shrink-0">
                            <span className="font-medium text-gray-600">{key}:</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-blue-700 break-words">{String(value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approve
              </div>
            )}
          </Button>
          
          <Button
            onClick={handleReject}
            disabled={isSubmitting}
            variant="destructive"
            className="flex-1"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Reject
              </div>
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
