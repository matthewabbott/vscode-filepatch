// src/patchManager.ts
import * as vscode from 'vscode';
import { parseCode, findMethods, Method } from './parser';
import type { Change, TextEditor } from './types';
import { createPatch } from 'diff';

export class PatchManager {
    async generateChanges(originalContent: string, patchContent: string): Promise<Change[]> {
        const changes: Change[] = [];
        
        // Parse both files to get their methods
        const originalMethods = await findMethods(originalContent);
        const patchMethods = await findMethods(patchContent);

        // Compare methods and generate changes
        for (const patchMethod of patchMethods) {
            const originalMethod = originalMethods.find(m => 
                this.methodSignaturesMatch(m.signature, patchMethod.signature)
            );

            if (originalMethod && originalMethod.body !== patchMethod.body) {
                changes.push({
                    identifier: patchMethod.signature,
                    originalContent: originalMethod.fullContent,
                    newContent: patchMethod.fullContent,
                    diffText: createPatch(
                        patchMethod.signature,
                        originalMethod.fullContent,
                        patchMethod.fullContent,
                        '',
                        ''
                    ),
                    range: originalMethod.range
                });
            }
        }

        return changes;
    }

    private methodSignaturesMatch(original: string, patch: string): boolean {
        // Remove whitespace and compare
        return original.replace(/\s+/g, '') === patch.replace(/\s+/g, '');
    }

    async applyChange(editor: TextEditor, change: Change): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, change.range, change.newContent);
        await vscode.workspace.applyEdit(edit);
    }
}