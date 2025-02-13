// src/parser.ts
import * as vscode from 'vscode';
import type { Range, Position } from './types';

export interface Method {
    signature: string;
    body: string;
    fullContent: string;  // The entire method including signature
    range: Range;
}

export async function parseCode(content: string): Promise<Method[]> {
    const methods: Method[] = [];
    // Extended regex that captures the full method including signature
    const methodRegex = /((?:public|private|protected|internal|static).*?\s+\w+\s*\([^)]*\)\s*{)([\s\S]*?)}/g;
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
        const signature = match[1];
        const body = match[2];
        const fullContent = match[0];
        
        // Calculate the range
        const startPos = content.indexOf(fullContent);
        const endPos = startPos + fullContent.length;
        
        const startPosition = new vscode.Position(
            content.substring(0, startPos).split('\n').length - 1,
            0
        );
        const endPosition = new vscode.Position(
            content.substring(0, endPos).split('\n').length - 1,
            content.substring(0, endPos).split('\n').pop()?.length || 0
        );
        
        methods.push({
            signature: extractMethodName(signature),
            body: body.trim(),
            fullContent: fullContent,
            range: new vscode.Range(startPosition, endPosition)
        });
    }
    
    return methods;
}

function extractMethodName(signature: string): string {
    // Extract just the method name from the signature
    const nameMatch = signature.match(/\s(\w+)\s*\(/);
    return nameMatch ? nameMatch[1] : signature;
}

export async function findMethods(content: string): Promise<Method[]> {
    return parseCode(content);
}