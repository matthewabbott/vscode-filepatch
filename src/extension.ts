// src/extension.ts
import * as vscode from 'vscode';
import { PatchManager } from './patchManager';
import { DiffPresenter } from './diffPresenter';
import type { ExtensionContext } from './types';

export function activate(context: ExtensionContext) {
    console.log('vscode-filepatch is now active');

    let disposable = vscode.commands.registerCommand('vscode-filepatch.applyPatch', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            // Get the original content
            const originalText = editor.document.getText();

            // Create new document for patch
            const patchDoc = await vscode.workspace.openTextDocument({ 
                content: '', 
                language: editor.document.languageId 
            });
            const patchEditor = await vscode.window.showTextDocument(patchDoc, {
                viewColumn: vscode.ViewColumn.Beside
            });

            // Wait for user input
            const result = await vscode.window.showInformationMessage(
                'Paste the updated methods and press Enter when done',
                { modal: true },
                'Done',
                'Cancel'
            );

            const patchText = patchEditor.document.getText();
            
            // Clean up patch editor
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

            if (result !== 'Done' || !patchText.trim()) {
                return;
            }

            const patchManager = new PatchManager();
            const diffPresenter = new DiffPresenter();

            // Generate changes based on method differences
            const changes = await patchManager.generateChanges(originalText, patchText);

            if (changes.length === 0) {
                vscode.window.showInformationMessage('No method changes detected');
                return;
            }

            // Process each change one at a time
            for (const change of changes) {
                // Show the diff and get approval
                const approved = await diffPresenter.showDiffAndGetApproval(change);
                
                if (approved) {
                    await patchManager.applyChange(editor, change);
                }
            }

            vscode.window.showInformationMessage('Finished processing changes');

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error: ${message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}