import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { AlertCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useStreamContext } from "../../../providers/Stream";
import { toast } from "sonner";

interface ExchangeAdditionErrorProps {
  content: {
    status: string;
    message: string;
    validation_errors?: string[];
    details?: string;
    suggestion?: string;
    failed_exchanges?: Array<{
      flow_id: string;
      flow_name: string;
      error: string;
    }>;
    successful_exchanges?: number;
    total_attempted?: number;
  };
  toolCallId: string;
  toolName: string;
}

export function ExchangeAdditionError({ content, toolCallId, toolName }: ExchangeAdditionErrorProps) {
  const stream = useStreamContext();
  const {
    message,
    validation_errors = [],
    details,
    suggestion,
    failed_exchanges = [],
    successful_exchanges = 0,
    total_attempted = 0
  } = content;

  const hasPartialSuccess = successful_exchanges > 0;
  const allFailed = successful_exchanges === 0;

  const handleRetry = async () => {
    try {
      const userMessage = `Retry adding the exchanges that failed. Please fix any validation errors and try again.`;
      
      stream.submit(
        { messages: [{ type: "human", content: userMessage }] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );
      
      toast.success("Retrying exchange addition...");
    } catch (error) {
      console.error("Error retrying:", error);
      toast.error("Failed to retry. Please try again.");
    }
  };

  const handleBackToSearch = async () => {
    try {
      const userMessage = `Go back to searching for exchanges. I want to find different options.`;
      
      stream.submit(
        { messages: [{ type: "human", content: userMessage }] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );
      
      toast.info("Returning to search...");
    } catch (error) {
      console.error("Error going back to search:", error);
      toast.error("Failed to return to search. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Exchange Addition Failed
          </CardTitle>
          <p className="text-sm text-gray-600">{message}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-sm">Failed</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {total_attempted - successful_exchanges}
              </div>
            </div>
            
            {hasPartialSuccess && (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-sm">Succeeded</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {successful_exchanges}
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">Total Attempted</span>
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {total_attempted}
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validation_errors.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-sm mb-3 text-red-800">Validation Errors</h4>
              <div className="space-y-2">
                {validation_errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-700">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Exchanges Details */}
          {failed_exchanges.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-sm mb-3 text-red-800">Failed Exchanges</h4>
              <div className="space-y-2">
                {failed_exchanges.map((exchange, index) => (
                  <div key={index} className="flex items-start justify-between bg-red-50 rounded p-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm text-red-800">
                          {exchange.flow_name}
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          ID: {exchange.flow_id}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-red-600 max-w-xs text-right">
                      {exchange.error}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          {details && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-sm mb-2 text-gray-800">Error Details</h4>
              <p className="text-sm text-gray-600">{details}</p>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestion</h4>
              <p className="text-sm text-blue-700">{suggestion}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBackToSearch}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Addition
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
