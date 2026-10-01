import type { BackendLanguageProvider } from "./types.js";
export declare const PYTHON_DEV_COMMAND = "uvicorn main:app --app-dir src --host 0.0.0.0 --port ${PORT:-4000} --reload --reload-dir src";
export declare const pythonBackendProvider: BackendLanguageProvider;
//# sourceMappingURL=python.d.ts.map