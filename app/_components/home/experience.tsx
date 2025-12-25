import React from "react";

import {
	addYears,
	differenceInMonths,
	differenceInYears,
	parse,
} from "date-fns";

import { Card } from "@workspace/ui/components/card";

import experienceData from "@/app/_components/home/data/experience";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";

function parseDate(input: string): Date {
	// Empty → treat as today (useful for current role)
	if (!input) return new Date();

	// Try strict ISO-like format first
	let d = parse(input, "yyyy-MM-dd", new Date());
	if (!isNaN(d.getTime())) return d;

	// Fallback to non-zero-padded format
	d = parse(input, "yyyy-M-d", new Date());
	if (!isNaN(d.getTime())) return d;

	// Final fallback to native Date parsing
	d = new Date(input);
	return d;
}

function calcExp(date1: string, date2: string) {
	const resigningDate = parseDate(date1);
	const joiningDate = parseDate(date2);

	// Calculate the difference in years
	let years = differenceInYears(resigningDate, joiningDate);
	// Calculate the remaining months after accounting for the years
	let months = differenceInMonths(resigningDate, addYears(joiningDate, years));

	// Handle the case where months are negative
	if (months < 0) {
		years -= 1;
		months += 12;
	}
	return `${years}.${months}`;
}

export default function Experience() {
	return (
		<section id="experience" className="space-y-4">
			<h3 className="text-xl font-semibold">Experience</h3>
			<Card className="py-6 px-6">
				<ExperienceContext />
			</Card>
		</section>
	);
}

const experienceItems = experienceData
	.filter((e) => e.toShow)
	.sort((a, b) => {
		if (a.current !== b.current) return a.current ? -1 : 1;
		const da = parseDate(a.dateOfJoining);
		const db = parseDate(b.dateOfJoining);
		return db.getTime() - da.getTime();
	});

function ExperienceContext() {
	return (
		<>
			{experienceItems.map((exp, index) => {
				const rangeLabel = `${exp.workingFrom} — ${exp.workingTill || "Present"}`;
				const duration = calcExp(exp.dateOfResigning || "", exp.dateOfJoining);
				const title = `${exp.jobTitle} · ${exp.company}`;

				return (
					<div className="flex flex-col space-y-1.5" key={exp.id}>
							<div className="text-lg font-semibold">{title}</div>
							<div className="text-sm text-muted-foreground">{`${rangeLabel} (${duration} yrs)`}</div>
							<div>{exp.jobDescription[0]}</div>
							<Separator className={cn("my-2", index === experienceItems.length - 1 && "hidden")} />
					</div>
				);
			})}
		</>
	);
}
