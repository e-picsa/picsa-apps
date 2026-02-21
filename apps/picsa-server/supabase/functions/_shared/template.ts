export async function renderTemplate(
  templatePath: string,
  metaUrl: string,
  variables: Record<string, string>,
): Promise<string> {
  const templateUrl = new URL(templatePath, metaUrl);
  let templateHtml = await Deno.readTextFile(templateUrl);

  for (const [key, value] of Object.entries(variables)) {
    // Replace all instances of {{key}} with the provided value
    templateHtml = templateHtml.replaceAll(`{{${key}}}`, value);
  }

  return templateHtml;
}
