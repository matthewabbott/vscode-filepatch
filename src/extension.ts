// src/extension.ts
import * as vscode from 'vscode';
import { DiffPresenter } from './diffPresenter';
import type { ExtensionContext, Change } from './types';
import { createPatch } from 'diff';

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
                'Paste the updated code and press Enter when done',
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

            // Create the change
            const change: Change = {
                identifier: editor.document.fileName,
                originalContent: originalText,
                newContent: patchText,
                diffText: createPatch('file', originalText, patchText),
                range: new vscode.Range(
                    editor.document.positionAt(0),
                    editor.document.positionAt(originalText.length)
                )
            };

            // Show diff and get approval
            const diffPresenter = new DiffPresenter();
            const approved = await diffPresenter.showDiffAndGetApproval(change);

            if (approved) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(editor.document.uri, change.range, change.newContent);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Changes applied successfully');
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error: ${message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}