export type ExperienceRecord = {
  id: string;
  jobTitle: string;
  company: string;
  workingFrom: string;
  workingTill: string;
  dateOfJoining: string;
  dateOfResigning: string;
  jobDescription: string[];
  toShow: boolean;
  current: boolean;
};

const experienceData: ExperienceRecord[] = [
  {
    id: "exp-renault",
    jobTitle: "Senior Engineer",
    company: "Renault Group",
    workingFrom: "May 2025",
    workingTill: "",
    dateOfJoining: "2025-05-05",
    dateOfResigning: "",
    jobDescription: [
      "Built and shipped full-stack applications for procurement and supplier workflows, improving internal efficiency.",
      "Led adoption of AI-driven SDLC, accelerating development cycles and reducing delivery time by 40% by implementing Spec-Driven Development and AI-assisted coding workflows.",
      "Developed a CMS platform from MVP to production in 1 month using Payload CMS, enabling rapid content operations.",
      "Designed and implemented AI-powered features for business automation.",
    ],
    toShow: true,
    current: true,
  },
  {
    id: "exp-invest4edu",
    jobTitle: "Software Engineer",
    company: "invest4Edu",
    workingFrom: "Dec 2023",
    workingTill: "May 2025",
    dateOfJoining: "2023-12-18",
    dateOfResigning: "2025-04-28",
    jobDescription: [
      "Migrated legacy React app to Next.js (SSR), significantly improving SEO and performance.",
      "Contributed to 6000+ new user acquisition within 2 months through performance improvements.",
      "Re-architected frontend from class-based to functional components, improving maintainability.",
      "Built and maintained CRM system (frontend + backend) for sales and employee workflows.",
    ],
    toShow: true,
    current: false,
  },
  {
    id: "exp-tcs",
    jobTitle: "System Engineer",
    company: "Tata Consultancy Services",
    workingFrom: "May 2021",
    workingTill: "Dec 2023",
    dateOfJoining: "2021-5-27",
    dateOfResigning: "2023-11-30",
    jobDescription: [
      "Contributed to the development and maintenance of a global HCM (Human Capital Management) platform used by 10,000+ employees across four regions: Americas, APAC, EMEA, and Japan.",
      "Designed and supported custom interfaces tailored to client requirements, improving usability and streamlining HR processes for diverse user groups.",
      "Implemented data visualization and analytics features using Recharts, React Hooks, and Fetch API, enabling stakeholders to gain actionable workforce insights.",
      "Integrated secure authentication flows with JWT, ensuring compliance and robust access control across multiple regions.",
      "Recognized with a 5-star client rating for delivering reliable solutions, clear communication, and timely updates.",
    ],
    toShow: true,
    current: false,
  },
];
export default experienceData;
