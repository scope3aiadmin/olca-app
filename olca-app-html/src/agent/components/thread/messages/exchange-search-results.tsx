import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { ChevronDown, ChevronUp, Database } from "lucide-react";
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
  default_provider_process_id: string | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [expandedDocumentation, setExpandedDocumentation] = useState<Set<string>>(new Set());
  const [flowDescriptions, setFlowDescriptions] = useState<Record<string, string>>({});
  const [flowInputOutput, setFlowInputOutput] = useState<Record<string, 'input' | 'output'>>({});

  const { search_results, total_flows_found, message } = content;
  const materialNames = search_results ? Object.keys(search_results) : [];

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

  // Handle documentation expansion
  const toggleDocumentationExpansion = (docKey: string) => {
    const newExpanded = new Set(expandedDocumentation);
    if (newExpanded.has(docKey)) {
      newExpanded.delete(docKey);
    } else {
      newExpanded.add(docKey);
    }
    setExpandedDocumentation(newExpanded);
  };

  // Handle description update
  const handleDescriptionChange = (flowId: string, description: string) => {
    setFlowDescriptions(prev => ({
      ...prev,
      [flowId]: description
    }));
  };

  // Handle input/output selection
  const handleInputOutputChange = (flowId: string, value: 'input' | 'output') => {
    setFlowInputOutput(prev => ({
      ...prev,
      [flowId]: value
    }));
  };

  // Handle adding selected flows
  const handleAddSelected = async () => {
    if (selectedFlows.size === 0) {
      toast.error("Please select at least one flow to add");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare selected exchanges data in the format expected by the LangGraph tool
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
              is_input: flowInputOutput[flowId] === 'input' || flow.material_type === 'input',
              description: flowDescriptions[flowId] || '',
              is_quantitative_reference: false, // Default to false, can be made configurable later
              default_provider_process_id: flow.default_provider_process_id
            };
          }
        }
        return null;
      }).filter(Boolean);

      // Use LangGraph Command primitive to resume the interrupted execution with selected exchanges
      stream.submit(
        {},
        {
          command: {
            resume: {
              decision: "approve",
              reason: "User selected exchanges to add",
              selected_exchanges: selectedExchanges
            },
          },
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );
      
      toast.success("Adding selected flows...");
    } catch (error) {
      console.error("Error adding flows:", error);
      toast.error("Failed to add flows. Please try again.");
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
  }, [selectedFlows, search_results]);

  return (
    <div className="w-full space-y-6" style={{ width: '100%', minWidth: '100%' }}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Database className="h-5 w-5" style={{ color: '#2F6868' }} />
            Exchange Search Results
          </CardTitle>
          <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        </CardHeader>
        <CardContent className="space-y-4 w-full">
          {/* Material Groups */}
          {materialNames.map((materialName) => {
            const material = search_results[materialName];
            const isExpanded = expandedMaterials.has(materialName);
            const materialFlowIds = material.flows.map(flow => flow.flow_id);
            const selectedInMaterial = materialFlowIds.filter(id => selectedFlows.has(id)).length;

            return (
              <div key={materialName} className={`border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 w-full`} style={{ borderColor: '#2F6868' }}>
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
                  onClick={() => toggleMaterialExpansion(materialName)}
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="capitalize border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300" style={{ borderColor: '#2F6868', color: '#2F6868' }}>
                      {material.material_type}
                    </Badge>
                    <span className="font-medium text-gray-900 dark:text-white">{materialName}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({material.flows.length} flows)
                    </span>
                    {selectedInMaterial > 0 && (
                      <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200" style={{ backgroundColor: '#2F6868', color: 'white' }}>
                        {selectedInMaterial} selected
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" style={{ color: '#2F6868' }} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={{ color: '#2F6868' }} />
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 space-y-3 w-full">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {material.original_description}
                    </p>
                    
                    {material.flows.map((flow) => {
                      const isFlowExpanded = expandedFlows.has(flow.flow_id);
                      const isSelected = selectedFlows.has(flow.flow_id);

                      return (
                        <div key={flow.flow_id} className={`border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 w-full`} style={{ borderColor: '#2F6868' }}>
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleFlowSelect(flow.flow_id, checked === true)}
                              className="data-[state=unchecked]:border-gray-400 dark:data-[state=unchecked]:border-gray-500 data-[state=unchecked]:bg-white dark:data-[state=unchecked]:bg-gray-700"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">{flow.flow_name}</h4>
                                  <h3 className="text-xs text-gray-500 dark:text-gray-400">ID: {flow.flow_id}</h3>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                  style={{ color: '#2F6868' }}
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
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{flow.process_name}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300" style={{ borderColor: '#2F6868', color: '#2F6868' }}>
                                  {flow.converted_amount} {flow.converted_unit}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300" style={{ borderColor: '#2F6868', color: '#2F6868' }}>
                                  {flow.location}
                                </Badge>
                              </div>
                              
                              {/* Input/Output selection and Description field - only show if flow is selected */}
                              {isSelected && (
                                <div className="mt-3 space-y-3">
                                  {/* Input/Output Radio Buttons */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-800 dark:text-gray-200 block mb-1.5">
                                      Exchange Type:
                                    </label>
                                    <div className="flex gap-3">
                                      <div className="flex items-center space-x-1.5">
                                        <Input
                                          type="radio"
                                          id={`${flow.flow_id}-input`}
                                          name={`${flow.flow_id}-io`}
                                          value="input"
                                          checked={flowInputOutput[flow.flow_id] === 'input' || (!flowInputOutput[flow.flow_id] && flow.material_type === 'input')}
                                          onChange={(e) => handleInputOutputChange(flow.flow_id, e.target.value as 'input' | 'output')}
                                          className="h-4 w-4 text-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 border-brand/30 accent-brand"
                                        />
                                        <Label htmlFor={`${flow.flow_id}-input`} className="text-xs text-gray-700 dark:text-gray-300">
                                          Input
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        <Input
                                          type="radio"
                                          id={`${flow.flow_id}-output`}
                                          name={`${flow.flow_id}-io`}
                                          value="output"
                                          checked={flowInputOutput[flow.flow_id] === 'output' || (!flowInputOutput[flow.flow_id] && flow.material_type !== 'input')}
                                          onChange={(e) => handleInputOutputChange(flow.flow_id, e.target.value as 'input' | 'output')}
                                          className="h-4 w-4 text-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 border-brand/30 accent-brand"
                                        />
                                        <Label htmlFor={`${flow.flow_id}-output`} className="text-xs text-gray-700 dark:text-gray-300">
                                          Output
                                        </Label>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Description field */}
                                  <div>
                                    <label className="text-xs font-medium text-gray-800 dark:text-gray-200 block mb-1">
                                      Description:
                                    </label>
                                    <Textarea
                                      value={flowDescriptions[flow.flow_id] || ''}
                                      onChange={(e) => handleDescriptionChange(flow.flow_id, e.target.value)}
                                      placeholder="Add a description for this exchange..."
                                      className="text-xs min-h-[60px] border-gray-200 dark:border-gray-600 focus:border-brand dark:focus:border-brand"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {isFlowExpanded && flow.documentation && (
                            <div className="mt-3 pl-6 space-y-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                              {flow.documentation.technology_description && (
                                <div>
                                  <div className="flex items-center justify-between">
                                    <strong className="text-gray-800 dark:text-gray-200">Technology:</strong>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="hover:bg-gray-100 dark:hover:bg-gray-700 h-auto p-1"
                                      style={{ color: '#2F6868' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDocumentationExpansion(`${flow.flow_id}-technology`);
                                      }}
                                    >
                                      {expandedDocumentation.has(`${flow.flow_id}-technology`) ? (
                                        <ChevronUp className="h-3 w-3" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  {expandedDocumentation.has(`${flow.flow_id}-technology`) ? (
                                    <div className="mt-1 pl-2 text-gray-600 dark:text-gray-400">
                                      {flow.documentation.technology_description}
                                    </div>
                                  ) : (
                                    <div className="mt-1 pl-2 text-gray-600 dark:text-gray-400">
                                      {flow.documentation.technology_description.substring(0, 200)}...
                                    </div>
                                  )}
                                </div>
                              )}
                              {flow.documentation.intended_application && (
                                <div>
                                  <div className="flex items-center justify-between">
                                      <strong className="text-gray-800 dark:text-gray-200">Application:</strong>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="hover:bg-gray-100 dark:hover:bg-gray-700 h-auto p-1"
                                      style={{ color: '#2F6868' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDocumentationExpansion(`${flow.flow_id}-application`);
                                      }}
                                    >
                                      {expandedDocumentation.has(`${flow.flow_id}-application`) ? (
                                        <ChevronUp className="h-3 w-3" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  {expandedDocumentation.has(`${flow.flow_id}-application`) ? (
                                    <div className="mt-1 pl-2 text-gray-600 dark:text-gray-400">
                                      {flow.documentation.intended_application}
                                    </div>
                                  ) : (
                                    <div className="mt-1 pl-2 text-gray-600 dark:text-gray-400">
                                      {flow.documentation.intended_application.substring(0, 200)}...
                                    </div>
                                  )}
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
                  onClick={handleAddSelected}
                  disabled={isSubmitting || selectedFlows.size === 0}
                  variant="brand"
                >
                  Add Selected Exchanges ({selectedFlows.size})
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
