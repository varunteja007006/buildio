import { UserRegistration } from "./user-registration";

export default function Home() {
  return (
    <div className="sm:min-h-[calc(100svh-18rem)] sm:gap-12 flex min-h-[calc(100svh-3rem)] flex-col items-center justify-center gap-10 ">
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold text-primary sm:text-5xl">
          Poker Planner
        </h1>
        <UserRegistration className="w-full max-w-sm" />
      </div>
    </div>
  );
}
