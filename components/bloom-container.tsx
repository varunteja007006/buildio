"use client"

import React from "react"

type Props = React.PropsWithChildren<{
  className?: string
}>

export default function BloomContainer({ children, className = "" }: Props) {
  // Bloom interactions removed — keep only the static pattern background
  return (
    <div className={`pattern-container ${className}`} role="presentation">
      {children}
    </div>
  )
}
