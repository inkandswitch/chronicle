import { MarkdownDoc } from "../schema";
import { DocHandle } from "@automerge/automerge-repo";
import {
  Heads,
  Patch,
  decodeChange,
  diff,
  getAllChanges,
  getHeads,
  view,
} from "@automerge/automerge/next";
import { Viewport } from "./App";
import { useEffect } from "react";

type DocLine = {
  text: string;
  start: number;
  type: "inserted" | "deleted" | "unchanged";
  visible: boolean;
};

type Snapshot = {
  heads: Heads;
  text: string;
  previous: Snapshot | null;
  diffFromPrevious: Patch[];
};

const snapshotsFromDoc = (doc: MarkdownDoc): Snapshot[] => {
  const changes = getAllChanges(doc);
  const snapshots: Snapshot[] = [
    {
      heads: [],
      text: "",
      previous: null,
      diffFromPrevious: [],
    },
  ];

  for (let i = 1; i < changes.length; i += 500) {
    const change = decodeChange(changes[i]);
    const heads = [change.hash];
    const docAtHeads = view(doc, heads);
    const text = docAtHeads.content;
    const previous = snapshots[snapshots.length - 1];
    const diffFromPrevious = diff(doc, previous.heads, heads);
    snapshots.push({
      heads,
      text,
      previous,
      diffFromPrevious,
    });
  }

  return snapshots;
};

function patchOverlapsLine(start: number, end: number, patch: Patch): boolean {
  if (
    !(patch.action === "splice" || patch.action === "del") &&
    patch.path[0] !== "content"
  ) {
    return false;
  }
  return patch.path[1] < end && patch.path[1] + (patch.length || 0) > start;
}

export const History: React.FC<{
  handle: DocHandle<MarkdownDoc>;
  diffHeads: Heads;
  setDiffHeads: (heads: Heads) => void;
  viewport: Viewport;
}> = ({ handle, diffHeads, setDiffHeads, viewport }) => {
  const doc = handle.docSync();
  const changes = getAllChanges(doc);

  useEffect(() => {
    const snapshots = snapshotsFromDoc(doc);
    console.log(snapshots);
  }, []);

  // TODO: pass in patches from above, don't duplicate diff work
  const patches = diff(doc, diffHeads, getHeads(doc));

  return (
    <div>
      <div className="p-4 text-gray-500 uppercase font-medium text-sm">
        Version Control
      </div>
      <div className="p-2 border-t border-b border-gray-300">
        <div className="text-xs">Diff against older draft</div>
        <input
          type="range"
          min="0"
          max={changes.length - 1}
          step="500"
          onChange={(e) => {
            const change = changes[e.target.value];
            setDiffHeads([decodeChange(change).hash]);
          }}
          value={changes.findIndex(
            (change) => decodeChange(change).hash === diffHeads[0]
          )}
        />
      </div>
      <MinimapWithDiff doc={doc} patches={patches} viewport={viewport} />
    </div>
  );
};

const MinimapWithDiff: React.FC<{
  doc: MarkdownDoc;
  patches: Patch[];
  viewport: Viewport;
}> = ({ doc, patches, viewport }) => {
  // Roughly split up the doc into 80-char lines to approximate the way it's displayed
  let currentIndex = 0;
  const linesNested = doc.content.split("\n").map((line) => {
    const lineObjects = (line.match(/.{1,80}/g) || [""]).map((text) => {
      const lineObject: DocLine = {
        text,
        start: currentIndex,
        type: "unchanged",
        visible: false,
      };

      for (const patch of patches) {
        if (
          !(
            (patch.action === "splice" || patch.action === "del") &&
            patch.path[0] === "content"
          )
        ) {
          continue;
        }
        if (
          patchOverlapsLine(currentIndex, currentIndex + text.length, patch)
        ) {
          if (patch.action === "splice") {
            lineObject.type = "inserted";
          } else if (patch.action === "del" && lineObject.type !== "inserted") {
            lineObject.type = "deleted";
          }
        }
      }

      if (
        currentIndex >= viewport.visibleStartPos &&
        currentIndex <= viewport.visibleEndPos
      ) {
        lineObject.visible = true;
      }

      currentIndex += text.length;
      return lineObject;
    });
    return lineObjects;
  });
  const lines = [].concat(...linesNested);

  return (
    <div className="p-2 bg-white w-48">
      {lines.map((line, i) => (
        <div
          className={` select-none cursor-default text-[4px] h-[6px] w-full ${
            line.type === "inserted"
              ? "bg-green-200"
              : line.type === "deleted"
              ? "bg-red-200"
              : ""
          } ${line.visible ? "opacity-100" : "opacity-50"}`}
          key={i}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
};
