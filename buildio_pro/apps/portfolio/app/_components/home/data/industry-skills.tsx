import { FaServer, FaProjectDiagram } from "react-icons/fa";
import { GrCycle } from "react-icons/gr";
import { TbMathFunction } from "react-icons/tb";
import { LuBrainCircuit } from "react-icons/lu";

const industrySkillsData = [
  {
    id: "skill-oop",
    name: "Object Oriented Programming System",
    image: "",
    icon: FaProjectDiagram,
    toShow: true,
  },
  {
    id: "skill-dbms",
    name: "Database Management System",
    image: "",
    icon: FaServer,
    toShow: true,
  },
  {
    id: "skill-sdlc",
    name: "Software Development and Life Cycle",
    image: "",
    icon: GrCycle,
    toShow: true,
  },
  {
    id: "skill-dsa",
    name: "Data Structures and Algorithms",
    image: "",
    icon: TbMathFunction,
    toShow: true,
  },
  {
    id: "skill-problem-solving",
    name: "Problem Solving",
    image: "",
    icon: LuBrainCircuit,
    toShow: true,
  },
];
export default industrySkillsData;
