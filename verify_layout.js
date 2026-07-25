const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('Running Layout & Design System Static Verification');
console.log('==================================================');

let failed = false;

function reportError(checkName, message) {
  console.error(`[FAIL] ${checkName}: ${message}`);
  failed = true;
}

function reportSuccess(checkName, message) {
  console.log(`[PASS] ${checkName}: ${message}`);
}

// 1. Verify src/components/Sidebar.tsx
const sidebarPath = path.join(__dirname, 'src', 'components', 'Sidebar.tsx');
if (!fs.existsSync(sidebarPath)) {
  reportError('Sidebar.tsx Location', `File not found at ${sidebarPath}`);
} else {
  const content = fs.readFileSync(sidebarPath, 'utf8');

  // Glassmorphic styles
  const hasLightModeOpacity = content.includes('rgba(255, 255, 255, 0.8)') || /rgba\(255,\s*255,\s*255,\s*0\.\d+\)/.test(content);
  const hasDarkModeOpacity = content.includes('rgba(0, 0, 0, 0.75)') || /rgba\(0,\s*0,\s*0,\s*0\.\d+\)/.test(content);
  const hasThinBorders = content.includes('rgba(255, 255, 255, 0.08)') && content.includes('rgba(0, 0, 0, 0.06)');
  const hasBlur = content.includes('backdropFilter') && content.includes('blur(');

  if (hasLightModeOpacity) {
    reportSuccess('Sidebar Glassmorphism (Light Mode)', 'Found light mode white background opacity style.');
  } else {
    reportError('Sidebar Glassmorphism (Light Mode)', 'Could not find white background opacity (e.g., rgba(255, 255, 255, 0.8)).');
  }

  if (hasDarkModeOpacity) {
    reportSuccess('Sidebar Glassmorphism (Dark Mode)', 'Found dark mode black background opacity style.');
  } else {
    reportError('Sidebar Glassmorphism (Dark Mode)', 'Could not find black background opacity (e.g., rgba(0, 0, 0, 0.75)).');
  }

  if (hasThinBorders) {
    reportSuccess('Sidebar Borders', 'Found thin borders configured for light and dark modes.');
  } else {
    reportError('Sidebar Borders', 'Could not find thin borders configured for both light and dark modes (rgba(255, 255, 255, 0.08) and rgba(0, 0, 0, 0.06)).');
  }

  if (hasBlur) {
    reportSuccess('Sidebar Blur', 'Found backdrop filter blur styles.');
  } else {
    reportError('Sidebar Blur', 'Could not find backdrop filter blur styles.');
  }

  // Ensure no asymmetrically colored layout margins or bars
  // We check the style attribute of the main <aside> tag to ensure background isn't hardcoded.
  const asideOpenRegex = /<aside[\s\S]*?>/;
  const asideOpenMatch = content.match(asideOpenRegex);
  if (asideOpenMatch) {
    const asideTag = asideOpenMatch[0];
    const hasHardcodedBgInAsideTag = /bg-(?:white|black|gray-\d+)/.test(asideTag) || /background:\s*['"`]#[\da-fA-F]+['"`]/.test(asideTag);
    if (hasHardcodedBgInAsideTag) {
      reportError('Sidebar Layout Symmetry', `Sidebar aside tag contains hardcoded background color: ${asideTag}`);
    } else {
      reportSuccess('Sidebar Layout Symmetry', 'Sidebar main container uses a dynamic/themed background (no hardcoded bg colors in tag).');
    }
  } else {
    reportError('Sidebar Layout Symmetry', 'Could not parse the opening <aside> tag in Sidebar.tsx to verify layout symmetry.');
  }
}

// 2. Verify src/app/globals.css
const globalsPath = path.join(__dirname, 'src', 'app', 'globals.css');
if (!fs.existsSync(globalsPath)) {
  reportError('globals.css Location', `File not found at ${globalsPath}`);
} else {
  const content = fs.readFileSync(globalsPath, 'utf8');

  // Verify premium theme variables exist
  const requiredVars = [
    '--primary',
    '--primary-dark',
    '--primary-glow',
    '--bg-base',
    '--bg-card',
    '--bg-elevated',
    '--bg-hover',
    '--border',
    '--border-light',
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--shadow-premium'
  ];

  let missingVars = [];
  requiredVars.forEach(v => {
    if (!content.includes(v)) {
      missingVars.push(v);
    }
  });

  if (missingVars.length === 0) {
    reportSuccess('Premium Theme Variables', 'All premium theme variables are defined in globals.css.');
  } else {
    reportError('Premium Theme Variables', `Missing variables in globals.css: ${missingVars.join(', ')}`);
  }

  // Verify utility classes exist
  const requiredUtilities = [
    'glass-premium',
    'hover-glow',
    'float-interactive',
    'animate-float'
  ];

  let missingUtilities = [];
  requiredUtilities.forEach(u => {
    // Matches @utility name or .name or class-like definitions.
    // Handles space correctly for @utility (e.g. @utility hover-glow or .hover-glow)
    const regex = new RegExp(`(?:@utility\\s+|\\.)${u}\\b`);
    if (!regex.test(content)) {
      missingUtilities.push(u);
    }
  });

  if (missingUtilities.length === 0) {
    reportSuccess('Premium Utility Classes', 'All required utility classes (glass-premium, hover-glow, float-interactive, animate-float) exist in globals.css.');
  } else {
    reportError('Premium Utility Classes', `Missing utility classes in globals.css: ${missingUtilities.join(', ')}`);
  }
}

// 3. Verify src/app/layout.tsx
const layoutPath = path.join(__dirname, 'src', 'app', 'layout.tsx');
if (!fs.existsSync(layoutPath)) {
  reportError('layout.tsx Location', `File not found at ${layoutPath}`);
} else {
  const content = fs.readFileSync(layoutPath, 'utf8');

  // Check font imports
  const importsSpaceGrotesk = content.includes('Space_Grotesk');
  const importsJetBrainsMono = content.includes('JetBrains_Mono');
  const importsGoogleFonts = content.includes('next/font/google');

  if (importsSpaceGrotesk && importsJetBrainsMono && importsGoogleFonts) {
    reportSuccess('Font Imports', 'Space Grotesk and JetBrains Mono are imported from next/font/google.');
  } else {
    reportError('Font Imports', 'Failed to verify imports of Space_Grotesk and JetBrains_Mono from next/font/google.');
  }

  // Check bindings and class lists
  const bindsSpaceGroteskVar = content.includes("variable: '--font-space-grotesk'") || content.includes('variable: "--font-space-grotesk"');
  const bindsJetBrainsMonoVar = content.includes("variable: '--font-jetbrains-mono'") || content.includes('variable: "--font-jetbrains-mono"');
  const appliesVariablesToHtml = content.includes('spaceGrotesk.variable') && content.includes('jetbrainsMono.variable');

  if (bindsSpaceGroteskVar && bindsJetBrainsMonoVar && appliesVariablesToHtml) {
    reportSuccess('Font Variable Binding', 'Fonts are configured with CSS variable names and correctly bound to the layout class list.');
  } else {
    reportError('Font Variable Binding', 'Fonts are not correctly bound to layout class list or missing variable configurations.');
  }
}

console.log('==================================================');
if (failed) {
  console.error('Layout verification FAILED. Please review the errors above.');
  process.exit(1);
} else {
  console.log('Layout verification PASSED successfully!');
  process.exit(0);
}
