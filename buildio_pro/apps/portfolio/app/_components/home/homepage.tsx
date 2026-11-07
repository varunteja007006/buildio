import * as React from "react";

import Academics from "./academics";
import Certifications from "./certifications";
import ContactMe from "./contact-me";
import Experience from "./experience";
import Intro from "./intro";
import Languages from "./languages";
import Projects from "./projects";
import Skills from "./skill";

export default function Homepage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-20 p-2 md:px-10 md:py-3 lg:px-24 lg:py-5">
      {/* sections */}
      <Intro />
      <br />
      <Experience />
      <Projects />
      <Skills />
      <Academics />
      <Certifications />
      {/* <Languages /> */}
      <ContactMe />
    </div>
  );
}
