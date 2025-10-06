import { useStreamContext } from '../../agent/providers/Stream';
import { useMockStreamContext } from '../providers/MockStreamContext';

// This hook automatically switches between real and mock context
export const useStreamContextForTesting = () => {
  try {
    // Try to use the real context first
    return useStreamContext();
  } catch {
    // Fall back to mock context if real context is not available
    return useMockStreamContext();
  }
};
