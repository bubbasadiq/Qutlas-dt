"use client"

import Navbar from "@/components/navbar"
import { useState } from "react"

export default function WorkspacePage() {
  const [selectedTool, setSelectedTool] = useState("select")

  const tools = ["Select", "Move", "Rotate", "Scale", "Shape", "Measure"]

  return (
    <main className="w-full h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* Left Sidebar */}
        <div className="w-64 glass-dark border-r border-gray-600 p-6 overflow-y-auto">
          <h3 className="text-white font-serif text-sm mb-6">Tools</h3>
          <div className="space-y-2">
            {tools.map((tool) => (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool.toLowerCase())}
                className={`w-full text-left px-4 py-2 rounded-lg font-sans text-sm transition-all ${
                  selectedTool === tool.toLowerCase() ? "bg-amber-500 text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 bg-white flex items-center justify-center relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="text-center z-10">
            <p className="text-gray-400 font-sans">Select a tool to begin</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 glass-dark border-l border-gray-600 p-6 overflow-y-auto">
          <h3 className="text-white font-serif text-sm mb-6">Properties</h3>
          <div className="space-y-4 text-gray-300 font-sans text-sm">
            <div>
              <label className="block text-white mb-1">Position X</label>
              <input type="number" className="w-full glass px-2 py-1 text-gray-900" />
            </div>
            <div>
              <label className="block text-white mb-1">Position Y</label>
              <input type="number" className="w-full glass px-2 py-1 text-gray-900" />
            </div>
            <div>
              <label className="block text-white mb-1">Position Z</label>
              <input type="number" className="w-full glass px-2 py-1 text-gray-900" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
