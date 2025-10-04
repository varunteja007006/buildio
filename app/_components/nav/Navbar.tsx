"use client"

import * as React from "react"

import { ModeToggle } from "@/components/toggle-theme"

import Icon from "./Icon"

export function Navbar() {
  return (
    <div className="w-full flex-row items-center justify-between gap-10 px-4 py-2 flex">
      <Icon />
      <ModeToggle />
    </div>
  )
}
