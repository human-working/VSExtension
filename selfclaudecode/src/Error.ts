export default interface EditorError {
  line: number;                       // line numbers are numbers, not strings
  severity: "error" | "warning";      // only these two values are allowed
  message: string;                    // the actual error text
}

