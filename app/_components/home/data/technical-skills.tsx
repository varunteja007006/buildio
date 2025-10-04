import {
  FaReact,
  FaLinux,
  FaWindows,
  FaNodeJs,
  FaPython,
  FaHtml5,
  FaBootstrap,
  FaPhp,
  FaAws,
  FaDocker,
} from "react-icons/fa"
import {
  SiJavascript,
  SiMongodb,
  SiMysql,
  SiCss3,
  SiTailwindcss,
  SiDjango,
  SiMdnwebdocs,
  SiNetlify,
  SiHeroku,
  SiRailway,
  SiGithub,
  SiPostman,
  SiJenkins,
  SiSonarqube,
  SiGooglecloud,
  SiNextdotjs,
  SiMui,
  SiBruno,
  SiPostgresql,
  SiDbeaver,
  SiHoppscotch,
  SiGithubcopilot,
  SiClaude,
  SiGooglegemini,
  SiOpenai,
  SiJest,
} from "react-icons/si"
import { BsFiletypeScss } from "react-icons/bs"
import { GiTortoise } from "react-icons/gi"
import { DiVisualstudio, DiMsqlServer } from "react-icons/di"

// Go, Rust, C
// React Native, Expo, Electron

const technicalSkillsData = {
  frameworks: {
    label: "Frameworks",
    skillList: [
      { name: "Next JS", icon: SiNextdotjs, toShow: true },
      { name: "MERN Stack", icon: SiMdnwebdocs, toShow: true },
      { name: "Django Web Framework", icon: SiDjango, toShow: true },
    ],
  },
  "AI Tools": {
    label: "AI Tools",
    skillList: [
      { name: "Open AI", icon: SiOpenai, toShow: true },
      { name: "Co-Pilot", icon: SiGithubcopilot, toShow: true },
      { name: "Claude", icon: SiClaude, toShow: true },
      { name: "Gemini", icon: SiGooglegemini, toShow: true },
    ],
  },
  ProgrammingLanguages: {
    label: "Programming Languages / Technologies",
    skillList: [
      { name: "React JS", icon: FaReact, toShow: true },
      { name: "Node JS", icon: FaNodeJs, toShow: true },
      { name: "JavaScript", icon: SiJavascript, toShow: true },
      { name: "PostgreSQL", icon: SiPostgresql, toShow: true },
      { name: "MSSQL", icon: DiMsqlServer, toShow: true },
      { name: "MySQL", icon: SiMysql, toShow: true },
      { name: "MongoDB", icon: SiMongodb, toShow: true },
      { name: "Python", icon: FaPython, toShow: true },
      { name: "HTML", icon: FaHtml5, toShow: true },
      { name: "CSS", icon: SiCss3, toShow: true },
      { name: "Tailwind CSS", icon: SiTailwindcss, toShow: true },
      { name: "MUI", icon: SiMui, toShow: true },
      { name: "Bootstrap CSS", icon: FaBootstrap, toShow: true },
      { name: "SCSS", icon: BsFiletypeScss, toShow: false },
      { name: "PHP", icon: FaPhp, toShow: false },
      { name: "Jest", icon: SiJest, toShow: true },
    ],
  },
  platforms: {
    label: "Platforms",
    skillList: [
      { name: "Railway", icon: SiRailway, toShow: true },
      { name: "Google Cloud", icon: SiGooglecloud, toShow: true },
      { name: "Netlify", icon: SiNetlify, toShow: true },
      { name: "AWS", icon: FaAws, toShow: true },
      { name: "Heroku", icon: SiHeroku, toShow: true },
    ],
  },
  tools: {
    label: "Tools",
    skillList: [
      { name: "Docker", icon: FaDocker, toShow: true },
      { name: "DBeaver", icon: SiDbeaver, toShow: true },
      { name: "GitHub", icon: SiGithub, toShow: true },
      { name: "VS Code", icon: DiVisualstudio, toShow: true },
      { name: "SonarQube", icon: SiSonarqube, toShow: true },
      { name: "Postman", icon: SiPostman, toShow: true },
      { name: "Bruno", icon: SiBruno, toShow: true },
      { name: "Hoppscotch", icon: SiHoppscotch, toShow: true },
      { name: "TortoiseSVN", icon: GiTortoise, toShow: true },
      { name: "Jenkins", icon: SiJenkins, toShow: true },
    ],
  },
  os: {
    label: "Operating Systems",
    skillList: [
      { name: "Linux", icon: FaLinux, toShow: true },
      { name: "Windows 10", icon: FaWindows, toShow: true },
    ],
  },
}

export default technicalSkillsData
