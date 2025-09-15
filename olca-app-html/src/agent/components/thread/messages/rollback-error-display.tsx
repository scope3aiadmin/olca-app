import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { AlertTriangle, RotateCcw, Info } from "lucide-react";

interface RollbackErrorDisplayProps {
  content: any;
}

export function RollbackErrorDisplay({ content }: RollbackErrorDisplayProps) {
  const { mainError, rollbackErrors, suggestion } = parseRollbackErrors(content);
  
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">
            Foundation Creation Failed
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Error */}
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-900 mb-2">Error Details</h4>
          <p className="text-red-800">{mainError}</p>
        </div>
        
        {/* Rollback Errors */}
        {rollbackErrors.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="h-4 w-4 text-red-600" />
              <h4 className="font-semibold text-red-900">Rollback Errors</h4>
            </div>
            <p className="text-sm text-red-700 mb-3">
              The following errors occurred during the automatic rollback process:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {rollbackErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Suggestion */}
        {suggestion && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">Suggestion</h4>
            </div>
            <p className="text-yellow-800">{suggestion}</p>
          </div>
        )}
        
        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Review the error details above</li>
            <li>Check your product name and process name for any issues</li>
            <li>Verify database connection and permissions</li>
            <li>Try creating the foundation again with corrected information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to parse rollback errors
function parseRollbackErrors(content: any): {
  mainError: string;
  rollbackErrors: string[];
  suggestion: string;
} {
  const mainError = content?.message || "Operation failed";
  const suggestion = content?.suggestion || "";
  
  let rollbackErrors: string[] = [];
  if (content?.details) {
    const detailsStr = content.details;
    const rollbackMatch = detailsStr.match(/Rollback errors:\s*(.+)/s);
    if (rollbackMatch) {
      rollbackErrors = rollbackMatch[1]
        .split(/Failed to delete/)
        .filter((error: string) => error.trim())
        .map((error: string) => `Failed to delete${error.trim()}`);
    }
  }
  
  return { mainError, rollbackErrors, suggestion };
}
