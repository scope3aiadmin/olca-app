import React, { createContext, useContext, ReactNode } from 'react';
import { Message } from '@langchain/langgraph-sdk';

// Complete mock interface matching the real useStreamContext
export interface MockStreamContextType {
  messages: Message[];
  isLoading: boolean;
  error: any;
  values: {
    messages: Message[];
    ui?: any[];
    created_processes: any[];
  };
  submit: (input: any, options?: any) => Promise<void>;
  getMessagesMetadata: (message: Message) => any;
  setBranch: (branch: any) => void;
  interrupt: any;
  // Additional properties from the real StreamContextType
  isThreadLoading: boolean;
  stop: () => Promise<void>;
  branch: any;
  history: any;
  experimental_branchTree: any;
  client: any;
  assistantId: string;
  joinStream: (streamId: string) => Promise<void>;
}

const MockStreamContext = createContext<MockStreamContextType | undefined>(undefined);

export const MockStreamProvider: React.FC<{ 
  children: ReactNode;
  mockData?: Partial<MockStreamContextType>;
}> = ({ children, mockData = {} }) => {
  const defaultMockData: MockStreamContextType = {
    messages: [],
    isLoading: false,
    error: null,
    values: {
      messages: [],
      ui: [],
      created_processes: []
    },
    submit: (input, options) => {
      console.log('Mock submit called with:', input, options);
      // Mock implementation - could show toast or log
      return Promise.resolve();
    },
    getMessagesMetadata: () => ({}),
    setBranch: () => {},
    interrupt: null,
    // Additional properties
    isThreadLoading: false,
    stop: () => Promise.resolve(),
    branch: null,
    history: [],
    experimental_branchTree: null,
    client: null,
    assistantId: 'mock-assistant',
    joinStream: (streamId: string) => {
      console.log('Mock joinStream called with:', streamId);
      return Promise.resolve();
    },
    ...mockData
  };

  return (
    <MockStreamContext.Provider value={defaultMockData}>
      {children}
    </MockStreamContext.Provider>
  );
};

export const useMockStreamContext = (): MockStreamContextType => {
  const context = useContext(MockStreamContext);
  if (context === undefined) {
    throw new Error("useMockStreamContext must be used within a MockStreamProvider");
  }
  return context;
};
