import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    environment: "node",
    setupFiles: ["tests/unit/setup.ts"],
    // Test tích hợp dùng chung 1 DB test → chạy tuần tự để không giẫm dữ liệu nhau.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
