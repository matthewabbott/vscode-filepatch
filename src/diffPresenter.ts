// src/diffPresenter.ts
import * as vscode from 'vscode';
import type { Change, Uri } from './types';

export class DiffPresenter {
    async showDiffAndGetApproval(change: Change): Promise<boolean> {
        const uri = vscode.window.activeTextEditor?.document.uri;
        if (!uri) { return false; }

        // Create URIs for diff editor
        const originalUri = uri.with({ scheme: 'original', path: uri.path + '.original' });
        const modifiedUri = uri.with({ scheme: 'modified', path: uri.path + '.modified' });

        // Register content providers
        const registration = vscode.workspace.registerTextDocumentContentProvider('original', {
            provideTextDocumentContent: () => change.originalContent
        });

        const registration2 = vscode.workspace.registerTextDocumentContentProvider('modified', {
            provideTextDocumentContent: () => change.newContent
        });

        // Show diff
        await vscode.commands.executeCommand('vscode.diff',
            originalUri,
            modifiedUri,
            `Changes for ${change.identifier}`
        );

        // Ask for approval
        const result = await vscode.window.showInformationMessage(
            'Apply this change?',
            { modal: true },
            'Yes',
            'No'
        );

        // Clean up
        registration.dispose();
        registration2.dispose();

        return result === 'Yes';
    }
}