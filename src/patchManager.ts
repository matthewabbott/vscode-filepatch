// src/patchManager.ts
import * as vscode from 'vscode';
import { parseCode, findMethods, Method } from './parser';
import { Change } from './types';
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

    private methodSignaturesMatch(method1: Method, method2: Method): boolean {
        // Simple signature matching - can be made more sophisticated
        return method1.signature === method2.signature;
    }

    async applyChanges(editor: vscode.TextEditor, changes: Change[]): Promise<void> {
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
