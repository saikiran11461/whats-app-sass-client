/**
 * Shared template utility functions used across SendMessage, ChatInbox, etc.
 * Mirrors how WATI/Interakt/Respond.io handle template variables.
 */

/**
 * Extract {{N}} variable names from a body string, deduped and sorted.
 * Returns an array of numbers, e.g. [1, 2, 3] for "Hello {{1}}, your {{2}} is {{3}}"
 */
export function extractTemplateVariables(body: string): number[] {
  if (!body) return [];
  const matches = body.match(/\{\{(\d+)\}\}/g);
  if (!matches) return [];
  const nums = [...new Set(matches.map((m) => parseInt(m.replace(/[{}]/g, ""))))];
  return nums.sort((a, b) => a - b);
}

/**
 * Preview the template body with variables filled in with provided values.
 * Unfilled variables remain as {{N}} placeholders.
 *
 * @example previewBodyWithValues("Hello {{1}}!", { "1": "John" }) → "Hello John!"
 */
export function previewBodyWithValues(body: string, values: Record<string, string>): string {
  if (!body) return "";
  return body.replace(/\{\{(\d+)\}\}/g, (_, num) => {
    return values[num] ? values[num] : `{{${num}}}`;
  });
}

/**
 * Build Meta API template components array from variable values.
 * Like WATI/Respond.io, each {{N}} becomes a parameter in the body component.
 *
 * @example
 * buildTemplateComponents({ "1": "John", "2": "Welcome!" })
 * → [{ type: 'body', parameters: [{ type: 'text', text: 'John' }, { type: 'text', text: 'Welcome!' }] }]
 */
export function buildTemplateComponents(variableValues: Record<string, string>): Array<{
  type: string;
  parameters: Array<{ type: string; text: string }>;
}> {
  const keys = Object.keys(variableValues).sort((a, b) => parseInt(a) - parseInt(b));
  if (keys.length === 0) return [];

  return [
    {
      type: 'body',
      parameters: keys.map((key) => ({
        type: 'text',
        text: variableValues[key] || '',
      })),
    },
  ];
}
