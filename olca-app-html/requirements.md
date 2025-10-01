# Frontend UI Requirements for OLCA Agent

## Feature Request: Special UI Handling for User Interaction Tools

### Overview

The OLCA agent includes several tools that require special UI handling beyond standard tool call display. These tools need interactive user interfaces for approval workflows, input requests, and validation results.

### Tools Requiring Special UI Display

#### 1. **`request_user_input`** (return_direct=True)
**Purpose**: Request clarification or user decisions on methodological choices

**Output Format**:
```json
{
    "user_input_required": true,
    "question": "What allocation method would you like to use?",
    "options": [
        {"id": "mass", "label": "Mass allocation", "description": "Allocate based on mass"},
        {"id": "economic", "label": "Economic allocation", "description": "Allocate based on economic value"},
        {"id": "energy", "label": "Energy allocation", "description": "Allocate based on energy content"}
    ],
    "context": {
        "workflow_stage": "allocation_selection",
        "process_name": "Steel production"
    }
}
```

**Expected User Input**:
```json
{
    "selected_option": "mass",
    "additional_notes": "Mass allocation is most appropriate for this process"
}
```

**UI Requirements**:
- Display question prominently
- Show options as selectable cards/buttons with descriptions
- Allow additional notes input
- Submit button to send response

---

#### 2. **`request_user_approval`** (return_direct=True)
**Purpose**: Request approval before creating entities in the database

**Output Format**:
```json
{
    "approval_required": true,
    "entity_type": "output_product",
    "entity_summary": "Output product flow: Reinforced concrete",
    "entity_details": {
        "name": "Reinforced concrete",
        "flow_type": "PRODUCT_FLOW",
        "flow_property": "Mass",
        "flow_property_id": "4f19f123-7b3b-11dd-ad8b-0800200c9a66",
        "category": "Construction materials"
    },
    "action": "create",
    "impact": "Will create a new product flow in the database",
    "approval_options": ["approve", "reject"],
    "requires_reason": true
}
```

**Expected User Input**:
```json
{
    "decision": "approve",
    "reason": "Looks good, proceed with creation"
}
```

**OR for rejection**:
```json
{
    "decision": "reject",
    "reason": "Change the flow property from Mass to Volume",
    "suggestions": ["Use Volume instead of Mass", "Consider Energy as alternative"]
}
```

**UI Requirements**:
- Display entity summary prominently
- Show entity details in expandable/collapsible format
- Clear approve/reject buttons
- Reason input field (required for rejections)
- Suggestions input field for rejections
- Warning about database impact

---

#### 3. **`validate_process`** (return_direct=False, but special status)
**Purpose**: Validate process completeness before product system creation

**Output Format**:
```json
{
    "status": "validation_complete",
    "process_id": "4f19f123-7b3b-11dd-ad8b-0800200c9a66",
    "process_name": "Fabrication of reinforced concrete",
    "is_valid": true,
    "validation_errors": [],
    "validation_warnings": [
        "Input exchange for 'Concrete' has no default provider"
    ],
    "exchange_summary": {
        "total_exchanges": 3,
        "input_exchanges": 2,
        "output_exchanges": 1,
        "quantitative_reference_exchanges": 1
    },
    "next_steps": [
        "Process is valid and ready for product system creation",
        "Consider adding default providers to input exchanges for better linking"
    ]
}
```

**Expected User Input**: None (informational only)

**UI Requirements**:
- Display validation status with clear visual indicators (✅ valid, ❌ invalid)
- Show exchange summary in table/card format
- List validation errors prominently (red)
- List validation warnings (yellow/orange)
- Display next steps as actionable items
- No user input required - informational display only

---

#### 4. **`create_output_product`** (return_direct=False)
**Output Format**:
```json
{
    "status": "approval_required",
    "message": "Ready to create output product 'Reinforced concrete'",
    "approval_request": {
        "entity_type": "output_product",
        "entity_summary": "Output product flow: Reinforced concrete",
        "entity_details": {
            "name": "Reinforced concrete",
            "flow_type": "PRODUCT_FLOW",
            "flow_property": "Mass",
            "flow_property_id": "uuid",
            "category": "Construction materials"
        },
        "action": "create",
        "impact": "Will create a new product flow in the database"
    }
}
```

**UI Requirements**:
- Same as `request_user_approval` above
- Display message prominently
- Show approval_request details
- Approve/reject buttons with reason input

---

#### 5. **`create_process_for_system`** (return_direct=False)
**Output Format**:
```json
{
    "status": "approval_required",
    "message": "Ready to create process 'Fabrication of reinforced concrete'",
    "approval_request": {
        "entity_type": "process",
        "entity_summary": "Process: Fabrication of reinforced concrete (unit_process)",
        "entity_details": {
            "name": "Fabrication of reinforced concrete",
            "process_type": "unit_process",
            "location": "Europe",
            "exchanges": []
        },
        "action": "create",
        "impact": "Will create a new process in the database"
    }
}
```

**UI Requirements**:
- Same as `request_user_approval` above
- Display message prominently
- Show approval_request details
- Approve/reject buttons with reason input

---

#### 6. **`add_exchanges_to_process`** (return_direct=False)
**Output Format**:
```json
{
    "status": "approval_required",
    "message": "Ready to add 3 exchanges to process 'Fabrication of reinforced concrete'",
    "approval_request": {
        "entity_type": "exchanges_batch",
        "entity_summary": "Add 3 exchanges to process 'Fabrication of reinforced concrete'",
        "entity_details": {
            "process_id": "uuid",
            "process_name": "Fabrication of reinforced concrete",
            "exchanges": [
                {
                    "flow_name": "Concrete",
                    "amount": 10,
                    "is_input": true,
                    "is_quantitative_reference": false,
                    "default_provider": "uuid"
                },
                {
                    "flow_name": "Steel rebar",
                    "amount": 5,
                    "is_input": true,
                    "is_quantitative_reference": false,
                    "default_provider": "uuid"
                },
                {
                    "flow_name": "Reinforced concrete",
                    "amount": 1,
                    "is_input": false,
                    "is_quantitative_reference": true,
                    "default_provider": null
                }
            ]
        },
        "action": "create",
        "impact": "Will add 3 exchanges to the process in the database"
    }
}
```

**UI Requirements**:
- Display message prominently
- Show exchanges in table format with columns:
  - Flow Name
  - Amount
  - Type (Input/Output)
  - Quantitative Reference (Yes/No)
  - Default Provider
- Approve/reject buttons with reason input
- Option to approve individual exchanges or batch

---

#### 7. **`create_product_system`** (return_direct=False)
**Output Format**:
```json
{
    "status": "approval_required",
    "message": "Ready to create product system from process 'Fabrication of reinforced concrete'",
    "approval_request": {
        "entity_type": "product_system",
        "entity_summary": "Product system from process 'Fabrication of reinforced concrete'",
        "entity_details": {
            "process_id": "uuid",
            "process_name": "Fabrication of reinforced concrete",
            "prefer_unit_processes": true,
            "provider_linking": "PREFER_DEFAULTS",
            "validation_summary": {
                "total_exchanges": 3,
                "input_exchanges": 2,
                "output_exchanges": 1,
                "quantitative_reference_exchanges": 1
            }
        },
        "action": "create",
        "impact": "Will create a new product system in the database"
    }
}
```

**UI Requirements**:
- Display message prominently
- Show process details and configuration
- Display validation summary
- Approve/reject buttons with reason input
- Final confirmation before product system creation

---

## Implementation Guidelines

### Detection Logic

The frontend should detect special UI requirements based on:

1. **`return_direct=True`** tools:
   - `request_user_input`
   - `request_user_approval`

2. **`status: "approval_required"`** in tool responses:
   - `create_output_product`
   - `create_process_for_system`
   - `add_exchanges_to_process`
   - `create_product_system`

3. **`status: "validation_complete"`** in tool responses:
   - `validate_process`

### UI Component Requirements

#### Approval Component
- **Entity Summary**: Prominent display of what's being created
- **Entity Details**: Expandable/collapsible detailed information
- **Action Buttons**: Clear approve/reject buttons
- **Reason Input**: Required text input for rejections
- **Impact Warning**: Clear indication of database impact
- **Suggestions Input**: Optional field for improvement suggestions

#### Input Request Component
- **Question Display**: Clear presentation of the question
- **Options**: Selectable options with descriptions
- **Additional Notes**: Optional text input for extra context
- **Submit Button**: Send response to agent

#### Validation Component
- **Status Indicator**: Visual validation status (✅/❌)
- **Summary Table**: Exchange summary in tabular format
- **Error List**: Prominent display of validation errors
- **Warning List**: Display of validation warnings
- **Next Steps**: Actionable next steps
- **No Input Required**: Informational display only

### Response Handling

#### User Input Response Format
```json
{
    "tool_response": {
        "tool_name": "request_user_input",
        "user_input": {
            "selected_option": "mass",
            "additional_notes": "Mass allocation is most appropriate"
        }
    }
}
```

#### Approval Response Format
```json
{
    "tool_response": {
        "tool_name": "request_user_approval",
        "approval_decision": {
            "decision": "approve",
            "reason": "Looks good, proceed with creation"
        }
    }
}
```

#### Rejection Response Format
```json
{
    "tool_response": {
        "tool_name": "request_user_approval",
        "approval_decision": {
            "decision": "reject",
            "reason": "Change the flow property from Mass to Volume",
            "suggestions": ["Use Volume instead of Mass", "Consider Energy as alternative"]
        }
    }
}
```

### Standard Tool Display

Tools that should display normally (standard tool call format):
- `explore_available_product_flows`
- All other tools that return standard success/error responses

### Error Handling

#### Critical Failures
```json
{
    "status": "critical_failure",
    "message": "OpenLCA client not available",
    "details": "Cannot connect to database",
    "resolution_steps": [
        "Ensure OpenLCA software is running",
        "Check if IPC server is accessible"
    ]
}
```

**UI Requirements**:
- Display error prominently with red styling
- Show resolution steps as actionable items
- Provide retry mechanism if appropriate

#### Recoverable Errors
```json
{
    "status": "error",
    "message": "Flow property 'Volume' not found",
    "details": "Technical error details",
    "suggestion": "Use a valid flow property name like 'Mass', 'Volume', etc."
}
```

**UI Requirements**:
- Display error with orange/yellow styling
- Show suggestion for resolution
- Allow user to retry with corrected input

### State Management

The frontend should maintain state for:
- **Pending Approvals**: Track approval requests awaiting user response
- **Approval History**: Store history of approval decisions
- **Workflow Progress**: Track current stage in product system creation
- **User Preferences**: Store user preferences for future interactions

### Accessibility Requirements

- **Keyboard Navigation**: All interactive elements should be keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Sufficient contrast for error/warning/success states
- **Focus Management**: Clear focus indicators and logical tab order

### Mobile Responsiveness

- **Responsive Design**: Components should work on mobile devices
- **Touch-Friendly**: Buttons and inputs should be appropriately sized
- **Readable Text**: Text should be readable on small screens
- **Collapsible Content**: Long content should be collapsible on mobile

## Testing Requirements

### Unit Tests
- Test detection logic for special UI requirements
- Test response parsing and validation
- Test error handling and edge cases

### Integration Tests
- Test complete approval workflows
- Test user input collection and submission
- Test validation result display

### User Experience Tests
- Test approval workflow usability
- Test error message clarity
- Test mobile responsiveness
- Test accessibility compliance

## Priority

**High Priority**: Approval workflow components (tools 2, 4, 5, 6, 7)
**Medium Priority**: User input component (tool 1)
**Low Priority**: Validation display component (tool 3)

## Dependencies

- Frontend framework with component system
- State management solution
- UI component library
- Accessibility testing tools
- Mobile testing capabilities
