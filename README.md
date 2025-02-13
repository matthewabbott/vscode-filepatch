# File Patch Helper

A simple VS Code extension that makes it easy to paste and review code changes. Opens your current file in a diff view, letting you paste modifications and review them side-by-side before applying.

## Usage

1. Open any file you want to modify
2. Press `Ctrl+K Ctrl+P` (Mac: `Cmd+K Cmd+P`) or run "Open Diff View for Patching" from the command palette
3. Paste your changes in the right panel
4. Review the differences
5. Click "Apply Changes" in the status bar or press `Ctrl+K Ctrl+S` to save

I made this thing basically to make it easy to use the diff viewer on temp pasted content so my friend Claude the AI, when not operating directly on my files, could say `// [rest of the methods stay the same]` to his heart's content, and I could still lazily just slap his edits in directly.

## Local Installation

1. Make sure you have Node.js installed
2. Clone/download this repository
3. Run `npm install` in the extension directory
4. Run `npm run compile`
5. Create a .vsix package:
   ```bash
   npm install -g @vscode/vsce
   vsce package --allow-missing-repository
   ```
6. Install the extension in VS Code:
   - Press `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
   - Type "Install from VSIX"
   - Select the .vsix file you just created
7. Restart VS Code

## Features

- One-click diff view for reviewing changes
- Side-by-side comparison
- Direct save back to original file
- No temp files left behind
- Keyboard shortcuts for quick access