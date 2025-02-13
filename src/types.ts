// src/types.ts
import * as vscode from 'vscode';

export interface Change {
    identifier: string;
    originalContent: string;
    newContent: string;
    diffText: string;
    range: vscode.Range;
}

// Re-export vscode types we need
export type Range = vscode.Range;
export type Position = vscode.Position;
export type TextEditor = vscode.TextEditor;
export type Uri = vscode.Uri;
export type ExtensionContext = vscode.ExtensionContext;
export type WorkspaceEdit = vscode.WorkspaceEdit;