import Tracer from "dd-trace";
import {
  PrismaInstrumentation,
  registerInstrumentations,
} from "@prisma/instrumentation";

const tracer = Tracer.init({
  apmTracingEnabled: true,
  service: "datadog-prisma-experiment",
  version: "1.0.0",
});

const provider = new tracer.TracerProvider();

// Register the provider globally
provider.register();

registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    new PrismaInstrumentation({
      enabled: true,
    }),
  ],
});

export { tracer };
