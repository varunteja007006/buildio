import { FaServer, FaProjectDiagram } from "react-icons/fa"
import { GrCycle } from "react-icons/gr"
import { TbMathFunction } from "react-icons/tb"
import { LuBrainCircuit } from "react-icons/lu"
import { generateId } from "@workspace/utils/utils";

const industrySkillsData = [
  {
    id: generateId(),
    name: "Object Oriented Programming System",
    image: "",
    icon: FaProjectDiagram,
    toShow: true,
  },
  {
    id: generateId(),
    name: "Database Management System",
    image: "",
    icon: FaServer,
    toShow: true,
  },
  {
    id: generateId(),
    name: "Software Development and Life Cycle",
    image: "",
    icon: GrCycle,
    toShow: true,
  },
  {
    id: generateId(),
    name: "Data Structures and Algorithms",
    image: "",
    icon: TbMathFunction,
    toShow: true,
  },
  {
    id: generateId(),
    name: "Problem Solving",
    image: "",
    icon: LuBrainCircuit,
    toShow: true,
  },
]
export default industrySkillsData
