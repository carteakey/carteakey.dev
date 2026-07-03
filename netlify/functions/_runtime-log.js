export function logRuntimeError(source, error, context = {}) {
  const payload = {
    level: "error",
    source,
    phase: "runtime",
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error || "Unknown failure"),
    ...context
  };

  console.error(JSON.stringify(payload));
}
