"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Typography from "@tiptap/extension-typography";
import Link from "./custom-link";
import { Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { Plugin } from "prosemirror-state";
import { forwardRef, useImperativeHandle } from "react";
import { MAX_CHARS } from "@/lib/types";
import "./styles.css";

interface TiptapProps {
  content: string;
  editable: boolean;
  placeholder?: string;
  maxLength?: number;
  onUpdate?: (content: string) => void;
  className?: string;
}

export interface TiptapContentRef {
  getEditor: () => ReturnType<typeof useEditor> | null;
  getLinkNodes: () => { href: string; text: string }[];
}

const MaxLength = Extension.create({
  name: "maxLength",
  addOptions() {
    return {
      maxLength: MAX_CHARS,
      mode: "text",
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (tr, state) => {
          if (!tr.docChanged) return true;

          const length = tr.doc.nodeSize - 4;
          return length <= this.options.maxLength;
        },
      }),
    ];
  },
});

const TiptapContent = forwardRef<TiptapContentRef, TiptapProps>(
  ({ content, editable, placeholder = "Start typing...", maxLength, onUpdate, className }, ref) => {
    // console.log(content.split('\n'))
    const editor = useEditor({
      extensions: [
        // Image,
        // Typography,
        Link.configure({
          autolink: true,
          HTMLAttributes: {
            class: "text-blue-500 underline hover:text-blue-600 cursor-pointer",
          },
        }),
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          listItem: false,
          hardBreak: false,
          horizontalRule: false,
          bold: false,
          italic: false,
          code: false,
          strike: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
        MaxLength.configure({
          maxLength: maxLength,
        }),
      ],
      content: content
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join(""),
      editable,
      editorProps: {
        attributes: {
          class:
            "w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0 whitespace-pre-wrap min-h-12",
        },
      },
      onUpdate: ({ editor }) => {
        onUpdate?.(editor.getText());
      },
    });

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
      getLinkNodes: () => {
        if (!editor) return [];

        const links: { href: string; text: string }[] = [];
        editor.state.doc.descendants((node, pos) => {
          const marks = node.marks;
          console.log(marks);
          const linkMark = marks.find((mark) => mark.type.name === "link");
          if (linkMark) {
            links.push({
              href: linkMark.attrs.href,
              text: node.text || "",
            });
          }
        });
        return links;
      },
    }));

    return <EditorContent editor={editor} className={className} />;
  },
);

TiptapContent.displayName = "TiptapContent";

export default TiptapContent;
