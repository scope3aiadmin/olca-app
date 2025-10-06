import React, { useState } from "react";
import { AssistantMessage, AssistantMessageLoading } from "../../agent/components/thread/messages/ai";
import { HumanMessage } from "../../agent/components/thread/messages/human";
import { ToolCalls, ToolResult } from "../../agent/components/thread/messages/tool-calls";
import { EntityApproval } from "../../agent/components/thread/messages/entity-approval";
import { ExchangeSearchResults } from "../../agent/components/thread/messages/exchange-search-results";
import { GenericInterruptView } from "../../agent/components/thread/messages/generic-interrupt";
import { MockStreamProvider } from "../providers/MockStreamContext";
import { ThreadProvider } from "../../agent/providers/Thread";
import { ArtifactProvider } from "../../agent/components/thread/artifact";

// Enhanced sample data with proper mock context
const mockStreamData = {
  messages: [
    {
      id: "msg-1",
      type: "ai" as const,
      content: [
        {
          type: "text" as const,
          text: "I can help you create a new process in openLCA. Let me search for relevant flows and create the process for you."
        }
      ],
      tool_calls: [] as any[]
    },
    {
      id: "msg-2", 
      type: "human" as const,
      content: "Create a new process for steel production"
    }
  ],
  isLoading: false,
  error: null as any,
  values: {
    messages: [] as any[],
    ui: [] as any[],
    created_processes: [] as any[]
  },
  submit: (input: any, options?: any) => {
    console.log('Mock submit called:', input, options);
    // You could show a toast or alert here
    return Promise.resolve();
  },
  getMessagesMetadata: () => ({}),
  setBranch: () => {},
  interrupt: null as any,
  // Additional properties
  isThreadLoading: false,
  stop: () => Promise.resolve(),
  branch: null as any,
  history: [] as any[],
  experimental_branchTree: null as any,
  client: null as any,
  assistantId: 'mock-assistant',
  joinStream: (streamId: string) => {
    console.log('Mock joinStream called with:', streamId);
    return Promise.resolve();
  }
};

// Sample data for each component
const sampleData = {
  ai: {
    message: {
      id: "msg-1",
      type: "ai" as const,
      content: [
        {
          type: "text" as const,
          text: "I can help you create a new process in openLCA. Let me search for relevant flows and create the process for you."
        }
      ],
      tool_calls: [] as any[]
    },
    isLoading: false,
    handleRegenerate: () => {},
    hideToolCalls: false
  },
  
  human: {
    message: {
      id: "msg-2", 
      type: "human" as const,
      content: "Create a new process for steel production"
    },
    isLoading: false
  },
  
  toolCalls: {
    toolCalls: [
      {
        name: "search_flows",
        id: "call-1",
        args: {
          query: "steel production",
          limit: 10
        },
        type: "tool_call" as const
      },
      {
        name: "create_process",
        id: "call-2", 
        args: {
          name: "Steel Production Process",
          category: "Materials / Metals"
        },
        type: "tool_call" as const
      }
    ]
  },
  
  toolResult: {
    message: {
      id: "msg-3",
      type: "tool" as const,
      name: "search_flows",
      tool_call_id: "call-1",
      content: JSON.stringify({
        status: "success",
        results: [
          {
            name: "Steel, unalloyed",
            category: "Materials / Metals",
            unit: "kg"
          },
          {
            name: "Steel, alloyed", 
            category: "Materials / Metals",
            unit: "kg"
          }
        ]
      })
    }
  },
  
  entityApproval: {
    content: {
      entity_type: "product_system_foundation",
      entity_summary: "Product System Foundation: office monitor (1.0 units)",
      entity_details: {
        foundation_summary: {
          product_name: "office monitor",
          output_amount: 1,
          output_unit: "reference unit",
          process_name: "office monitor production",
          location: "unspecified"
        },
        will_create: [
          "Product flow: office monitor",
          "Process: office monitor production",
          "Output exchange: office monitor (1.0 units) - Quantitative Reference"
        ]
      },
      action: "create",
      impact: "Will create the complete foundation for a product system",
      entity_data: {
        output_product: {
          id: "b2794495-acd2-48bd-9c8d-64bb7ad53016",
          cas: null as any,
          category: null as any,
          description: null as any,
          flow_properties: [
            {
              conversion_factor: 1,
              flow_property: {
                id: "93a60a56-a3c8-11da-a746-0800200b9a66",
                category: "Technical flow properties",
                description: null as any,
                flow_type: null as any,
                library: null as any,
                location: null as any,
                name: "Mass",
                process_type: null as any,
                ref_unit: null as any,
                ref_type: "FlowProperty"
              },
              is_ref_flow_property: true
            }
          ],
          flow_type: "PRODUCT_FLOW",
          formula: null as any,
          is_infrastructure_flow: null as any,
          last_change: "2025-10-06T11:22:31.132919+00:00",
          library: null as any,
          location: null as any,
          name: "office monitor",
          synonyms: null as any,
          tags: null as any,
          version: "01.00.000"
        },
        process: {
          id: "b3660bed-5cfe-42e1-bb10-6887d909165f",
          allocation_factors: null as any,
          category: null as any,
          default_allocation_method: null as any,
          description: null as any,
          dq_entry: null as any,
          dq_system: null as any,
          exchange_dq_system: null as any,
          exchanges: [
            {
              amount: 1,
              amount_formula: null as any,
              base_uncertainty: null as any,
              cost_formula: null as any,
              cost_value: null as any,
              currency: null as any,
              default_provider: null as any,
              description: null as any,
              dq_entry: null as any,
              flow: {
                id: "b2794495-acd2-48bd-9c8d-64bb7ad53016",
                category: null as any,
                description: null as any,
                flow_type: null as any,
                library: null as any,
                location: null as any,
                name: "office monitor",
                process_type: null as any,
                ref_unit: null as any,
                ref_type: "Flow"
              },
              flow_property: null as any,
              internal_id: 1,
              is_avoided_product: null as any,
              is_input: false,
              is_quantitative_reference: true,
              location: null as any,
              uncertainty: null as any,
              unit: null as any
            }
          ],
          is_infrastructure_process: null as any,
          last_change: "2025-10-06T11:22:31.133082+00:00",
          last_internal_id: 1,
          library: null as any,
          location: null as any,
          name: "office monitor production",
          parameters: null as any,
          process_documentation: null as any,
          process_type: "UNIT_PROCESS",
          social_aspects: null as any,
          social_dq_system: null as any,
          tags: null as any,
          version: "01.00.000"
        },
        foundation_summary: {
          product_name: "office monitor",
          output_amount: 1,
          output_unit: "reference unit",
          process_name: "office monitor production",
          location: "unspecified"
        }
      }
    },
    toolCallId: "call-2",
    toolName: "create_process"
  },
  
  exchangeSearchResults: {
    content: {
      status: "success",
      message: "Found relevant flows for steel production",
      search_results: {
          "steel": {
            "original_description": "0.5 kg of steel",
            "material_type": "input",
            "flows": [
              {
                "flow_id": "f46cd45b-b457-41f3-bd08-1ab41bd796e5",
                "process_id": "09d61948-238a-40e7-8e1f-afdc0c98f902",
                "flow_name": "Steel sections",
                "process_name": "Steel sections (ILCD), production mix, at plant, blast furnace route / electric arc furnace route, 1 kg",
                "location": "Global",
                "original_amount": 0.5,
                "original_unit": "kg",
                "converted_amount": 0.5,
                "converted_unit": "kg",
                "material_type": "input",
                "search_keyword": "steel",
                "documentation": {
                  "technology_description": "This dataset includes raw material extraction (e.g. coal, iron, ore, etc.) and processing, e.g. coke making, sinter, blast furnace, basic oxygen furnace, hot strip mill. Details on the steel product manufacturing route can be found in Appendices 2 and 3 of the 2011 worldsteel LCA Methodology Report....",
                  "intended_application": "The primary goals of the study are to develop a unified and rigorous LCI methodology for steel products worldwide in accordance with the worldsteel position paper on LCA and related ISO14040 set of standards to provide reliable data to meet requests from customers and external studies. Further goals are to promote the environmental credentials of steel and to develop steel industry expertise in the subject. To quantify resources use, energy and environmental emissions associated with the processing of 15 steel industry products are currently considered from the extraction of raw materials in the ground through to the finished product at the steel factory gate. It is also possible to consider the burdens and credits associated with the recycling of steel scrap (this can be seen in the dataset including recycling). The data set represents a cradle to gate inventory. It can be used to characterise the supply chain situation of the respective commodity in a representative manner. Combination with individual unit processes using this commodity enables the generation of user-specific (product) LCAs. The data set does not necessarily fit for any possible specific supply situation - especially if significantly different technology routes exist - but is representative for a common supply chain situation.",
                  "geography_description": "Data set is based on a weighted average site-specific data (gate-to-gate) of Global steel producers. Electricity grid mix is   country-specific. Other upstream data (e.g. iron ore production) are based on global averages from the steel industry.",
                  "time_description": "Based on annual data from a 12 month period between 2005 and 2008 provided by each participating site from which an annual average is calculated."
                }
              },
              {
                "flow_id": "4f1a1835-7b3b-11dd-ad8b-0800200c9a66",
                "process_id": "119e8cc1-0859-45ca-8f63-93a8a518ffd2",
                "flow_name": "steel hot rolled coil",
                "process_name": "Steel hot rolled coil, production mix, at plant, blast furnace route, thickness 2 to 7 mm, width 600 to 2100 mm",
                "location": "Europe",
                "original_amount": 0.5,
                "original_unit": "kg",
                "converted_amount": 0.5,
                "converted_unit": "kg",
                "material_type": "input",
                "search_keyword": "steel",
                "documentation": {
                  "technology_description": "Raw material extraction and processing, e.g. coal, iron ore, etc., and recycling of steel scrap, Coke making, Sinter, Blast Furnace, Basic Oxygen Furnace, Hot strip mill. Steel product manufacturing route can be found in Appendices 1 and 2 of the worldsteel LCA Methodology Report. The worldsteel Rec...",
                  "intended_application": "The primary goals of the study were to develop a unified and rigorous LCI methodology for steel products worldwide in accordance with the worldsteel Policy Statement on LCA and related ISO14040 set of standards to provide reliable data to meet requests from customers and external studies. Further goals were to promote the environmental credentials of steel and to develop steel industry expertise in the subject. To quantify resources use, energy and environmental emissions associated with the processing of 14 steel industry products from the extraction of raw materials in the ground through to the steel factory gate, taking into consideration the burdens and credits associated with the recycling of steel scrap.",
                  "geography_description": "Data set is based on average site-specific data (gate-to-gate) of European steel producers. Electricity grid mix is   country-specific. Other upstream data (e.g. iron ore production) are based on global averages.",
                  "time_description": "Annual average, site-specific data for one year. No major changes in site technology anticipated, but changes in upstream processes will require adjustment in 2008/2009."
                }
              },
              {
                "flow_id": "4f1a1837-7b3b-11dd-ad8b-0800200c9a66",
                "process_id": "268a11fb-baf2-4b9e-8867-38bea0e76ef6",
                "flow_name": "steel rebar",
                "process_name": "Steel rebar, production mix, at plant, blast furnace and electric arc furnace route,",
                "location": "Global",
                "original_amount": 0.5,
                "original_unit": "kg",
                "converted_amount": 0.5,
                "converted_unit": "kg",
                "material_type": "input",
                "search_keyword": "steel",
                "documentation": {
                  "technology_description": "Raw material extraction and processing, e.g. coal, iron ore, etc., and recycling of steel scrap, Coke making, Sinter, Blast Furnace, Basic Oxygen Furnace, Hot strip mill. DEAM database also used. Electric Arc Furnace Route and section rolling. Steel product manufacturing route can be found in Append...",
                  "intended_application": "The primary goals of the study were to develop a unified and rigorous LCI methodology for steel products worldwide in accordance with the worldsteel Policy Statement on LCA and related ISO14040 set of standards to provide reliable data to meet requests from customers and external studies. Further goals were to promote the environmental credentials of steel and to develop steel industry expertise in the subject. To quantify resources use, energy and environmental emissions associated with the processing of 14 steel industry products from the extraction of raw materials in the ground through to the steel factory gate, taking into consideration the burdens and credits associated with the recycling of steel scrap.",
                  "geography_description": "Data set is based on average site-specific data (gate-to-gate) of global steel producers. Electricity grid mix is country-specific.   Other upstream data (e.g. iron ore production) are based on global averages.",
                  "time_description": "Annual average, site-specific data for one year. No major changes in site technology anticipated, but changes in upstream processes will require adjustment in 2008/2009."
                }
              },
              {
                "flow_id": "4e5197c4-ffce-4f2d-a648-ebb25bb63748",
                "process_id": "339b2536-c881-409d-ac71-49ab0d228fe3",
                "flow_name": "Steel hot-dip galvanised coil",
                "process_name": "Steel hot dip galvanized (ILCD), production mix, at plant, blast furnace route, 1kg, typical thickness between 0.3 - 3 mm. typical width between 600 - 2100 mm.",
                "location": "Global",
                "original_amount": 0.5,
                "original_unit": "kg",
                "converted_amount": 0.5,
                "converted_unit": "kg",
                "material_type": "input",
                "search_keyword": "steel",
                "documentation": {
                  "technology_description": "This dataset includes raw material extraction (e.g. coal, iron, ore, etc.) and processing, e.g. coke making, sinter, blast furnace, basic oxygen furnace, hot strip mill. Details on the steel product manufacturing route can be found in Appendices 2 and 3 of the 2011 worldsteel LCA Methodology Report....",
                  "intended_application": "The primary goals of the study are to develop a unified and rigorous LCI methodology for steel products worldwide in accordance with the worldsteel position paper on LCA and related ISO14040 set of standards to provide reliable data to meet requests from customers and external studies. Further goals are to promote the environmental credentials of steel and to develop steel industry expertise in the subject. To quantify resources use, energy and environmental emissions associated with the processing of 15 steel industry products are currently considered from the extraction of raw materials in the ground through to the finished product at the steel factory gate. It is also possible to consider the burdens and credits associated with the recycling of steel scrap (this can be seen in the dataset including recycling). The data set represents a cradle to gate inventory. It can be used to characterise the supply chain situation of the respective commodity in a representative manner. Combination with individual unit processes using this commodity enables the generation of user-specific (product) LCAs. The data set does not necessarily fit for any possible specific supply situation - especially if significantly different technology routes exist - but is representative for a common supply chain situation.",
                  "geography_description": "Data set is based on a weighted average site-specific data (gate-to-gate) of global steel producers. Electricity grid mix is   country-specific. Other upstream data (e.g. iron ore production) are based on global averages from the steel industry.",
                  "time_description": "Based on annual data from a 12 month period between 2005 and 2008 provided by each participating site from which an annual average is calculated."
                }
              },
              {
                "flow_id": "76201092-a287-45e6-9dcd-b714a4b73f80",
                "process_id": "a83ee9ac-e392-4ef8-b046-8d88c23a4187",
                "flow_name": "Tin plate",
                "process_name": "Steel tinplate without EoL recycling  (collection year 2012/2013), European, production mix, at plant, blast furnace route, 1kg, typical thickness between 0.13 - 0.49 mm. typical width between 600 - 1100 mm.",
                "location": "Europe",
                "original_amount": 0.5,
                "original_unit": "kg",
                "converted_amount": 0.5,
                "converted_unit": "kg",
                "material_type": "input",
                "search_keyword": "steel",
                "documentation": {
                  "technology_description": "This dataset includes raw material extraction (e.g. coal, iron, ore, etc.) and processing, e.g. coke making, sinter, blast furnace, basic oxygen furnace, hot strip mill. Details on the steel product manufacturing route can be found in Appendices 2 and 3 of the 2011 worldsteel LCA Methodology Report....",
                  "intended_application": "The primary goals of the study are: \n\n#To update the European tinplate LCI database in accordance with ISO 14040 and 14044 standards as well as in line with the worldsteel LCA methodology \n#To  provide  reliable  and  up-to-date  data  to  meet  requests  from  customers  and  external studies \n#To assist in industry benchmarking and environmental improvement programmes. \n\nThe target audience of the study includes APEAL and its members. Furthermore, aggregated and averaged  data  will  be  made  available  for  many  different  external  applications  of  the  data,  for technical and non-technical audiences, including customers of the steel industry, policy makers, LCA practitioners and academia.  \n\nThe  results  of  the  study  are  not  intended  to  be  used  in  comparative  assertions  disclosed  to  the public.  However,  the  data  can  be  used  in  studies  where  comparative  assertions  are  made  and where a separate review of that study will be carried out.",
                  "geography_description": "Data set is based on a weighted average site-specific data (gate-to-gate) of European steel producers. Electricity grid mix is country-specific. Other upstream data (e.g. iron ore production) are based on global averages from the steel industry.",
                  "time_description": "Based on annual data from a 12 month period between 2012 and 2013 provided by each participating site from which an annual average is calculated."
                }
              },
              {
                "flow_id": "2126a80d-1cd0-46e4-8f30-341bd20a1d64",
                "process_id": "b0b413a1-2a7d-4cb5-a108-bfd7b37502e4",
                "flow_name": "Steel hot rolled coil",
                "process_name": "Steel hot rolled coil, including recycling, production mix, at plant, blast furnace route, 1kg, typical thickness between 2 - 7 mm. typical width between 600 - 2100 mm",
                "location": "Global",
                "original_amount": 0.5,
                "original_unit": "kg",
                "converted_amount": 0.5,
                "converted_unit": "kg",
                "material_type": "input",
                "search_keyword": "steel",
                "documentation": {
                  "technology_description": "This dataset includes raw material extraction (e.g. coal, iron, ore, etc.), processing, e.g. coke making, sinter, blast furnace, basic oxygen furnace, hot strip mill and end-of-life recycling. Details on the steel product manufacturing route can be found in Appendices 2 and 3 of the 2011 worldsteel ...",
                  "intended_application": "The primary goals of the study are to develop a unified and rigorous LCI methodology for steel products worldwide in accordance with the worldsteel position paper on LCA and related ISO14040 set of standards to provide reliable data to meet requests from customers and external studies. Further goals are to promote the environmental credentials of steel and to develop steel industry expertise in the subject. To quantify resources use, energy and environmental emissions associated with the processing of 15 steel industry products are currently considered from the extraction of raw materials in the ground through to the finished product at the steel factory gate. There are also the burdens and credits associated with the recycling of steel scrap considered. The data set represents a \"cradle to gate including end-of-life recycling\" inventory. It can be used to characterise the supply chain situation of the respective commodity in a representative manner. Combination with individual unit processes using this commodity enables the generation of user-specific (product) LCAs. The data set does not necessarily fit for any possible specific supply situation - especially if significantly different technology routes exist - but is representative for a common supply chain situation.",
                  "geography_description": "Data set is based on a weighted average site-specific data (gate-to-gate) of Global steel producers. Electricity grid mix is   country-specific. Other upstream data (e.g. iron ore production) are based on global averages from the steel industry.",
                  "time_description": "Based on annual data from a 12 month period between 2005 and 2008 provided by each participating site from which an annual average is calculated."
                }
              },
              {
                "flow_id": "4f1a1836-7b3b-11dd-ad8b-0800200c9a66",
                "process_id": "f9d4581e-14de-417e-8f9f-6c74e6f14051",
                "flow_name": "steel hot rolled section",
                "process_name": "Steel hot rolled section, production mix, at plant, blast furnace and electric arc furnace route,",
                "location": "Global",
                "original_amount": 0.5,
                "original_unit": "kg",
                "converted_amount": 0.5,
                "converted_unit": "kg",
                "material_type": "input",
                "search_keyword": "steel",
                "documentation": {
                  "technology_description": "Raw material extraction and processing, e.g. coal, iron ore, etc., and recycling of steel scrap, Coke making, Sinter, Blast Furnace, Basic Oxygen Furnace, Hot strip mill. DEAM database also used. Electric Arc Furnace Route and section rolling. Steel product manufacturing route can be found in Append...",
                  "intended_application": "The primary goals of the study were to develop a unified and rigorous LCI methodology for steel products worldwide in accordance with the worldsteel Policy Statement on LCA and related ISO14040 set of standards to provide reliable data to meet requests from customers and external studies. Further goals were to promote the environmental credentials of steel and to develop steel industry expertise in the subject. To quantify resources use, energy and environmental emissions associated with the processing of 14 steel industry products from the extraction of raw materials in the ground through to the steel factory gate, taking into consideration the burdens and credits associated with the recycling of steel scrap.",
                  "geography_description": "Data set is based on average site-specific data (gate-to-gate) of global steel producers. Electricity grid mix is country-specific.   Other upstream data (e.g. iron ore production) are based on global averages.",
                  "time_description": "Annual average, site-specific data for one year. No major changes in site technology anticipated, but changes in upstream processes will require adjustment in 2008/2009."
                }
              }
            ]
          }
        },
        approved_exchanges: [] as any[],
        is_final_search: false,
        next_action: "continue_searching",
        search_strategy: {
          action_type: "INITIAL_SEARCH"
        },
        total_flows_found: 7,
        exchanges_added: 0
    },
    toolCallId: "call-1",
    toolName: "search_flows"
  },
  
  genericInterrupt: {
    interrupt: {
      message: "Please confirm the process parameters",
      parameters: {
        efficiency: 0.85,
        location: "Global",
        technology: "Basic oxygen furnace"
      },
      options: ["confirm", "modify", "cancel"]
    }
  }
};

const componentOptions = [
  { value: "ai", label: "AI Message" },
  { value: "human", label: "Human Message" },
  { value: "toolCalls", label: "Tool Calls" },
  { value: "toolResult", label: "Tool Result" },
  { value: "entityApproval", label: "Entity Approval" },
  { value: "exchangeSearchResults", label: "Exchange Search Results" },
  { value: "genericInterrupt", label: "Generic Interrupt" }
];

export default function MessagePreview() {
  const [selectedComponent, setSelectedComponent] = useState("ai");

  const renderComponent = () => {
    const component = (() => {
      switch (selectedComponent) {
        case "ai":
          return <AssistantMessage {...sampleData.ai} />;
        case "human":
          return <HumanMessage {...sampleData.human} />;
        case "toolCalls":
          return <ToolCalls {...sampleData.toolCalls} />;
        case "toolResult":
          return <ToolResult {...sampleData.toolResult} />;
        case "entityApproval":
          return <EntityApproval {...sampleData.entityApproval} />;
        case "exchangeSearchResults":
          return <ExchangeSearchResults {...sampleData.exchangeSearchResults} />;
        case "genericInterrupt":
          return <GenericInterruptView {...sampleData.genericInterrupt} />;
        default:
          return <div>Select a component to preview</div>;
      }
    })();

    return component;
  };

  return (
    <MockStreamProvider mockData={mockStreamData}>
      <ThreadProvider>
        <ArtifactProvider>
          <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Message Components Preview</h1>
            
            <div className="mb-6">
              <label htmlFor="component-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Component:
              </label>
              <select
                id="component-select"
                value={selectedComponent}
                onChange={(e) => setSelectedComponent(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {componentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">
                {componentOptions.find(opt => opt.value === selectedComponent)?.label}
              </h2>
              {renderComponent()}
            </div>
          </div>
        </ArtifactProvider>
      </ThreadProvider>
    </MockStreamProvider>
  );
}
