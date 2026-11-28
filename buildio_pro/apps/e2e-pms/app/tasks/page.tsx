import { getTasks, projects, statuses } from "@/lib/tasks";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function selectedValue(
  value: string | string[] | undefined,
  options: string[],
) {
  const first = Array.isArray(value) ? value[0] : value;
  return first && options.includes(first) ? first : "";
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const project = selectedValue(params.project, projects);
  const status = selectedValue(params.status, statuses);
  const tasks = getTasks(project, status);

  return (
    <>
      <h1>Tasks</h1>
      <form
        key={JSON.stringify([project, status])}
        className="panel filters"
        action="/tasks"
        method="get"
      >
        <label>
          Project
          <select name="project" defaultValue={project}>
            <option value="">All projects</option>
            {projects.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Apply filters</button>
        <a href="/tasks">Reset</a>
      </form>
      <p className="muted">
        {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
      </p>
      {tasks.length ? (
        <ul className="task-list">
          {tasks.map((task) => (
            <li className="panel task" key={task.id}>
              <div>
                <h2>{task.title}</h2>
                <p className="muted">
                  {task.project} · {task.owner} · Due {task.due}
                </p>
              </div>
              <span className="status">{task.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel">No tasks match these filters.</p>
      )}
    </>
  );
}
