import { JSX } from "react";

export default function Loading(): JSX.Element {
	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white">
			<div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
				<div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-white" />
				<div className="text-center text-lg font-medium tracking-wide">
					Loading portfolio…
				</div>
			</div>
		</div>
	);
}
