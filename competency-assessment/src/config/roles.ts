import { CompetencyKey } from "./competencies";

export type RoleKey =
  | "itInfrastructureEngineer"
  | "itSecurityEngineer"
  | "itSpecialist"
  | "itSecurityTeamLead"
  | "itSecurityFamilyLead"
  | "cloudEngineer"
  | "helpDesk"
  | "networkEngineer";

export interface Role {
  name: string;
  description: string;
  weights: Record<CompetencyKey, number>;
}

export const roles: Record<RoleKey, Role> = {
  itInfrastructureEngineer: {
    name: "IT Infrastructure Engineer",
    description:
      "Manages and maintains IT infrastructure including servers, storage, and cloud platforms",
    weights: {
      delivery: 20,
      domainExpertise: 25,
      problemSolving: 25,
      communication: 10,
      leadership: 5,
      aiSupremacy: 15,
    },
  },
  itSecurityEngineer: {
    name: "IT Security Engineer",
    description:
      "Protects IT systems and data through security controls, monitoring, and incident response",
    weights: {
      delivery: 15,
      domainExpertise: 25,
      problemSolving: 20,
      communication: 15,
      leadership: 10,
      aiSupremacy: 15,
    },
  },
  itSpecialist: {
    name: "IT Specialist",
    description:
      "Provides specialized IT support and maintains specific technology domains",
    weights: {
      delivery: 30,
      domainExpertise: 15,
      problemSolving: 20,
      communication: 15,
      leadership: 5,
      aiSupremacy: 15,
    },
  },
  itSecurityTeamLead: {
    name: "IT & Security Team Lead",
    description:
      "Leads an IT or security team, balancing technical work with people management",
    weights: {
      delivery: 15,
      domainExpertise: 15,
      problemSolving: 15,
      communication: 20,
      leadership: 20,
      aiSupremacy: 15,
    },
  },
  itSecurityFamilyLead: {
    name: "IT & Security Family Lead",
    description:
      "Leads multiple IT/security teams, focuses on strategy and organizational impact",
    weights: {
      delivery: 10,
      domainExpertise: 20,
      problemSolving: 10,
      communication: 20,
      leadership: 25,
      aiSupremacy: 15,
    },
  },
  cloudEngineer: {
    name: "Cloud Engineer / Architect",
    description:
      "Designs, builds, and manages cloud infrastructure on AWS, Azure, or GCP",
    weights: {
      delivery: 15,
      domainExpertise: 25,
      problemSolving: 25,
      communication: 10,
      leadership: 5,
      aiSupremacy: 20,
    },
  },
  helpDesk: {
    name: "Help Desk / IT Support",
    description:
      "Provides front-line IT support, troubleshooting, and end-user assistance",
    weights: {
      delivery: 25,
      domainExpertise: 15,
      problemSolving: 15,
      communication: 20,
      leadership: 5,
      aiSupremacy: 20,
    },
  },
  networkEngineer: {
    name: "Network Engineer",
    description:
      "Designs and maintains network infrastructure including LAN, WAN, firewalls, and VPN",
    weights: {
      delivery: 20,
      domainExpertise: 25,
      problemSolving: 25,
      communication: 10,
      leadership: 5,
      aiSupremacy: 15,
    },
  },
};
