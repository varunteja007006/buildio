import * as React from "react"
import ContactIcons from "../home/contact-icons"

export function Footer() {
  return (
    <footer className="space-y-10 p-10">
      <ContactIcons />
      <div className="flex flex-col items-center justify-center gap-4 font-semibold md:flex-row">
        <p>{`-- Made with React 💙 & Next JS 🤍 --`}</p>

        <p>{`< Developer />`}</p>

        <p>{`-- Varun Teja K --`}</p>
      </div>
    </footer>
  )
}
