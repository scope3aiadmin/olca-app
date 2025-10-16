# Agent Chat Interface

This directory contains the React-based chat interface for the openLCA Agent, built with LangGraph integration and modern web technologies.

## 🚀 Capabilities

The Agent Chat interface provides a sophisticated conversational AI experience with the following capabilities:

### Core Features
- **Real-time Chat Interface**: Interactive chat with streaming responses
- **LangGraph Integration**: Built on LangGraph SDK for advanced AI workflows
- **Tool Call Transparency**: Visual display of tool executions with status tracking
- **File Upload Support**: Drag-and-drop file uploads (PDF, images)
- **Thread Management**: Persistent conversation threads with history
- **Dark/Light Mode**: Automatic theme switching with Java integration
- **Responsive Design**: Mobile and desktop optimized layouts

### Advanced Features
- **Debug Panel**: Developer tools for monitoring conversations and logs
- **Interrupt Handling**: Support for human-in-the-loop workflows
- **Entity Approval**: Custom approval workflows for openLCA entities
- **Exchange Search**: Integration with openLCA exchange databases

### Technical Capabilities
- **Streaming Responses**: Real-time message streaming with LangGraph
- **State Management**: Complex state handling with React Context
- **Java Integration**: Seamless communication with openLCA Java backend
- **Error Handling**: Comprehensive error management with user-friendly messages

## 🎨 Styling with Tailwind CSS

The agent interface uses **Tailwind CSS v4** with a custom design system:

### Design System
- **CSS Variables**: Custom color palette with light/dark mode support
- **Component Library**: Reusable UI components with consistent styling
- **Responsive Grid**: Flexible layouts that adapt to screen sizes
- **Animation System**: Smooth transitions with Framer Motion integration

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./registry/**/*.{js,jsx,ts,tsx}",
    "./src/agent/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Key Styling Features
- **CSS Custom Properties**: Dynamic theming with CSS variables
- **Dark Mode**: Automatic theme switching via `dark` class
- **Component Variants**: Consistent button, input, and card styles
- **Animation Classes**: Built-in animations with `tw-animate-css`
- **Responsive Design**: Mobile-first approach with breakpoint utilities

## 🏗️ Repository Organization

### Directory Structure
```
src/agent/
├── components/           # React components
│   ├── thread/         # Chat thread components
│   ├── ui/             # Reusable UI components
│   ├── icons/          # SVG icons and logos
│   └── debug/          # Debug and development tools
├── hooks/              # Custom React hooks
├── lib/               # Utility functions and helpers
├── providers/         # React Context providers
├── agent.tsx          # Main application entry point
├── types.ts           # TypeScript type definitions
└── agent.css          # Component-specific styles
```

### Key Components

#### Core Components
- **`agent.tsx`**: Main application entry point with Java integration
- **`Thread`**: Primary chat interface component
- **`StreamProvider`**: LangGraph streaming context
- **`ThreadProvider`**: Thread management and persistence

#### UI Components
- **`AssistantMessage`**: AI message rendering with tool calls
- **`HumanMessage`**: User message display
- **`ToolCalls`**: Tool execution visualization
- **`ArtifactContent`**: Side panel for generated content

#### Specialized Components
- **`EntityApproval`**: Custom approval workflows
- **`ExchangeSearchResults`**: Database search results
- **`DebugPanel`**: Developer debugging tools
- **`ThreadHistory`**: Conversation history sidebar

### Integration Points

#### Java Integration
```typescript
// Global functions for Java communication
window.setTheme = (isDark: boolean) => { /* theme switching */ };
window.refreshNavigator = () => { /* navigator refresh */ };
```

#### LangGraph Integration
```typescript
// Stream configuration
const streamValue = useTypedStream({
  apiUrl,
  apiKey: apiKey ?? undefined,
  assistantId,
  threadId: threadId ?? null,
  fetchStateHistory: true,
});
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn package manager
- LangGraph server running locally or deployed

### Development Setup
1. **Install Dependencies**:
   ```bash
   cd olca-app-html
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Configure LangGraph**:
   - Set API URL (default: `http://localhost:2024`)
   - Set Assistant ID (default: `olca_agent_dev`)
   - Configure API key if using deployed instance

### Building for Production
```bash
npm run build
```

## 🔧 Configuration

### Environment Variables
- `API_URL`: LangGraph server URL
- `ASSISTANT_ID`: Graph/Assistant identifier
- `API_KEY`: Authentication key for deployed instances

### URL Parameters
- `threadId`: Current conversation thread
- `apiUrl`: Override API URL
- `assistantId`: Override assistant ID
- `hideToolCalls`: Toggle tool call visibility

## 📱 Usage

### Basic Chat
1. Enter your message in the input field
2. Press Enter or click Send
3. View streaming AI responses
4. Interact with tool calls and approvals

### Debug Features
1. Click the Settings icon to open debug panel
2. Monitor message flow and tool executions
3. View detailed logs and state information

## 🔗 Integration with Main Repository

This agent interface demo is part of the larger openLCA ecosystem:

- **Main Repository**: [openLCA](https://github.com/GreenDelta/olca-app)
- **Core Modules**: [olca-modules](https://github.com/GreenDelta/olca-modules)
- **Build System**: Integrated with `olca-app-build` for distribution
- **Java Integration**: Seamless communication with openLCA Java backend

### Related Documentation
- [Main README](../../../README.md) - Overall project documentation
- [HTML Build Guide](../../../README.md#building-the-html-pages) - Build instructions
- [Development Setup](../../../README.md#building-from-source) - Complete setup guide
