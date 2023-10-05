import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { MarkdownEditor, TextSelection } from "./MarkdownEditor";

import { LocalSession, MarkdownDoc } from "../schema";
import { Navbar } from "./Navbar";
import { LoadingScreen } from "./LoadingScreen";
import { useEffect, useState } from "react";

import { EditorView } from "codemirror";
import { CommentsSidebar } from "./CommentsSidebar";

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [doc, changeDoc] = useDocument<MarkdownDoc>(docUrl); // used to trigger re-rendering when the doc loads
  const handle = useHandle<MarkdownDoc>(docUrl);
  const [session, setSessionInMemory] = useState<LocalSession>();
  const [selection, setSelection] = useState<TextSelection>();
  const [view, setView] = useState<EditorView>();

  useEffect(() => {
    const session = localStorage.getItem("LocalSession");
    if (session) {
      setSessionInMemory(JSON.parse(session));
    } else {
      setSessionInMemory({ userId: null });
    }
  }, []);

  const setSession = (session: LocalSession) => {
    localStorage.setItem("LocalSession", JSON.stringify(session));
    setSessionInMemory(session);
  };

  if (!doc || !session) {
    return <LoadingScreen docUrl={docUrl} handle={handle} />;
  }

  return (
    <div>
      <Navbar
        doc={doc}
        changeDoc={changeDoc}
        session={session}
        setSession={setSession}
      />
      <div className="flex bg-gray-50">
        <div className="w-4/5 max-w-[776px] bg-white my-4 ml-8 mr-4 border border-gray-200 p-4 rounded-sm ">
          <MarkdownEditor
            handle={handle}
            path={["content"]}
            setSelection={setSelection}
            setView={(view) => setView(view as EditorView)}
          />
        </div>
        <div className="flex-grow bg-gray-50 p-4">
          <CommentsSidebar
            view={view}
            session={session}
            doc={doc}
            changeDoc={changeDoc}
            selection={selection}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
