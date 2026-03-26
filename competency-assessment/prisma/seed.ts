import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const admin = await prisma.employee.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "Admin User",
      passwordHash: bcryptjs.hashSync("admin123", 10),
      role: "ADMIN",
      careerTrack: "itSecurityTeamLead",
    },
  });

  // Create a manager
  const manager = await prisma.employee.upsert({
    where: { email: "manager@company.com" },
    update: {},
    create: {
      email: "manager@company.com",
      name: "Sarah Manager",
      passwordHash: bcryptjs.hashSync("manager123", 10),
      role: "MANAGER",
      careerTrack: "itSecurityTeamLead",
      managerId: admin.id,
    },
  });

  // Create employees
  const emp1 = await prisma.employee.upsert({
    where: { email: "alex@company.com" },
    update: {},
    create: {
      email: "alex@company.com",
      name: "Alex Engineer",
      passwordHash: bcryptjs.hashSync("employee123", 10),
      role: "EMPLOYEE",
      careerTrack: "itInfrastructureEngineer",
      managerId: manager.id,
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { email: "sam@company.com" },
    update: {},
    create: {
      email: "sam@company.com",
      name: "Sam Cloud",
      passwordHash: bcryptjs.hashSync("employee123", 10),
      role: "EMPLOYEE",
      careerTrack: "cloudEngineer",
      managerId: manager.id,
    },
  });

  console.log("Seed complete:", { admin: admin.id, manager: manager.id, emp1: emp1.id, emp2: emp2.id });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
