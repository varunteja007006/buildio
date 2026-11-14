"use client";

import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@workspace/ui/components/sortable";
import { GripVerticalIcon } from "lucide-react";
import * as React from "react";

type Task = { id: string; label: string };

const initialTasks: Task[] = [
  { id: "design", label: "Design system" },
  { id: "build", label: "Build components" },
  { id: "test", label: "Test coverage" },
  { id: "ship", label: "Ship release" },
];

export function SortableDemo() {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);

  return (
    <div className="relative w-full overflow-hidden rounded-md border bg-background p-3">
      <Sortable
        value={tasks}
        onValueChange={setTasks}
        getItemValue={(item) => item.id}
      >
        <SortableContent className="flex flex-col gap-2">
          {tasks.map((task) => (
            <SortableItem
              key={task.id}
              value={task.id}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-xs"
            >
              <SortableItemHandle
                aria-label={`Reorder ${task.label}`}
                className="text-muted-foreground"
              >
                <GripVerticalIcon className="size-4" />
              </SortableItemHandle>
              {task.label}
            </SortableItem>
          ))}
        </SortableContent>
      </Sortable>
    </div>
  );
}
