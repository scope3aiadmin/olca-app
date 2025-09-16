import React, { useState, useRef } from "react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Checkbox } from "../../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { useStreamContext } from "../../../providers/Stream";
import { toast } from "sonner";

interface Flow {
  flow_id: string;
  process_id: string;
  flow_name: string;
  process_name: string;
  location: string;
  original_amount: number;
  original_unit: string;
  converted_amount: number;
  converted_unit: string;
  material_type: string;
  search_keyword: string;
  documentation?: {
    technology_description?: string;
    intended_application?: string;
    geography_description?: string;
    time_description?: string;
  };
}

interface MaterialGroup {
  original_description: string;
  material_type: string;
  flows: Flow[];
}

interface SearchResults {
  [materialName: string]: MaterialGroup;
}

interface ExchangeSearchResultsProps {
  content: {
    status: string;
    message: string;
    search_results: SearchResults;
    approved_exchanges?: any[];
    is_final_search?: boolean;
    next_action?: string;
    search_strategy?: any;
    total_flows_found: number;
  };
  toolCallId: string;
  toolName: string;
}

export function ExchangeSearchResults({ content, toolCallId, toolName }: ExchangeSearchResultsProps) {
  const stream = useStreamContext();
  const [selectedFlows, setSelectedFlows] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState<boolean | 'indeterminate'>(false);

  const { search_results, total_flows_found, message } = content;
  const materialNames = Object.keys(search_results);

  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFlowIds = new Set<string>();
      Object.values(search_results).forEach(material => {
        material.flows.forEach(flow => allFlowIds.add(flow.flow_id));
      });
      setSelectedFlows(allFlowIds);
    } else {
      setSelectedFlows(new Set());
    }
  };

  // Handle individual flow selection
  const handleFlowSelect = (flowId: string, checked: boolean) => {
    const newSelected = new Set(selectedFlows);
    if (checked) {
      newSelected.add(flowId);
    } else {
      newSelected.delete(flowId);
    }
    setSelectedFlows(newSelected);
  };

  // Handle material group expansion
  const toggleMaterialExpansion = (materialName: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(materialName)) {
      newExpanded.delete(materialName);
    } else {
      newExpanded.add(materialName);
    }
    setExpandedMaterials(newExpanded);
  };

  // Handle flow expansion
  const toggleFlowExpansion = (flowId: string) => {
    const newExpanded = new Set(expandedFlows);
    if (newExpanded.has(flowId)) {
      newExpanded.delete(flowId);
    } else {
      newExpanded.add(flowId);
    }
    setExpandedFlows(newExpanded);
  };

  // Handle adding selected flows
  const handleAddSelected = async () => {
    if (selectedFlows.size === 0) {
      toast.error("Please select at least one flow to add");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare selected exchanges data
      const selectedExchanges = Array.from(selectedFlows).map(flowId => {
        // Find the flow data from search results
        for (const material of Object.values(search_results)) {
          const flow = material.flows.find(f => f.flow_id === flowId);
          if (flow) {
            return {
              flow_id: flow.flow_id,
              process_id: flow.process_id,
              amount: flow.converted_amount,
              unit: flow.converted_unit,
              is_input: flow.material_type === 'input'
            };
          }
        }
        return null;
      }).filter(Boolean);

      // Build user message for backend
      // Backend expects: call search_exchanges_for_product_system with both selected_exchanges and feedback
      // Backend will: 1) Add selected exchanges, 2) Process feedback, 3) Return refined search results
      let userMessage = `Call search_exchanges_for_product_system tool with selected_exchanges parameter to add the selected flows, and also include feedback to refine the search.`;
      
      // Include the selected exchanges data and feedback for backend processing
      userMessage += ` Selected exchanges data: ${JSON.stringify(selectedExchanges)}. Feedback: ${feedback.trim() || 'no additional feedback'}.`;
      
      stream.submit(
        { messages: [{ type: "human", content: userMessage }] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );
      
      toast.success(feedback.trim() ? "Adding selected flows and refining search..." : "Adding selected flows...");
    } catch (error) {
      console.error("Error adding flows:", error);
      toast.error("Failed to add flows. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle refining search
  const handleRefineSearch = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback for refining the search");
      return;
    }

    setIsSubmitting(true);
    try {
      const userMessage = `Please refine the search with this feedback: ${feedback}`;
      
      stream.submit(
        { messages: [{ type: "human", content: userMessage }] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );
      
      toast.success("Refining search...");
    } catch (error) {
      console.error("Error refining search:", error);
      toast.error("Failed to refine search. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back to chat
  const handleBackToChat = () => {
    // This will just let the user continue with normal chat
    toast.info("You can now continue with normal chat");
  };

  // Update select all checkbox state
  React.useEffect(() => {
    const allFlowIds = new Set<string>();
    Object.values(search_results).forEach(material => {
      material.flows.forEach(flow => allFlowIds.add(flow.flow_id));
    });
    
    if (selectedFlows.size === 0) {
      setSelectAllChecked(false);
    } else if (selectedFlows.size === allFlowIds.size) {
      setSelectAllChecked(true);
    } else {
      setSelectAllChecked('indeterminate');
    }
  }, [selectedFlows, search_results]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-blue-600" />
            Exchange Search Results
          </CardTitle>
          <p className="text-sm text-gray-600">{message}</p>
          <p className="text-sm text-gray-500">Found {total_flows_found} flows across {materialNames.length} material(s)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2 border-b pb-3">
            <Checkbox
              checked={selectAllChecked}
              onCheckedChange={handleSelectAll}
            />
            <label className="text-sm font-medium">
              Select All ({selectedFlows.size} selected)
            </label>
          </div>

          {/* Material Groups */}
          {materialNames.map((materialName) => {
            const material = search_results[materialName];
            const isExpanded = expandedMaterials.has(materialName);
            const materialFlowIds = material.flows.map(flow => flow.flow_id);
            const selectedInMaterial = materialFlowIds.filter(id => selectedFlows.has(id)).length;

            return (
              <div key={materialName} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleMaterialExpansion(materialName)}
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="capitalize">
                      {material.material_type}
                    </Badge>
                    <span className="font-medium">{materialName}</span>
                    <span className="text-sm text-gray-500">
                      ({material.flows.length} flows)
                    </span>
                    {selectedInMaterial > 0 && (
                      <Badge variant="secondary">
                        {selectedInMaterial} selected
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t p-4 space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      {material.original_description}
                    </p>
                    
                    {material.flows.map((flow) => {
                      const isFlowExpanded = expandedFlows.has(flow.flow_id);
                      const isSelected = selectedFlows.has(flow.flow_id);

                      return (
                        <div key={flow.flow_id} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleFlowSelect(flow.flow_id, checked === true)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{flow.flow_name}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFlowExpansion(flow.flow_id);
                                  }}
                                >
                                  {isFlowExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{flow.process_name}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {flow.location}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {flow.converted_amount} {flow.converted_unit}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  ID: {flow.flow_id}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isFlowExpanded && flow.documentation && (
                            <div className="mt-3 pl-6 space-y-2 text-xs text-gray-600">
                              {flow.documentation.technology_description && (
                                <div>
                                  <strong>Technology:</strong> {flow.documentation.technology_description.substring(0, 200)}...
                                </div>
                              )}
                              {flow.documentation.intended_application && (
                                <div>
                                  <strong>Application:</strong> {flow.documentation.intended_application.substring(0, 200)}...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Feedback Section */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-sm font-medium">Refinement Feedback (Optional)</label>
            <Textarea
              placeholder="Provide feedback to refine the search results..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px]"
            />
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
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleRefineSearch}
                disabled={isSubmitting || !feedback.trim()}
              >
                Refine Search
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={isSubmitting || selectedFlows.size === 0}
              >
                {feedback.trim() ? `Add & Refine (${selectedFlows.size})` : `Add Selected (${selectedFlows.size})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
