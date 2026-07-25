import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5';
import { preprocess } from './preprocess.js';
import type {
  PrecompileOptions,
  PrecompiledTemplateModule,
  SerializableNode,
  SerializableTemplatePlan,
  SourceLocation,
} from '../types.js';

type Node = DefaultTreeAdapterTypes.ChildNode;

function serializeNode(node: Node, path: string, sourceMap: Record<string, SourceLocation>): SerializableNode {
  const location = (
    node as Node & { sourceCodeLocation?: { startLine: number; startCol: number; startOffset: number } }
  ).sourceCodeLocation;
  if (location) sourceMap[path] = { line: location.startLine, column: location.startCol, offset: location.startOffset };
  if (node.nodeName === '#text') return { kind: 'text', value: (node as DefaultTreeAdapterTypes.TextNode).value };
  if (node.nodeName === '#comment')
    return { kind: 'comment', value: (node as DefaultTreeAdapterTypes.CommentNode).data };
  if (node.nodeName === '#documentType') return { kind: 'doctype', value: 'html' };
  const element = node as DefaultTreeAdapterTypes.Element;
  return {
    kind: 'element',
    name: element.tagName,
    namespace: element.namespaceURI,
    attributes: element.attrs.map(({ name, value }) => ({ name, value })),
    children: element.childNodes.map((child, index) => serializeNode(child, `${path}.${index}`, sourceMap)),
  };
}

/** Node-only precompiler used by the CLI; it never requires browser globals. */
export function precompileNode(source: string, options: PrecompileOptions = {}): PrecompiledTemplateModule {
  const preprocessed = preprocess(source);
  const sourceMap: Record<string, SourceLocation> = {};
  const fragment = parseFragment(preprocessed, { sourceCodeLocationInfo: true });
  const plan: SerializableTemplatePlan = {
    version: 2,
    source,
    preprocessed,
    name: options.name,
    sourcePath: options.sourcePath,
    sourceMap,
    root: {
      nodes: fragment.childNodes.map((node, index) => serializeNode(node, String(index), sourceMap)),
      bindings: [],
      blocks: [],
      compiled: false,
    },
  };
  return { plan };
}
