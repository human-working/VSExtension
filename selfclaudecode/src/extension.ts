// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import EditorError from "./Error";
import EditorContext from "./EditorContexts";

export function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand("selfecodebot.ask", async () => {
    const ctx = getEditorContext();            // ← fresh snapshot every time
    if (!ctx) {
      vscode.window.showWarningMessage("Open a file first.");
      return;
    }
    const prompt = buildPrompts(ctx).join("\n\n");
		
  });

  context.subscriptions.push(cmd);
}

 function getEditorContext(): EditorContext | undefined {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return undefined;

	const doc = editor.document;
	return {
		file: vscode.workspace.asRelativePath(doc.uri),
		language: doc.languageId,
		selection: doc.getText(editor.selection),
		errors: vscode.languages.getDiagnostics(doc.uri).map((d): EditorError => ({
		line: d.range.start.line + 1,
		severity: d.severity === vscode.DiagnosticSeverity.Error ? "error" : "warning",
		message: d.message,
		})),
		fullText: doc.getText(),
	};
}

function buildPrompts(context: EditorContext): string[] {

	const prompts: string[] = []; 
	context.errors.forEach((err, i) => {
  		prompts.push("You are a senior engineer reviewing erros within this students code")
	});
 
	return prompts

}
// This method is called when your extension is deactivated
export function deactivate() {}
