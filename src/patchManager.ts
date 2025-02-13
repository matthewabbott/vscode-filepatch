// src/patchManager.ts
import * as vscode from 'vscode';
import { parseCode, findMethods, Method } from './parser.js';
import type { Change, TextEditor, WorkspaceEdit } from './types.js';
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
                this.methodSignaturesMatch(m, patchMethod)
            );

            if (originalMethod) {
                // Generate diff if methods are different
                if (originalMethod.body !== patchMethod.body) {
                    const diff = createPatch(
                        'temp',
                        originalMethod.body,
                        patchMethod.body,
                        '',
                        ''
                    );

                    changes.push({
                        type: 'method',
                        identifier: patchMethod.signature,
                        originalContent: originalMethod.body,
                        newContent: patchMethod.body,
                        diffText: diff,
                        range: originalMethod.range
                    });
                }
            }
        }

        return changes;
    }

    private methodSignaturesMatch(m1: Method, m2: Method): boolean {
        return m1.signature === m2.signature;
    }

    async applyChanges(editor: TextEditor, changes: Change[]): Promise<void> {
        const edit = new vscode.WorkspaceEdit();

        for (const change of changes) {
            edit.replace(
                editor.document.uri,
                change.range,
                change.newContent
            );
        }

        await vscode.workspace.applyEdit(edit);
    }
}