import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";

interface ValidationDisplayProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}

export function ValidationDisplay({ content, toolCallId, toolName }: ValidationDisplayProps) {
  const {
    process_id,
    process_name,
    is_valid,
    validation_errors = [],
    validation_warnings = [],
    exchange_summary,
    next_steps = []
  } = content;

  // Debug logging is now handled by the main logger system

  const getStatusIcon = () => {
    if (is_valid) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusColor = () => {
    if (is_valid) {
      return "border-green-200 bg-green-50/50";
    }
    return "border-red-200 bg-red-50/50";
  };

  const getStatusText = () => {
    if (is_valid) {
      return "Validation Passed";
    }
    return "Validation Failed";
  };

  const getStatusTextColor = () => {
    if (is_valid) {
      return "text-green-900";
    }
    return "text-red-900";
  };

  return (
    <Card className={`${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <CardTitle className={getStatusTextColor()}>
            Process Validation
          </CardTitle>
        </div>
        <CardDescription className={is_valid ? "text-green-700" : "text-red-700"}>
          {process_name} - {getStatusText()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Exchange Summary */}
        {exchange_summary && (
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-3">Exchange Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {exchange_summary.total_exchanges || 0}
                </div>
                <div className="text-sm text-gray-600">Total Exchanges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {exchange_summary.input_exchanges || 0}
                </div>
                <div className="text-sm text-gray-600">Input Exchanges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {exchange_summary.output_exchanges || 0}
                </div>
                <div className="text-sm text-gray-600">Output Exchanges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {exchange_summary.quantitative_reference_exchanges || 0}
                </div>
                <div className="text-sm text-gray-600">Quantitative References</div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validation_errors.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-semibold text-red-900">Validation Errors</h4>
            </div>
            <ul className="space-y-2">
              {validation_errors.map((error: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="text-red-600 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Warnings */}
        {validation_warnings.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">Validation Warnings</h4>
            </div>
            <ul className="space-y-2">
              {validation_warnings.map((warning: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {next_steps.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Next Steps</h4>
            </div>
            <ul className="space-y-2">
              {next_steps.map((step: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Process ID */}
        {process_id && (
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Process ID:</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {process_id}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
