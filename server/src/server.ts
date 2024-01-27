import log from "./log";
import { initialize } from "./methods/initialize";
import { completion } from "./methods/textDocument/completion";
import { didChange } from "./methods/textDocument/didChange";

interface Message {
	jsonrpc: string;
}

export interface RequestMessage extends Message {
	id: number | string;
	method: string;
	params?: unknown[] | object;
}

export interface NotificationMessage extends Message {
	method: string;
	params?: unknown[] | object;
}

type NotificationMethod = (message: NotificationMessage) => void;

type RequestMethod = (message: RequestMessage) => ReturnType<typeof initialize> | ReturnType<typeof completion>;

const methodLookup: Record<string, RequestMethod | NotificationMethod> = { 
    initialize,
    'textDocument/didChange': didChange,
    'textDocument/completion': completion,
 };

const respond = (id: RequestMessage["id"], result: unknown) => {    
    const message = JSON.stringify({id, result});
    const messageLength = Buffer.byteLength(message, "utf8");
    const header = `Content-Length: ${messageLength}\r\n\r\n`;

    log.write(header + message);
    process.stdout.write(header + message);
};

let buffer = "";

process.stdin.on("data", (chunk) => {
    buffer += chunk.toString();

    while(true) {
        const contentLengthMatch = /Content-Length: (\d+)/.exec(buffer);

        if (!contentLengthMatch) {
            break;
        }

        const contentLength = Number.parseInt(contentLengthMatch[1], 10);
        const messageStart = buffer.indexOf("\r\n\r\n") + 4;

        if (buffer.length < messageStart + contentLength) {
            break;
        }

        const rawMessage = buffer.slice(messageStart, messageStart + contentLength);
        const message = JSON.parse(rawMessage);
        log.write({id: message.id, method: message.method});

        buffer = buffer.slice(messageStart + contentLength);


        const method = methodLookup[message.method];
        if(method) {
            const result = method(message);
            
            if(result !== undefined) {
                respond(message.id, result);
            }
        }
    }
});
