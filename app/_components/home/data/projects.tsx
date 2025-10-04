import { generateId } from "@workspace/utils/utils";

import {
  jobtoday,
  jobtoday1,
  jobtoday2,
  jobtoday3,
  sentiment,
  sentiment1,
  sentiment2,
  sentiment3,
  sentiment4,
  sentiment5,
  sentiment6,
  fit,
  fit1,
  fit2,
  sportsmanagement,
  sportsmanagement1,
  sportsmanagement2,
  sportsmanagement3,
  sportsmanagement4,
  sportsmanagement5,
  sportsmanagement6,
  sportsmanagement7,
  sportsmanagement8,
  sportsmanagement9,
  collabs,
  collabs1,
  collabs2,
  collabs3,
  collabs4,
  budget,
  budget1,
  budget2,
  budget3,
  budget4,
} from "@/public"

export const COMPLETED = "Completed"
export const INPROGRESS = "In Progress"

const projectData = [
  // Completed Projects
  {
    id: generateId(),
    project_title: `Poker Planner`,
    project_subtitle: `A simple, no-friction collaborative planning app`,
    project_badges: [
      "Next.js",
      "shadcn/ui",
      "Axios",
      "WebSocket",
      "PostgreSQL",
      "Tailwind CSS",
    ],
    project_description: [
      `Poker Planner is a hassle-free planning tool where users can create or join rooms without any signup or login process. Just hop in and start collaborating instantly.`,
      `A room host initiates the session, and participants can vote on tasks or estimates. Results are visualized with sleek bar graphs for clear insights.`,
      `Built with Next.js and shadcn/ui on the frontend for a fast and beautiful user experience. The backend combines HTTP and WebSocket protocols with PostgreSQL for real-time updates and reliable data storage.`,
    ],
    project_github: "https://github.com/varunteja007006/poker-planner",
    project_link: "https://poker-planner.buildio.pro/",
    // project_images: [pokerplanner, pokerplanner1],
    toShow: true,
    projectStatus: COMPLETED,
  },
  {
    id: generateId(),
    project_title: `JobToday`,
    project_subtitle: `An awesome Job manager`,
    project_badges: ["Axios", "React JS", "Redux", "Recharts", "Tailwind CSS"],
    project_description: [
      `Applying Jobs can be tiring. You want to know what is more tiring? Keeping track of those 
      jobs. JobToday ⚡ - The Pro Job Application Manager App will help you keep track of your job 
      applications.`,
      `This application is built on the MERN Stack Framework, with JWT-based authentication for 
      enhanced security.`,
    ],
    project_github: "https://github.com/varunteja007006/JobToday-ReactJS",
    project_link: "",
    project_images: [jobtoday, jobtoday1],
    toShow: false,
    projectStatus: COMPLETED,
  },
  {
    id: generateId(),
    project_title: `Portfolio Website`,
    project_subtitle: `Not just my portfolio but my beautiful React 💙 playground`,
    project_badges: [
      "Next JS",
      "React JS",
      "ShadCN",
      "Zustand",
      "Tailwind CSS",
      "Redux",
      "Typescript",
      "React Hook Forms",
      "Zod",
    ],
    project_description: [
      `This project is to showcase not only my skills but also my passion for React and learning more about it.`,
      `I have built it using Next JS and used various react libraries to demonstrate their usages and features.`,
      `There are many more micro projects that are built to get the understanding of various libraries like React Hook Form, Zustand, Zod, React Table (Tanstack Table), React Query (Tanstack Query), etc...`,
    ],
    project_github: "https://github.com/varunteja007006/Practice_React_Next",
    project_link: "https://varunteja007006.netlify.app/",
    toShow: false,
    projectStatus: COMPLETED,
  },
  {
    id: generateId(),
    project_title: `Sports Management Website`,
    project_subtitle: ``,
    project_badges: ["PHP", "HTML", "CSS", "JavaScript", "MySQL"],
    project_description: [
      `This project is designed to keep track of sports events happening in the college and is based 
      on the LAMP (Linux, Apache, MySQL, and PHP) stack. 
      The website is built from scratch, making use of PHP and MySQL to power the backend, and plain
       HTML and CSS for the frontend. 
      Additionally, Bootstrap was later implemented to keep the design consistent. 
      Despite being my first project, the website is effective in its goal of maintaining records 
      and delivering an efficient user experience.`,
    ],
    project_github:
      "https://github.com/varunteja007006/Sportz-Management-BootstrapVersion-PHP",
    project_link: "",
    project_images: [sportsmanagement],
    toShow: true,
    projectStatus: COMPLETED,
  },
  {
    id: generateId(),
    project_title: `Fit App`,
    project_subtitle: ``,
    project_badges: [
      "Mongo DB",
      "Express JS",
      "Node JS",
      "React JS",
      "Bootstrap",
      "SASS",
    ],
    project_description: [
      `This application is built on the MERN Stack Framework, with JWT-based authentication for 
      enhanced security. React useReducer hook is used for efficient state updates, 
      while the useContext hook provides seamless user experience. 
      These features work together to create a professional and high-quality application, 
      delivering exceptional performance and functionality.`,
      `It is a very basic app that taught me a lot about React and Node.`,
    ],
    project_github: "https://github.com/varunteja007006/FitApp-ReactJS",
    project_link: "",
    project_images: [fit, fit1, fit2],
    toShow: false,
    projectStatus: COMPLETED,
  },
  {
    id: generateId(),
    project_title: `Twitter Sentiment Analysis`,
    project_subtitle: ``,
    project_badges: [
      "Django",
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "NLTK",
      "Numpy",
      "TextBlob",
      "Tweepy",
      "Pandas",
    ],
    project_description: [
      `The app performs Sentiment Analysis on tweets retrieved through the Twitter API, utilizing 
      Django - a powerful Python-based Web Framework - to power its functionality. 
      The classification of tweets is performed using the Naive Bayes algorithm, allowing for 
      accurate and effective sentiment analysis. Together, these features enable the app to deliver 
      reliable and informative insights into the sentiment of the tweets analyzed.`,
    ],
    project_github:
      "https://github.com/varunteja007006/Twitter-Sentiment-Analysis-on-Politicians-Django",
    project_link: "",
    project_images: [sentiment5, sentiment6],
    toShow: true,
    projectStatus: COMPLETED,
  },
  {
    id: generateId(),
    project_title: `Collabs`,
    project_subtitle: ``,
    project_badges: [
      "Django",
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "Materialize CSS",
    ],
    project_description: [
      "Collabs: Unleash your potential through collaborative synergy! Our web app combines the power of Django and Materialize CSS to create an engaging platform where students come together to share skills and discover exciting projects. Connect with like-minded individuals, showcase your talents, and embark on a journey of innovation and growth. Join Collabs and unlock endless possibilities for collaboration and personal development!",
    ],
    project_github: "https://github.com/varunteja007006/Collabs-Django",
    project_link: "",
    project_images: [collabs, collabs1, collabs2, collabs3, collabs4],
    toShow: false,
    projectStatus: COMPLETED,
  },
  {
    id: generateId(),
    project_title: `Budget`,
    project_subtitle: ``,
    project_badges: [
      "Django",
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "MySQLite",
      "Bootstrap",
      "Numpy",
    ],
    project_description: [
      "Empower your finances with our Bootstrap and Django-powered web app. Seamlessly track income and expenses, while elegant cards display salary, month-end balance, and total expenses. Engage with captivating visualizations like histograms, bar graphs, and pie charts. Effortlessly analyze and manage your money with the added convenience of generating CSV files. Upgrade your financial management with our sleek and feature-rich solution.",
    ],
    project_github: "https://github.com/varunteja007006/Budget-Django",
    project_link: "",
    project_images: [budget, budget1, budget2, budget3, budget4],
    toShow: true,
    projectStatus: COMPLETED,
  },

  // In Progress Projects
  {
    id: generateId(),
    project_title: `open_templates`,
    project_subtitle: `My experimental project 🔬 to dive deep into the next js and django frameworks. 
    To understand some core concepts like middleware, server actions, web sockets, etc...`,
    project_badges: [
      "Next JS",
      "Django",
      "Django Social Auth",
      "Django Rest Framework",
      "React Hook Form",
      "ShadCN - Tailwind CSS",
    ],
    project_description: [
      `Experimenting and learning django authorization and authentication`,
      `Implemented Social Authentication - Via Google, Also Refresh and Access Token implementation.`,
      `On the Frontend part next js and using middleware, server actions, etc....`,
      `Docker to spin up both frontend and backend.`,
    ],
    project_github: "https://github.com/varunteja007006/open_templates",
    project_link: "",
    toShow: true,
    projectStatus: INPROGRESS,
  },
].sort((a, b) => b.projectStatus.localeCompare(a.projectStatus))

export default projectData
