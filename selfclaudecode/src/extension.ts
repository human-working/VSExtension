// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import EditorError from "./Error";
import EditorContext from "./EditorContexts";
import Anthropic from "@anthropic-ai/sdk";

const SECRET_KEY = "selfclaudebot.anthropicApiKey";

const QUESTION_PROMPT = `# Role
You are a patient coding tutor inside VS Code, helping a beginner understand an error.

# Task
Read the error and the code around it. Reply with ONE guiding question that helps the
user work out the cause themselves.

# Rules
- Exactly one question, at most 25 words.
- Plain text only: no markdown, no code blocks, no backticks.
- Do not give the answer or the fix. Point their attention at the right place
  (a specific line, variable, or concept) so they can spot it.
- Use simple, friendly language a beginner understands.

# Examples
Error: "Cannot find name 'cosnole'" -> Look closely at how 'cosnole' is spelled on that line - does it match the built-in object you meant?
Error: "Object is possibly 'undefined'" -> What happens on this line if no file is open in the editor?`;


// Get a client, asking for the key the first time

async function getClient(context: vscode.ExtensionContext): Promise<Anthropic | undefined> {
  let apiKey = await context.secrets.get(SECRET_KEY);

  if (!apiKey) {
    apiKey = await vscode.window.showInputBox({
      prompt: "Enter your Anthropic API key",
      password: true,               // hides what you type
      ignoreFocusOut: true,
    });
    if (!apiKey) return undefined;  // user cancelled
    await context.secrets.store(SECRET_KEY, apiKey);
  }

  return new Anthropic({ apiKey });
}

export function activate(context: vscode.ExtensionContext) {
  // Lets you change or reset the key later
  context.subscriptions.push(
    vscode.commands.registerCommand("codebot.setApiKey", async () => {
      await context.secrets.delete(SECRET_KEY);
      await getClient(context);
      vscode.window.showInformationMessage("API key saved.");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codebot.explainError", async () => {
      const client = await getClient(context);
      if (!client) return;
	
		const ctx = getEditorContext();          
		if (!ctx) {
			vscode.window.showWarningMessage("Open a file first.");
			return;
		}
		for (const userPrompt of buildPrompts(ctx)) {

			// will need to add error handling if tokens exceed 
				const response = await client.beta.messages.create({
					model: "claude-opus-5-5",
					max_tokens: 2000,
					output_config: { effort: "low" },
					betas: ["server-side-fallback-2026-07-01"],
					fallbacks: "default",
					system: QUESTION_PROMPT,                        // same instructions every time
					messages: [{ role: "user", content: userPrompt }], // different error each time
				});
			
			}
		 // maybe add judge module to imporve quality of response 
  	}));
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

// Builds one prompt per error, using only that error's details
function buildPrompts(ctx: EditorContext): string[] {
  const prompts: string[] = [];
  ctx.errors.forEach((err, i) => {
    prompts.push(
      `Language: ${ctx.language}\n` +
      `Error ${i + 1} (${err.severity}) on line ${err.line}: ${err.message}`
    );
  });
  return prompts;                   
}

// This method is called when your extension is deactivated
export function deactivate() {}
