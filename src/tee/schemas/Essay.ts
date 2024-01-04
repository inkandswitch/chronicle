import { SchemaToType } from "@/automerge-repo-schema-utils/utils";
import { splice } from "@automerge/automerge/next";
import { Schema as S } from "@effect/schema";

const CommentV1 = S.struct({
  id: S.string,
  content: S.string,
  contactUrl: S.optional(S.string),
  timestamp: S.number,
  userId: S.optional(S.string),
});

type CommentV1 = SchemaToType<typeof CommentV1>;

const CommentThreadV1 = S.struct({
  id: S.string,
  comments: S.array(CommentV1),
  resolved: S.boolean,
  fromCursor: S.string,
  toCursor: S.string,
});

type CommentThreadV1 = SchemaToType<typeof CommentThreadV1>;

const UserV1 = S.struct({
  id: S.string,
  name: S.string,
});

type UserV1 = SchemaToType<typeof UserV1>;

export const EssayV1 = S.struct({
  content: S.string,
  commentThreads: S.record(S.string, CommentThreadV1),
  users: S.array(UserV1),
});

export type EssayV1 = SchemaToType<typeof EssayV1>;

export type CommentThread = CommentThreadV1;
export type Comment = CommentV1;
export type User = UserV1;

export const Essay = EssayV1;
export type Essay = EssayV1;

// TODO: move these utility functions for essays into the schema itself

export const init = (doc: any) => {
  doc.content = "# Untitled\n\n";
  doc.commentThreads = {};
  doc.users = [];
};
// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)

export const markCopy = (doc: Essay) => {
  const firstHeadingIndex = doc.content.search(/^#\s.*$/m);
  if (firstHeadingIndex !== -1) {
    splice(doc, ["content"], firstHeadingIndex + 2, 0, "Copy of ");
  }
};

export const asMarkdownFile = (doc: Essay): Blob => {
  return new Blob([doc.content], { type: "text/markdown" });
}; // Helper to get the title of one of our markdown docs.