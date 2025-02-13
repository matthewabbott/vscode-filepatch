// src/diffPresenter.ts
import * as vscode from 'vscode';
import { Change } from './types';

export class DiffPresenter {
    async showDiffAndGetApproval(changes: Change[]): Promise<Change[]> {
        const approvedChanges: Change[] = [];

        for (const change of changes) {
            const answer = await vscode.window.showInformationMessage(
                `Apply changes to ${change.identifier}?`,
                { modal: true },
                'Yes',
                'No',
                'Show Diff'
            );

            if (answer === 'Show Diff') {
                await this.showDiff(change);
                // Ask again after showing diff
                const secondAnswer = await vscode.window.showInformationMessage(
                    `Apply changes to ${change.identifier}?`,
                    { modal: true },
                    'Yes',
                    'No'
                );
                if (secondAnswer === 'Yes') {
                    approvedChanges.push(change);
                }
            } else if (answer === 'Yes') {
                approvedChanges.push(change);
            }
        }

        return approvedChanges;
    }

    private async showDiff(change: Change): Promise<void> {
        const uri = vscode.window.activeTextEditor?.document.uri;
        if (!uri) return;

        // Create URIs for diff editor
        const originalUri = uri.with({ scheme: 'original', path: uri.path + '.original' });
        const modifiedUri = uri.with({ scheme: 'modified', path: uri.path + '.modified' });

        // Register text document content provider for the diff editor
        const registration = vscode.workspace.registerTextDocumentContentProvider('original', {
            provideTextDocumentContent(uri: vscode.Uri): string {
                return change.originalContent;
            }
        });

        const registration2 = vscode.workspace.registerTextDocumentContentProvider('modified', {
            provideTextDocumentContent(uri: vscode.Uri): string {
                return change.newContent;
            }
        });

        // Show diff
        await vscode.commands.executeCommand('vscode.diff',
            originalUri,
            modifiedUri,
            `Changes to ${change.identifier}`
        );

        // Clean up
        registration.dispose();
        registration2.dispose();
    }
}