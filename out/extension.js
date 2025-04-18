"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
function activate(context) {
    console.log('Ollama Code Review extension is now active!');
    const infoDecorationType = vscode.window.createTextEditorDecorationType({
        before: {
            contentText: 'ℹ️',
            margin: '0 5px 0 0',
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            color: 'blue',
            fontWeight: 'bold',
        },
    });
    let fullFeedback = '';
    let disposable = vscode.commands.registerCommand('extension.ollamaCodeReview', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            let code;
            const selection = editor.selection;
            if (!selection.isEmpty) {
                code = editor.document.getText(selection);
            }
            else {
                code = editor.document.getText();
            }
            try {
                vscode.window.showInformationMessage('Sending code review request to Ollama...');
                const response = await axios_1.default.post('http://localhost:11434/api/generate', {
                    model: "qwen2.5-coder", //"llama3.2",
                    prompt: `Please review the following javascript code for potential issues, improvements, and suggestions. Focus only on the lines with potential problems or issues. For those lines:\n\n- Point out any logical flaws.\n- Highlight any syntax errors or runtime errors.\n- Mention areas of poor code quality.\n- Provide feedback on best practices and improvements.\n\nIf there are custom or proprietary lines related to ServiceNow, review them appropriately and provide feedback.\n\nPlease explain why the code is problematic for each flagged line.Also check if the code has proper error handling\n\n${code}`,
                    stream: false
                });
                vscode.window.showInformationMessage('Code review response received.');
                fullFeedback = response.data.response || 'No feedback received';
                const outputChannel = vscode.window.createOutputChannel("Code Review Feedback");
                outputChannel.appendLine("Entire Code Review Feedback:");
                outputChannel.appendLine(fullFeedback);
                outputChannel.show();
                const startLine = selection.start.line;
                let decorationRanges = [];
                const position = new vscode.Position(startLine, 0);
                const range = new vscode.Range(position, position);
                decorationRanges.push(range);
                editor.setDecorations(infoDecorationType, decorationRanges);
                context.subscriptions.push(vscode.languages.registerHoverProvider('*', {
                    provideHover(document, position) {
                        if (position.line === startLine) {
                            const markdownFeedback = new vscode.MarkdownString();
                            markdownFeedback.appendMarkdown(fullFeedback);
                            return new vscode.Hover(markdownFeedback);
                        }
                        return null;
                    }
                }));
            }
            catch (error) {
                console.error('Error connecting to Ollama:', error);
                vscode.window.showErrorMessage('Failed to connect to Ollama. Please make sure the Ollama model is running locally.');
            }
        }
        else {
            vscode.window.showErrorMessage('No active editor found.');
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map