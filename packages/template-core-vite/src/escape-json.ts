/** U+2028/U+2029 aren't escaped by JSON.stringify; some bundlers still choke on them raw. */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

export function escapeJsonForEmbedding(json: string): string {
  return json.split(LINE_SEPARATOR).join('\\u2028').split(PARAGRAPH_SEPARATOR).join('\\u2029');
}
