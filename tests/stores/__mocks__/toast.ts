// tests/stores/__mocks__/toast.ts
import { vi } from "vitest";
export const useToast = () => ({
  success: vi.fn(),
  error: vi.fn(),
});
