export type CompetencyKey =
  | "delivery"
  | "domainExpertise"
  | "problemSolving"
  | "communication"
  | "leadership"
  | "aiSupremacy";

export interface SkillLevel {
  index: number;
  name: string;
  skills: string[];
}

export interface Competency {
  name: string;
  description: string;
  levels: SkillLevel[];
}

export const competencies: Record<CompetencyKey, Competency> = {
  delivery: {
    name: "Delivery",
    description:
      "Planning, prioritization, predictability, continuous delivery, testing and monitoring.",
    levels: [
      {
        index: 0,
        name: "Starter",
        skills: [
          "Understands the purpose and scope of tasks before starting work",
          "Completes assigned tasks with guidance from senior team members",
          "Follows team processes and workflows consistently",
          "Communicates blockers and progress to the team promptly",
        ],
      },
      {
        index: 1,
        name: "Beginner",
        skills: [
          "Understands scope before taking on tasks",
          "Self-reviews and self-tests work to minimize issues",
          "Follows up on work post-release",
          "Collects and incorporates feedback before shipping",
          "Ships complete solutions in small, safe increments",
        ],
      },
      {
        index: 2,
        name: "Intermediate",
        skills: [
          "Estimates accurate timelines and maintains a steady delivery pace",
          "Uses testing methods, verification practices, and monitoring tools",
          "Builds simple yet universal solutions with appropriate abstraction",
          "Identifies product, technical, and design tradeoffs",
          "Considers effects outside the team and assesses infrastructure impact",
        ],
      },
      {
        index: 3,
        name: "Advanced",
        skills: [
          "Collaboratively roadmaps large work tracks with reliable estimates",
          "Communicates plans with teammates and takes responsibility for outcomes",
          "Ensures quality and meets non-functional requirements",
          "Delivers initiatives end-to-end with post-release monitoring",
          "Identifies when processes negatively impact delivery and proposes improvements",
        ],
      },
      {
        index: 4,
        name: "Expert",
        skills: [
          "Brings together work of many teams into cohesive plans",
          "Introduces new quality and production-readiness practices",
          "Incorporates organization-wide work awareness into planning",
          "Applies varied project management techniques based on context",
          "Uses metrics thoughtfully for reflection and improvement",
        ],
      },
      {
        index: 5,
        name: "Leading Expert",
        skills: [
          "Removes productivity barriers across the engineering organization",
          "Creates industry-applicable delivery and monitoring tools",
          "Works on tasks matching the highest organizational priorities",
          "Considered critical to the success of key business objectives",
        ],
      },
    ],
  },

  domainExpertise: {
    name: "Domain Expertise",
    description: "Knowledge of your domain, tools, business, product.",
    levels: [
      {
        index: 0,
        name: "Starter",
        skills: [
          "Has foundational understanding of the relevant technology domain",
          "Actively seeks to learn tools and processes used by the team",
          "Asks questions to build understanding of domain concepts",
          "Understands how their role contributes to team and business goals",
        ],
      },
      {
        index: 1,
        name: "Beginner",
        skills: [
          "Asks questions that support continuous learning",
          "Learns from research and from colleagues",
          "Seizes learning opportunities such as workshops, guilds, and resources",
          "Understands the basics of relevant tools",
        ],
      },
      {
        index: 2,
        name: "Intermediate",
        skills: [
          "Understands technical concepts needed for effective work",
          "Knows where to find answers and consults documentation proactively",
          "Has in-depth knowledge of the immediate domain",
          "Understands the business importance of their work",
          "Understands all relevant tools and their appropriate applications",
        ],
      },
      {
        index: 3,
        name: "Advanced",
        skills: [
          "Specialized knowledge contributes meaningfully to project success",
          "Helps others outside the team and mentors on specific topics",
          "Holds strong, well-founded design opinions while remaining adaptable",
          "Follows industry trends and suggests relevant applications",
        ],
      },
      {
        index: 4,
        name: "Expert",
        skills: [
          "Expertise helps the organization achieve and exceed goals",
          "Actively shares knowledge with wider audiences",
          "Introduces industry concepts to solve organizational problems",
          "Consistently delivers successful work grounded in deep expertise",
        ],
      },
      {
        index: 5,
        name: "Leading Expert",
        skills: [
          "Contributions beyond the organization have industry-wide impact",
          "Uses expertise to solve long-standing problems in the field",
          "Contributes to the wider industry advancement",
          "Expertise helps the organization solve critical business problems",
        ],
      },
    ],
  },

  problemSolving: {
    name: "Problem Solving",
    description:
      "Analysis, creativity, breakdown of problems, architecture of solutions.",
    levels: [
      {
        index: 0,
        name: "Starter",
        skills: [
          "Tackles well-defined problems with clear instructions",
          "Seeks help when encountering unfamiliar issues",
          "Breaks simple tasks into smaller steps before starting",
          "Learns from mistakes and avoids repeating them",
        ],
      },
      {
        index: 1,
        name: "Beginner",
        skills: [
          "Resolves familiar issues and debugs unfamiliar code with guidance",
          "Recognizes knowledge gaps and reaches out for help early",
          "Plans approach before starting new tasks",
          "Learns continuously and does not repeat the same mistakes",
        ],
      },
      {
        index: 2,
        name: "Intermediate",
        skills: [
          "Uses data and prototypes to develop creative solutions",
          "Recognizes mistakes as learning opportunities",
          "Utilizes domain expertise and known patterns effectively",
          "Breaks down large problems systematically",
          "Demonstrates strong debugging and urgent problem-solving skills",
        ],
      },
      {
        index: 3,
        name: "Advanced",
        skills: [
          "Creates iterative solutions that enable continuous value delivery",
          "Anticipates problems and designs resilient solutions",
          "Zooms out using data and strategic context to inform decisions",
          "Facilitates problem-solving sessions and identifies coupled issues",
          "Identifies recurring problems and solves them systematically",
        ],
      },
      {
        index: 4,
        name: "Expert",
        skills: [
          "Identifies and solves issues across domains with ease",
          "Creates architecture without single points of failure",
          "Proposals are informed by industry literature and research",
          "Looks ahead 6-12 months and creates actionable roadmaps",
          "Consistently delivers successful solutions across multiple dimensions",
        ],
      },
      {
        index: 5,
        name: "Leading Expert",
        skills: [
          "Creates architecture that gains near-unanimous acceptance",
          "Crafts long-lasting, low-overhead solutions to complex problems",
          "Identifies team and initiative barriers and creates practical solutions",
          "Provides direction for complex multi-stakeholder problems",
          "Publishes new approaches that solve industry-wide problems",
        ],
      },
    ],
  },

  communication: {
    name: "Communication",
    description:
      "Collaboration with others, documentation, relationships with others.",
    levels: [
      {
        index: 0,
        name: "Starter",
        skills: [
          "Communicates clearly and respectfully with team members",
          "Participates in team meetings and asks questions when unclear",
          "Documents work in progress and shares status updates",
          "Is open to feedback and acts on it constructively",
        ],
      },
      {
        index: 1,
        name: "Beginner",
        skills: [
          "Clearly communicates in English and articulates questions well",
          "Collaborates with various team member roles regularly",
          "Documents important learnings and solutions",
          "Actively participates in team meetings",
        ],
      },
      {
        index: 2,
        name: "Intermediate",
        skills: [
          "Produces concise, clear written communication in async environments",
          "Writes well-structured, clear documentation",
          "Asks clarifying questions from vague requirements",
          "Offers feedback appropriately and constructively",
          "Listens actively and receives criticism without territorialism",
        ],
      },
      {
        index: 3,
        name: "Advanced",
        skills: [
          "Ensures the right people have the right context via documentation",
          "Collaborates outside the team and handles cross-team discussions",
          "Extracts core issues from discussions and improves meetings",
          "Gives and receives feedback on work and behavior with empathy",
          "Explains technical concepts clearly and adjusts for audience",
        ],
      },
      {
        index: 4,
        name: "Expert",
        skills: [
          "Accountable for communication and coordination of large projects",
          "Documentation enables maintenance by people not originally involved",
          "Helps disparate groups collaborate and reach consensus",
          "Creates spaces and practices that improve cross-team communication",
        ],
      },
      {
        index: 5,
        name: "Leading Expert",
        skills: [
          "Makes significant changes that improve organizational communication",
          "Educates others on communication through mentoring and speaking",
          "Has a positive influence on the organizational working environment",
          "Proficiently communicates with external stakeholders and partners",
        ],
      },
    ],
  },

  leadership: {
    name: "Leadership",
    description:
      "Responsibility, decision making, mentoring, setting an example.",
    levels: [
      {
        index: 0,
        name: "Starter",
        skills: [
          "Takes ownership of assigned tasks and sees them through to completion",
          "Is transparent about uncertainties and mistakes",
          "Seeks feedback from peers and leads to improve",
          "Demonstrates a positive and collaborative attitude",
        ],
      },
      {
        index: 1,
        name: "Beginner",
        skills: [
          "Accepts direction and guidance well",
          "Is transparent about uncertainties and mistakes",
          "Seeks feedback often for continuous improvement",
          "Self-motivated and engaged on team projects",
        ],
      },
      {
        index: 2,
        name: "Intermediate",
        skills: [
          "Motivates and supports more junior peers",
          "Proactively acts on feedback received",
          "Creates a safe environment and embodies team values",
          "Takes on small leadership roles when opportunities arise",
          "Is generous with time and available to help others",
        ],
      },
      {
        index: 3,
        name: "Advanced",
        skills: [
          "Takes action or delegates when problems lack clear owners",
          "Inspires and motivates others toward shared goals",
          "Fosters a questioning-friendly environment and advocates for learning",
          "Decisive with good business sense and technical depth",
          "Turns ideas into meaningful work opportunities for the team",
        ],
      },
      {
        index: 4,
        name: "Expert",
        skills: [
          "Has meaningfully improved key engineering functions multiple times",
          "Has a large internal network and is credible across the organization",
          "Mentors people outside their immediate teams",
          "Strong business understanding and creates strategic visions",
        ],
      },
      {
        index: 5,
        name: "Leading Expert",
        skills: [
          "Has changed engineering functioning by establishing best practices",
          "Accountable for attracting talent and strengthening engineering brand",
          "Regularly represents engineering publicly",
          "Technical leadership is cited as significantly positive by the organization",
        ],
      },
    ],
  },

  aiSupremacy: {
    name: "AI Supremacy",
    description:
      "Effective use of AI tools, prompt engineering, AI-augmented workflows, and organizational AI adoption.",
    levels: [
      {
        index: 0,
        name: "Starter",
        skills: [
          "Aware that AI tools like ChatGPT exist",
          "Has tried an AI assistant at least once",
          "Understands AI is used in some business contexts",
          "Open to learning about AI tools",
        ],
      },
      {
        index: 1,
        name: "Beginner",
        skills: [
          "Uses AI assistants for basic tasks like writing emails or searching documentation",
          "Can prompt an LLM for simple troubleshooting help",
          "Understands key limitations of AI including hallucinations and context windows",
          "Can distinguish between AI-generated and human-verified information",
          "Follows team guidelines on approved AI tool usage",
        ],
      },
      {
        index: 2,
        name: "Intermediate",
        skills: [
          "Integrates AI into daily workflow such as Copilot for scripts or AI-assisted monitoring analysis",
          "Evaluates AI tool outputs critically before acting on them",
          "Automates repetitive tasks using AI-powered tools",
          "Understands when AI is appropriate versus when manual approaches are better",
          "Shares effective AI prompts and techniques with teammates",
        ],
      },
      {
        index: 3,
        name: "Advanced",
        skills: [
          "Designs AI-augmented workflows for the team such as AI-assisted incident triage",
          "Evaluates and recommends AI tools with evidence-based analysis",
          "Builds custom GPTs or prompt libraries for team use cases",
          "Mentors others on effective AI adoption and best practices",
          "Measures and reports on AI tool ROI and productivity impact",
        ],
      },
      {
        index: 4,
        name: "Expert",
        skills: [
          "Drives AI strategy across multiple teams or departments",
          "Builds AI-powered automation that measurably reduces operational toil",
          "Establishes AI governance practices covering data privacy and model evaluation",
          "Creates organizational AI adoption frameworks and training programs",
          "Integrates AI capabilities into existing toolchains and platforms",
        ],
      },
      {
        index: 5,
        name: "Leading Expert",
        skills: [
          "Shapes the organization's overall AI vision and roadmap",
          "Pioneers novel AI applications in IT operations (AIOps)",
          "Contributes to the field via talks, publications, or open-source AI tools",
          "Establishes industry-recognized best practices for AI in IT operations",
        ],
      },
    ],
  },
};
