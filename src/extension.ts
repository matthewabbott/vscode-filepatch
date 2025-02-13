// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Create status bar items
    const copyButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    copyButton.text = "$(file-symlink-file) Copy Unmodified";
    copyButton.tooltip = "Copy unmodified methods from original file";
    copyButton.command = 'vscode-filepatch.copyUnmodified';

    const saveButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        99
    );
    saveButton.text = "$(save) Apply Changes";
    saveButton.tooltip = "Apply changes to original file";
    saveButton.command = 'vscode-filepatch.saveChanges';

    let disposables: vscode.Disposable[] = [];
    
    // Command to start diff
    let startDiffCommand = vscode.commands.registerCommand('vscode-filepatch.applyPatch', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            // Get the original content
            const originalContent = editor.document.getText();
            const originalUri = editor.document.uri;

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

            // Show the buttons
            copyButton.show();
            saveButton.show();

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error: ${message}`);
        }
    });

    // Command to copy unmodified content
    let copyUnmodifiedCommand = vscode.commands.registerCommand('vscode-filepatch.copyUnmodified', async () => {
        const diffEditor = vscode.window.activeTextEditor;
        if (!diffEditor || !isDiffEditor()) {
            vscode.window.showErrorMessage('No active diff editor found');
            return;
        }

        try {
            // Get both documents
            const originalDoc = await getOriginalDocument();
            if (!originalDoc) return;

            const originalText = originalDoc.getText();
            const modifiedText = diffEditor.document.getText();

            // Parse both files to find methods
            const originalMethods = findMethods(originalText);
            const modifiedMethods = findMethods(modifiedText);

            // Find methods that exist in original but not in modified
            const missingMethods = originalMethods.filter(origMethod => 
                !modifiedMethods.some(modMethod => 
                    methodNamesMatch(origMethod.name, modMethod.name)
                )
            );

            if (missingMethods.length === 0) {
                vscode.window.showInformationMessage('No unmodified methods to copy');
                return;
            }

            // Insert missing methods at appropriate positions
            const edit = new vscode.WorkspaceEdit();
            const insertPosition = findInsertPosition(modifiedText);
            
            const methodsToInsert = missingMethods
                .map(method => method.fullText)
                .join('\n\n');

            edit.insert(
                diffEditor.document.uri,
                insertPosition,
                '\n\n' + methodsToInsert
            );

            await vscode.workspace.applyEdit(edit);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error copying unmodified content: ${message}`);
        }
    });

    // Add cleanup for status bar items
    context.subscriptions.push(
        copyButton,
        saveButton,
        startDiffCommand,
        copyUnmodifiedCommand,
        // When diff editor closes, hide the buttons
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (!editor || !isDiffEditor()) {
                copyButton.hide();
                saveButton.hide();
            } else {
                copyButton.show();
                saveButton.show();
            }
        })
    );
}

function isDiffEditor(): boolean {
    return vscode.window.activeTextEditor?.document.uri.scheme === 'file';
}

async function getOriginalDocument(): Promise<vscode.TextDocument | undefined> {
    const originalUri = vscode.window.activeTextEditor?.document.uri
        .with({ scheme: 'file' });
    if (!originalUri) return undefined;
    
    return await vscode.workspace.openTextDocument(originalUri);
}

interface ParsedMethod {
    name: string;
    fullText: string;
    startLine: number;
    endLine: number;
}

function findMethods(text: string): ParsedMethod[] {
    const methods: ParsedMethod[] = [];
    const lines = text.split('\n');
    let inMethod = false;
    let currentMethod: Partial<ParsedMethod> = {};
    let braceCount = 0;

    const methodStartRegex = /\s*(public|private|protected)\s+.*?\s+(\w+)\s*\(/;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!inMethod) {
            const match = line.match(methodStartRegex);
            if (match) {
                inMethod = true;
                braceCount = 0;
                currentMethod = {
                    name: match[2],
                    startLine: i,
                    fullText: line
                };
            }
        }
        
        if (inMethod) {
            if (currentMethod.fullText !== line) {
                currentMethod.fullText += '\n' + line;
            }
            
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (braceCount === 0) {
                currentMethod.endLine = i;
                methods.push(currentMethod as ParsedMethod);
                inMethod = false;
                currentMethod = {};
            }
        }
    }
    
    return methods;
}

function methodNamesMatch(name1: string, name2: string): boolean {
    return name1.trim() === name2.trim();
}

function findInsertPosition(text: string): vscode.Position {
    const lines = text.split('\n');
    let lastMethodEnd = -1;
    
    // Look for the last closing brace of a method
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === '}') {
            lastMethodEnd = i;
            break;
        }
    }
    
    return new vscode.Position(
        lastMethodEnd !== -1 ? lastMethodEnd + 1 : lines.length,
        0
    );
}

export function deactivate() {}