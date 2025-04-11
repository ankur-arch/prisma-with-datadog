// prismaClient.ts
import "./tracer";
import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

export { prisma };
