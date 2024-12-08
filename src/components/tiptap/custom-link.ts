import { InputRule, markInputRule, markPasteRule, PasteRule } from "@tiptap/core";
import { Link as TiptapLink } from "@tiptap/extension-link";
import type { LinkOptions } from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";

/**
 * The input regex for Markdown links with title support, and multiple quotation marks (required
 * in case the `Typography` extension is being included).
 *
 * @see https://stephenweiss.dev/regex-markdown-link
 */
const inputRegex =
  /(?:^|\s)((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*))$/;

/**
 * The paste regex for Markdown links with title support, and multiple quotation marks (required
 * in case the `Typography` extension is being included).
 *
 * @see https://stephenweiss.dev/regex-markdown-link
 */
const pasteRegex =
  /(?:^|\s)((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*))/g;

/**
 * Input rule built specifically for the `Link` extension, which ignores the auto-linked URL in
 * parentheses (e.g., `(https://doist.dev)`).
 *
 * @see https://github.com/ueberdosis/tiptap/discussions/1865
 */
function linkInputRule(config: Parameters<typeof markInputRule>[0]) {
  const defaultMarkInputRule = markInputRule(config);

  return new InputRule({
    find: config.find,
    handler: (props) => {
      const { tr } = props.state;

      defaultMarkInputRule.handler(props);
      tr.setMeta("preventAutolink", true);
    },
  });
}

/**
 * Paste rule built specifically for the `Link` extension, which ignores the auto-linked URL in
 * parentheses (e.g., `(https://doist.dev)`).
 *
 * @see https://github.com/ueberdosis/tiptap/discussions/1865
 */
function linkPasteRule(config: Parameters<typeof markPasteRule>[0]) {
  const defaultMarkInputRule = markPasteRule(config);

  return new PasteRule({
    find: config.find,
    handler: (props) => {
      const { tr } = props.state;

      defaultMarkInputRule.handler(props);
      tr.setMeta("preventAutolink", true);
    },
  });
}

const linkPluginKey = new PluginKey("link-plugin");

function createLinkPlugin(type: any) {
  return new Plugin({
    key: linkPluginKey,
    appendTransaction: (transactions, oldState, newState) => {
      if (!transactions.some((tr) => tr.docChanged)) return null;

      const tr = newState.tr;
      let modified = false;

      newState.doc.descendants((node, pos) => {
        if (node.isText) {
          const text = node.text || "";
          const parts = text.split(/(\s+)/);
          let currentPos = pos;

          parts.forEach((part) => {
            const match = part.match(inputRegex);
            const hasLink = node.marks.some((mark) => mark.type === type);

            if (match) {
              const url = match[1]?.trim();
              tr.removeMark(currentPos, currentPos + part.length, type);
              tr.addMark(
                currentPos,
                currentPos + part.length,
                type.create({
                  href: url.startsWith("http") ? url : `http://${url}`,
                }),
              );
              modified = true;
            } else if (hasLink) {
              tr.removeMark(currentPos, currentPos + part.length, type);
              modified = true;
            }

            currentPos += part.length;
          });
        }
      });

      return modified ? tr : null;
    },
  });
}

/**
 * Custom extension that extends the built-in `Link` extension to add additional input and paste
 * rules for converting the Markdown link syntax [Doist](https://doist.com) into links. This
 * extension also adds support for the `title` attribute.
 */
const Link = TiptapLink.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      title: {
        default: null,
      },
      target: {
        default: "_blank",
      },
    };
  },
  addInputRules() {
    return [
      linkInputRule({
        find: inputRegex,
        type: this.type,

        // We need to use `pop()` to remove the last capture groups from the match to
        // satisfy Tiptap's `markPasteRule` expectation of having the content as the last
        // capture group in the match (this makes the attribute order important)
        getAttributes(match) {
          return {
            title: match.pop()?.trim(),
            href: match.pop()?.trim(),
          };
        },
      }),
    ];
  },
  addPasteRules() {
    return [
      linkPasteRule({
        find: pasteRegex,
        type: this.type,

        // We need to use `pop()` to remove the last capture groups from the match to
        // satisfy Tiptap's `markInputRule` expectation of having the content as the last
        // capture group in the match (this makes the attribute order important)
        getAttributes(match) {
          return {
            title: match.pop()?.trim(),
            href: match.pop()?.trim(),
          };
        },
      }),
    ];
  },
  addProseMirrorPlugins() {
    return [createLinkPlugin(this.type), ...(this.parent?.() || [])];
  },
});

export default Link;

export type { LinkOptions };
