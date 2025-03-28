// prismaClient.ts
import { tracer } from "./tracer";
import { PrismaClient } from "../generated/client";

const tracedPrisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
}).$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const span = tracer.startSpan(
        `prisma_query_${model?.toLowerCase()}_${operation}`,
        {
          tags: {
            "prisma.operation": operation,
            "prisma.model": model,
            "prisma.args": JSON.stringify(args),
            "prisma.rawQuery": query,
          },
        }
      );
      try {
        const result = await query(args);
        span.finish();
        return result;
      } catch (error) {
        span.setTag("error", error);
        span.finish();
        throw error;
      }
    },
  },
});

export { tracedPrisma };
