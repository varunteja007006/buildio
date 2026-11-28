import Link from "next/link";

import { TaskCommandForm } from "@/components/molecules/task-command-form";
import { projects } from "@/lib/task-filters";
import { getTasks } from "@/lib/tasks";

export default function DashboardPage() {
  const tasks = getTasks();

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">
        {projects.length} projects · {tasks.length} tasks
      </p>
      <TaskCommandForm />
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
