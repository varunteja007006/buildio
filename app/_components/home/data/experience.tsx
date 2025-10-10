import { generateId } from "@workspace/utils/utils";

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
    id: generateId(),
    jobTitle: "Senior Software Engineer",
    company: "RNTBCI (Renault Group)",
    workingFrom: "May 2025",
    workingTill: "",
    dateOfJoining: "2025-05-05",
    dateOfResigning: "",
    jobDescription: [
      "Build full-stack applications that provide AI-powered insights for supplier risk assessment, procurement, and sustainability, enabling businesses to cut through paperwork and make data-driven decisions.",
      "Work with a core stack of Next.js, React, and Tailwind CSS on the frontend, and NestJS, Postgres, and Java on the backend.",
      "Bring hands-on experience with Node.js, Express, MongoDB, and MSSQL, with strong expertise in both SQL and NoSQL systems.",
      "Passionate about scalable architecture, clean code, and continuous learning to deliver reliable and efficient solutions.",
      "Currently sharpening skills in Java, MCP servers, and vibe coding, with plans to explore Go, Rust, and C for deeper systems-level knowledge.",
    ],
    toShow: true,
    current: true,
  },
  {
    id: generateId(),
    jobTitle: "Software Engineer",
    company: "invest4Edu",
    workingFrom: "Dec 2023",
    workingTill: "May 2025",
    dateOfJoining: "2023-12-18",
    dateOfResigning: "2025-04-28",
    jobDescription: [
      "Developed and maintained full-stack applications using Next.js, React, Node.js, and MSSQL, contributing to the core platform of a fast-paced edtech startup.",
      "Built complex, high-performance UIs including dashboards, charts, filters, and authentication flows using Material UI, Highcharts, and custom components, while modernizing code from class-based to functional React patterns.",
      "Led SEO optimization efforts by migrating the application to Next.js, leveraging Server-Side Rendering (SSR) and caching to improve search visibility and performance.",
      "Contributed to the development of a sales and employee CRM, implementing scalable frontend solutions with React Hook Form, shadcn, Tailwind, and Zod, and writing optimized SQL queries to improve backend efficiency.",
      "Thrived in a high-pressure startup environment, rapidly learning new tools and frameworks, delivering production-grade features on tight timelines, and significantly expanding technical expertise.",
    ],
    toShow: true,
    current: false,
  },
  {
    id: generateId(),
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
