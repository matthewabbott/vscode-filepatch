// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('vscode-filepatch is now active');

    let disposable = vscode.commands.registerCommand('vscode-filepatch.applyPatch', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            // Get the original content
            const originalContent = editor.document.getText();
            const originalUri = editor.document.uri;

            // Create a new untitled document with the same content
            const newDocument = await vscode.workspace.openTextDocument({
                content: originalContent,
                language: editor.document.languageId
            });

            // Show both documents in diff editor
            await vscode.commands.executeCommand('vscode.diff',
                originalUri,
                newDocument.uri,
                'Review Changes (edit right side, then save to apply)',
                {
                    preview: false,
                    viewColumn: vscode.ViewColumn.Active
                }
            );

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error: ${message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}