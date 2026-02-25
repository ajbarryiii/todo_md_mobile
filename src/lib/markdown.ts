import { toString } from 'mdast-util-to-string';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';

export type TodoItem = {
  text: string;
  done: boolean;
  depth: number;
};

export function parseTodoMarkdown(markdown: string): TodoItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as {
    children?: Array<{
      type: string;
      checked?: boolean;
      spread?: boolean;
      children?: unknown[];
    }>;
  };

  const out: TodoItem[] = [];

  for (const node of tree.children ?? []) {
    if (node.type !== 'list') {
      continue;
    }

    for (const child of node.children ?? []) {
      if ((child as { type?: string }).type !== 'listItem') {
        continue;
      }

      const listItem = child as {
        checked?: boolean;
        children?: unknown[];
      };

      const text = toString(listItem as never).trim();
      if (!text) {
        continue;
      }

      out.push({
        text,
        done: Boolean(listItem.checked),
        depth: 0
      });
    }
  }

  return out;
}
