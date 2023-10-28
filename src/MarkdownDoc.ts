import { uuid } from "@automerge/automerge";
import { ActionSpec } from "./types";
import { CommentThread, Comment } from "./schema";
import { next as A } from "@automerge/automerge";

export const MarkdownDocActions: ActionSpec = {
  "resolve all comments": {
    params: {},
    action: (doc) => {
      console.log("resolve");
      for (const threadId in doc.commentThreads) {
        const thread = doc.commentThreads[threadId];
        thread.resolved = true;
      }
    },
  },
  "start new thread": {
    params: {
      text: "string",
      comment: "string",
    },
    action: (doc, params) => {
      const textStartIndex = doc.content.indexOf(params.text);
      if (textStartIndex < 0) {
        throw new Error(`text not found: ${params.text}`);
      }
      const textEndIndex = textStartIndex + params.text.length;

      const fromCursor = A.getCursor(doc, ["content"], textStartIndex);
      const toCursor = A.getCursor(doc, ["content"], textEndIndex);

      const comment: Comment = {
        id: uuid(),
        content: params.comment,
        userId: null,
        timestamp: Date.now(),
      };

      const thread: CommentThread = {
        id: uuid(),
        comments: [comment],
        resolved: false,
        fromCursor,
        toCursor,
      };

      doc.commentThreads[thread.id] = thread;
    },
  },
};