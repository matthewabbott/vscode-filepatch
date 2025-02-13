// src/types.ts
import * as vscode from 'vscode';

export interface Change {
    type: 'method' | 'partial';
    identifier: string;
    originalContent: string;
    newContent: string;
    diffText: string;
    range: vscode.Range;
}