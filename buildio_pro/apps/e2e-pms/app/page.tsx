import Link from "next/link";

import { getTasks, projects } from "@/lib/tasks";

export default function DashboardPage() {
  const tasks = getTasks();

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">
        {projects.length} projects · {tasks.length} tasks
      </p>
      <ul className="project-grid">
        {projects.map((project) => {
          const projectTasks = tasks.filter((task) => task.project === project);
          const completed = projectTasks.filter(
            (task) => task.status === "Done",
          ).length;

          return (
            <li className="panel" key={project}>
              <h2>
                <Link href={{ pathname: "/tasks", query: { project } }}>
                  {project}
                </Link>
              </h2>
              <p className="muted">
                {completed} of {projectTasks.length} tasks complete
              </p>
            </li>
          );
        })}
      </ul>
      <Link href="/tasks">View all tasks</Link>
    </>
  );
}
