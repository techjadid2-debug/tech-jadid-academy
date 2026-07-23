import Image from "next/image";
import type { LessonContentBlock } from "@/lib/types";

export function LessonContent({ blocks }: { blocks: LessonContentBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <section className="lesson-content" aria-label="Dars materiallari">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return <h2 key={index}>{block.text}</h2>;
          case "paragraph":
            return <p key={index}>{block.text}</p>;
          case "image":
            return (
              <figure key={index} className="lesson-figure">
                <Image src={block.src} alt={block.alt} width={1600} height={900} sizes="(max-width: 900px) 100vw, 720px" />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          case "callout":
            return (
              <aside key={index} className="lesson-callout">
                <strong>{block.title}</strong>
                <p>{block.text}</p>
              </aside>
            );
          case "steps":
            return (
              <section key={index} className="lesson-steps">
                <h3>{block.title}</h3>
                <ol>{block.items.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>
            );
          case "prompt":
            return (
              <section key={index} className="lesson-prompt">
                <h3>{block.title}</h3>
                <pre><code>{block.text}</code></pre>
              </section>
            );
          case "task":
            return (
              <section key={index} className="lesson-task">
                <h3>{block.title}</h3>
                <p>{block.text}</p>
                <ul>{block.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            );
          case "tools":
            return (
              <section key={index} className="lesson-tools">
                <h3>{block.title}</h3>
                <p className="lesson-tools-hint">Avval bepul (yoki limitli) tarifda o&apos;rganing — doimiy ishlatish uchun Pro tarifga o&apos;ting.</p>
                <div className="lesson-tools-grid">
                  {block.items.map((tool) => (
                    <div className="tool-card" key={tool.name}>
                      <div className="tool-name">{tool.name}</div>
                      <div className="tool-tier">
                        <span className="tool-badge tool-free">Bepul</span>
                        <span className="tool-desc">{tool.free}</span>
                      </div>
                      <div className="tool-tier">
                        <span className="tool-badge tool-pro">Pro</span>
                        <span className="tool-desc">{tool.pro}</span>
                      </div>
                      {tool.note && <p className="tool-note">{tool.note}</p>}
                    </div>
                  ))}
                </div>
              </section>
            );
        }
      })}
    </section>
  );
}
