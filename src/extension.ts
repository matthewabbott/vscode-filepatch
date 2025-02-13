// src/extension.ts
import * as vscode from 'vscode';
import { PatchManager } from './patchManager';
import { DiffPresenter } from './diffPresenter';

export function activate(context: vscode.ExtensionContext) {
    console.log('vscode-filepatch is now active');

    let disposable = vscode.commands.registerCommand('vscode-filepatch.applyPatch', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            // Get the patch content from the user
            const patchContent = await vscode.window.showInputBox({
                prompt: 'Paste the patch content (modified methods only)',
                multiline: true
            });

            if (!patchContent) {
                return;
            }

            const patchManager = new PatchManager();
            const diffPresenter = new DiffPresenter();

            // Compare the files and generate changes
            const changes = await patchManager.generateChanges(
                editor.document.getText(),
                patchContent
            );

            if (changes.length === 0) {
                vscode.window.showInformationMessage('No changes detected');
                return;
            }

            // Show the diff and get user approval
            const approvedChanges = await diffPresenter.showDiffAndGetApproval(changes);

            if (approvedChanges.length > 0) {
                // Apply the approved changes
                await patchManager.applyChanges(editor, approvedChanges);
                vscode.window.showInformationMessage('Patch applied successfully');
            } else {
                vscode.window.showInformationMessage('No changes were approved');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error applying patch: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}