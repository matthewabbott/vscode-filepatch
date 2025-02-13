// src/types.ts
import type * as vscode from 'vscode';

export interface Change {
    type: 'method' | 'partial';
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