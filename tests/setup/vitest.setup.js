import { config } from "@vue/test-utils";

// Optional: Silence Vue warnings during tests
config.global.config.warnHandler = () => {};

beforeEach(() => {
  localStorage.clear();
});
