import { generateId } from "@workspace/utils/utils";

const academicData = [
  {
    id: generateId(),
    institute:
      "Vel Tech R&D Institute of Science & Technology, Deemed to be a University",
    course: "Bachelor of Technology in Computer Science",
    year: "(2017-2021)",
    score: "CGPA 8.56",
    progress: 85.6,
    toShow: true,
  },
  {
    id: generateId(),
    institute: "Narayana Junior College",
    course: "Intermediate - MPC",
    year: "(2015-2017)",
    score: "95%",
    progress: 95,
    toShow: true,
  },
  {
    id: generateId(),
    institute: "The Bodhi School",
    course: "Secondary Education - 10th",
    year: "2015",
    score: "CGPA 9.8",
    progress: 98,
    toShow: true,
  },
];
export default academicData;
