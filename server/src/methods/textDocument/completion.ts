import { readFileSync } from "fs";
import { TextDocumentIdentifier, documents } from "../../documents";
import log from "../../log";
import { RequestMessage } from "../../server";


const words = readFileSync("/Users/mattias/source/tests/lsp-from-scratch/tmp/words_alpha.txt", "utf8").split("\n");
log.write({words: words.length})



interface Position {
	line: number;
	character: number;
}

interface TextDocumentPositionParams {
	textDocument: TextDocumentIdentifier;
	position: Position;
}

interface CompletionParams extends TextDocumentPositionParams {
}

type CompletionItem = {
    label:string
}

export interface CompletionList {
	isIncomplete: boolean;
    items: CompletionItem[];
}

export const completion = (message: RequestMessage): CompletionList|null => {
    const params = message.params as CompletionParams;
    const content = documents.get(params.textDocument.uri);
    if(!content) {
        return null;
    }

    const currentLine = content?.split("\n")[params.position.line];
    const lineUntilCursor = currentLine.slice(0, params.position.character);
    const currentWord = lineUntilCursor.replace(/.*\W(\w+)$/, "$1");

    const suggestions = words
        .filter(word => word.startsWith(currentWord))
        .slice(0, 100)
        .map(label => ({label}));

    log.write({completion : 
    {
        currentLine, lineUntilCursor, currentWord, suggestions
    }})

    return { isIncomplete: true, items: suggestions }
}
