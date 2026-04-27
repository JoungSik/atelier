export function expandCommands(commands: readonly string[]): string[] {
  return commands.flatMap((cmd) => {
    const t = cmd.trim();
    if (t.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(t);
        if (Array.isArray(parsed) && parsed.every((x): x is string => typeof x === 'string')) {
          return parsed;
        }
      } catch {
        // JSON 배열이 아니면 그대로 사용
      }
    }
    return cmd;
  });
}
