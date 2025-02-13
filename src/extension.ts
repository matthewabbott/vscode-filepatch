// src/extension.ts
import * as vscode from 'vscode';
import { createPatch, parsePatch, applyPatch } from 'diff';

export function activate(context: vscode.ExtensionContext) {
    console.log('vscode-filepatch is now active');

    // Keep track of the original document and diff editor
    let originalUri: vscode.Uri | undefined;
    let diffEditor: vscode.TextEditor | undefined;

    // Command to start diff
    let startDiffCommand = vscode.commands.registerCommand('vscode-filepatch.applyPatch', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            // Store original URI
            originalUri = editor.document.uri;
            const originalContent = editor.document.getText();

            // Create a new untitled document
            const newDocument = await vscode.workspace.openTextDocument({
                content: originalContent,
                language: editor.document.languageId
            });

            // Show both documents in diff editor
            await vscode.commands.executeCommand('vscode.diff',
                originalUri,
                newDocument.uri,
                'Review Changes (edit right side)',
                {
                    preview: false,
                    viewColumn: vscode.ViewColumn.Active
                }
            );

            // Get the diff editor
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure diff editor is ready
            diffEditor = vscode.window.activeTextEditor;

            // Show info message about available commands
            vscode.window.showInformationMessage(
                'Use "Copy Unmodified Content" command to copy unchanged content from left to right. Use "Apply Changes" to save.',
                'OK'
            );

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error: ${message}`);
        }
    });

    // Command to copy unmodified content
    let copyUnmodifiedCommand = vscode.commands.registerCommand('vscode-filepatch.copyUnmodified', async () => {
        if (!diffEditor || !originalUri) {
            vscode.window.showErrorMessage('No active diff editor found');
            return;
        }

        try {
            const rightEditor = diffEditor;
            const leftDoc = await vscode.workspace.openTextDocument(originalUri);
            const leftContent = leftDoc.getText();
            const rightContent = rightEditor.document.getText();

            // Generate diff to identify modified parts
            const patch = createPatch('file', leftContent, rightContent);
            const changes = parsePatch(patch);

            // Copy unmodified content
            let newContent = rightContent;
            for (const change of changes) {
                for (const hunk of change.hunks) {
                    // If lines were removed but nothing was added, copy the original content
                    if (hunk.lines.some(line => line.startsWith('-')) && 
                        !hunk.lines.some(line => line.startsWith('+'))) {
                        const originalLines = leftContent.split('\n')
                            .slice(hunk.oldStart - 1, hunk.oldStart - 1 + hunk.oldLines);
                        newContent = applyHunkToContent(newContent, hunk.newStart - 1, originalLines.join('\n'));
                    }
                }
            }

            // Apply the changes
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                rightEditor.document.positionAt(0),
                rightEditor.document.positionAt(rightEditor.document.getText().length)
            );
            edit.replace(rightEditor.document.uri, fullRange, newContent);
            await vscode.workspace.applyEdit(edit);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error copying unmodified content: ${message}`);
        }
    });

    // Command to apply changes directly to original file
    let applyChangesCommand = vscode.commands.registerCommand('vscode-filepatch.saveChanges', async () => {
        if (!diffEditor || !originalUri) {
            vscode.window.showErrorMessage('No active diff editor found');
            return;
        }

        try {
            const newContent = diffEditor.document.getText();
            
            // Apply changes directly to original file
            const edit = new vscode.WorkspaceEdit();
            const originalDoc = await vscode.workspace.openTextDocument(originalUri);
            const fullRange = new vscode.Range(
                originalDoc.positionAt(0),
                originalDoc.positionAt(originalDoc.getText().length)
            );
            edit.replace(originalUri, fullRange, newContent);
            await vscode.workspace.applyEdit(edit);
            
            // Close the diff editor
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            
            // Show the original file
            await vscode.window.showTextDocument(originalUri);
            
            vscode.window.showInformationMessage('Changes applied successfully');

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error applying changes: ${message}`);
        }
    });

    context.subscriptions.push(startDiffCommand);
    context.subscriptions.push(copyUnmodifiedCommand);
    context.subscriptions.push(applyChangesCommand);
}

function applyHunkToContent(content: string, line: number, newContent: string): string {
    const lines = content.split('\n');
    lines.splice(line, 0, newContent);
    return lines.join('\n');
}

export function deactivate() {}