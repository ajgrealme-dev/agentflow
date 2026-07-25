## 2026-07-14T01:48:55Z
You are a developer subagent. Your working directory is C:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_m2.
Your task is to implement the Premium Design System (Milestone 2) for the Next.js SaaS ERP application.

Detailed requirements:
1. Custom Fonts Config:
   - Import `Space_Grotesk` and `JetBrains_Mono` from `next/font/google` in `src/app/layout.tsx`.
   - Setup their CSS variables (`--font-space-grotesk` and `--font-jetbrains-mono`) and attach them to the `<html>` or `<body>` class list.
2. Premium Theme Styling in `src/app/globals.css`:
   - Bind `--font-sans` and `--font-mono` inside a Tailwind `@theme` block to their respective custom font variables.
   - Define custom styles/colors for Light mode (clean white, sharp borders, soft shadows) and Dark mode (pitch black, sharp high-contrast accents, glassmorphic textures).
   - Implement the Borderless Glassmorphism custom classes/utilities (e.g. `@utility glass` or `@utility glass-premium`) using background opacity, back-drop filter blurs, and thin borders. Make sure they adapt to light/dark themes.
   - Add animations for:
     - Hover Glow (a glowing radial shadow or accent color when hovering).
     - Interactive Floating/Melayang (a 3D float keyframe loop or transition-transform that lifts the cards up).
     - Custom typography classes using Space Grotesk for headings and JetBrains Mono for stats, numbers, and data points.
3. Verify build:
   - Run the compiler build command (npm run build) to ensure there are no compilation or CSS parsing errors.

MANDATORY INTEGRITY WARNING — include this verbatim:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

When you are done, run build validation, verify the files, write your handoff report to C:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_m2\handoff.md, and send a message back to the orchestrator (main agent, ID: f58174e0-4c52-480a-8699-b0fa53cf61a5).
