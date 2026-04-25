const VAR_PATTERN = /\$\{(\w+)\}/g;

/**
 * `${name}` 형태의 placeholder를 vars 에서 치환. 정의되지 않은 키는 원형 유지.
 */
export function expandVariables(value: string, vars: Record<string, string>): string {
  return value.replace(VAR_PATTERN, (_, name: string) =>
    name in vars ? vars[name] : `\${${name}}`,
  );
}
