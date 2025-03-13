// prismaClient.ts
import { tracer, x } from "./tracer";
import { PrismaClient } from "../generated/client";

// Create the Prisma client with query logging enabled.
const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

prisma.$metrics.json();

console.log(x);
// Extend all query operations using Prisma Client Extensions.
// This extension wraps each operation with a dd-trace span.

const tracedPrisma = prisma
  .$on("query", async (e) => {
    const span = tracer.startSpan(`prisma.rawquery`, {
      childOf: tracer.scope().active() ?? undefined,
      tags: {
        "prisma.rawQuery": e.query,
        "prisma.target": e.target,
      },
    });
    console.log("Span finished for raw queries");
    span.finish();
  })
  .$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const span = tracer.startSpan(`prisma.query`, {
          tags: {
            "prisma.operation": operation,
            "prisma.model": model,
            "prisma.args": JSON.stringify(args),
            "prisma.rawQuery": query,
          },
        });
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
