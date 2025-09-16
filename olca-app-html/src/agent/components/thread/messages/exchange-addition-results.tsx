import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { CheckCircle, Plus, ArrowRight } from "lucide-react";
import { Button } from "../../ui/button";

interface ExchangeAdditionResultsProps {
  content: {
    status: string;
    message: string;
    process_id?: string;
    exchanges_added: number;
    search_metadata: {
      total_exchanges_added: number;
      materials_added: string[];
      is_final_search: boolean;
    };
    next_action: string;
    state_update?: {
      current_process_exchanges: Array<{
        flow_name: string;
        amount: number;
        is_input: boolean;
        is_quantitative_reference: boolean;
      }>;
      process_building_stage: string;
    };
  };
  toolCallId: string;
  toolName: string;
}

export function ExchangeAdditionResults({ content, toolCallId, toolName }: ExchangeAdditionResultsProps) {
  const { 
    message, 
    exchanges_added, 
    search_metadata, 
    next_action, 
    state_update 
  } = content;

  const isCompleted = next_action === "completed";
  const isFinalSearch = search_metadata.is_final_search;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Exchanges Added Successfully
          </CardTitle>
          <p className="text-sm text-gray-600">{message}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Addition Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Exchanges Added</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {exchanges_added}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Total Added</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {search_metadata.total_exchanges_added}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">Materials</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {search_metadata.materials_added.map((material, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Current Process State */}
          {state_update && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-sm mb-3">Current Process State</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Stage: {state_update.process_building_stage}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Total Exchanges: {state_update.current_process_exchanges.length}
                  </Badge>
                </div>
                
                {state_update.current_process_exchanges.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Current Exchanges:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {state_update.current_process_exchanges.map((exchange, index) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                          <span className="font-medium">{exchange.flow_name}</span>
                          <div className="flex items-center gap-2">
                            <span>{exchange.amount}</span>
                            {exchange.is_input && (
                              <Badge variant="outline" className="text-xs">Input</Badge>
                            )}
                            {exchange.is_quantitative_reference && (
                              <Badge variant="outline" className="text-xs">Reference</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Action */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Process Complete
                </Badge>
              ) : isFinalSearch ? (
                <Badge variant="outline">
                  Ready for Next Step
                </Badge>
              ) : (
                <Badge variant="outline">
                  Continue Building
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Next: {next_action}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
