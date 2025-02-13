// src/parser.ts
import * as vscode from 'vscode';
import type { Range, Position } from './types.js';

export interface Method {
    signature: string;
    body: string;
    range: Range;
}

export async function parseCode(content: string): Promise<Method[]> {
    const methods: Method[] = [];
    const methodRegex = /(?:public|private|protected|internal|static).*?\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/gs;
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
        const fullMatch = match[0];
        const methodName = match[1];
        const body = match[2];
        
        // Calculate the range
        const startPos = content.indexOf(fullMatch);
        const endPos = startPos + fullMatch.length;
        
        const startPosition = new vscode.Position(
            content.substring(0, startPos).split('\n').length - 1,
            0
        );
        const endPosition = new vscode.Position(
            content.substring(0, endPos).split('\n').length - 1,
            content.substring(0, endPos).split('\n').pop()?.length || 0
        );
        
        methods.push({
            signature: methodName,
            body: body.trim(),
            range: new vscode.Range(startPosition, endPosition)
        });
    }
    
    return methods;
}

export async function findMethods(content: string): Promise<Method[]> {
    return parseCode(content);
}