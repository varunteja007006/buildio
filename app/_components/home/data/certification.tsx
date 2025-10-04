import { generateId } from "@workspace/utils/utils";

const certificationData = [
  {
    id: generateId(),
    certificate_name: "Introduction to Machine Learning",
    certificate_provider: "Coursera",
    certificate_image: "",
    certificate_year: "",
    toShow: true,
  },
  {
    id: generateId(),
    certificate_name: "Get Ready for Generative AI",
    certificate_provider: "LinkedIn Learning",
    certificate_image: "",
    certificate_year: "",
    toShow: true,
  },
  {
    id: generateId(),
    certificate_name: "React (Basic)",
    certificate_provider: "HackerRank",
    certificate_image: "",
    certificate_year: "",
    toShow: true,
  },
  {
    id: generateId(),
    certificate_name: "Python (Basic)",
    certificate_provider: "HackerRank",
    certificate_image: "",
    certificate_year: "",
    toShow: true,
  },
  {
    id: generateId(),
    certificate_name: "Introduction of JavaScript",
    certificate_provider: "Great Learning",
    certificate_image: "",
    certificate_year: "",
    toShow: true,
  },
  {
    id: 2,
    certificate_name: "PCAP Programming Essentials in Python",
    certificate_provider: "Cisco",
    certificate_image: "",
    certificate_year: "",
    toShow: false,
  },
  {
    id: generateId(),
    certificate_name: "Building Web Applications in PHP",
    certificate_provider: "Coursera",
    certificate_image: "",
    certificate_year: "",
    toShow: false,
  },
  {
    id: generateId(),
    certificate_name: "Introduction to Prompt Engineering for Generative AI",
    certificate_provider: "LinkedIn Learning",
    certificate_image: "",
    certificate_year: "",
    toShow: true,
  },
]
export default certificationData
