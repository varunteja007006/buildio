import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(":memory:");
db.exec(`CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT, project TEXT, status TEXT, due TEXT, owner TEXT);
INSERT INTO tasks (title, project, status, due, owner) VALUES
('Map onboarding journey','Website refresh','In progress','Nov 28','Maya Chen'),
('Review mobile layouts','Website refresh','Todo','Nov 29','Jordan Lee'),
('Connect analytics events','Product launch','In review','Nov 30','Sam Rivera'),
('Write launch checklist','Product launch','Done','Nov 25','Maya Chen'),
('Audit workspace permissions','Internal tools','Todo','Dec 02','Alex Morgan'),
('Polish empty states','Internal tools','In progress','Dec 03','Jordan Lee');`);
export type Task = {
  id: number;
  title: string;
  project: string;
  status: string;
  due: string;
  owner: string;
};
export function getTasks(project?: string, status?: string): Task[] {
  const clauses: string[] = [];
  const values: string[] = [];
  if (project) {
    clauses.push("project = ?");
    values.push(project);
  }
  if (status) {
    clauses.push("status = ?");
    values.push(status);
  }
  return db
    .prepare(
      `SELECT * FROM tasks ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY id`,
    )
    .all(...values) as Task[];
}
