import EditorError from "./Error";

export default interface EditorContext {
  file: string;
  language: string;
  selection: string;
  errors: EditorError[];
  fullText: string;
}

