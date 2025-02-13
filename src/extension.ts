// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Create save button
    const saveButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        99
    );
    saveButton.text = "$(save) Apply Changes";
    saveButton.tooltip = "Apply changes directly to original file";
    saveButton.command = 'vscode-filepatch.saveChanges';

    let originalUri: vscode.Uri | undefined;

    // Command to start diff
    let startDiffCommand = vscode.commands.registerCommand('vscode-filepatch.applyPatch', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
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

            saveButton.show();

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error: ${message}`);
        }
    });

    // Command to save changes
    let saveChangesCommand = vscode.commands.registerCommand('vscode-filepatch.saveChanges', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !originalUri) {
            vscode.window.showErrorMessage('No active diff editor found');
            return;
        }

        try {
            const newContent = editor.document.getText();
            
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

    // Hide/show save button based on editor
    context.subscriptions.push(
        saveButton,
        startDiffCommand,
        saveChangesCommand,
        vscode.window.onDidChangeActiveTextEditor(() => {
            if (vscode.window.activeTextEditor?.document.uri.scheme === 'file') {
                saveButton.show();
            } else {
                saveButton.hide();
            }
        })
    );
}

export function deactivate() {}