/**
 * Tidies CSS the way Prettier does (indentation, spacing, one declaration per line). The formatter is big, so it
 * is only loaded when someone asks for it.
 */
export async function formatCss(source: string): Promise<string> {
  const [prettier, postcss] = await Promise.all([import("prettier/standalone"), import("prettier/plugins/postcss")]);

  return (await prettier.format(source, { parser: "css", plugins: [postcss], tabWidth: 2, printWidth: 100 })).trimEnd();
}
