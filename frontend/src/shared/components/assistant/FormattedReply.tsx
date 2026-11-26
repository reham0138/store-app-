/** Renders the assistant's plain-text replies as headings, lists and labelled rows. */
export default function FormattedReply({ text }: { text: string }) {
  const blocks: Array<{ list: boolean; lines: string[] }> = [];
  for (const line of text.split("\n")) {
    const list = line.startsWith("- ");
    const last = blocks[blocks.length - 1];
    if (list && last?.list) last.lines.push(line.slice(2));
    else blocks.push({ list, lines: [list ? line.slice(2) : line] });
  }

  return (
    <div className="space-y-1.5">
      {blocks.map((block, index) => {
        if (block.list) {
          return (
            <ul key={index} className="space-y-1">
              {block.lines.map((line, itemIndex) => (
                <li key={itemIndex} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  <span className="min-w-0"><LabelledLine text={line} /></span>
                </li>
              ))}
            </ul>
          );
        }
        const line = block.lines[0];
        if (!line) return <div key={index} className="h-1" />;
        // Titles: "…:" lines, an opening product name, or a name that introduces a list.
        const heading = line.endsWith(":") || (!line.includes(": ")
          && ((index === 0 && blocks.length > 1) || !!blocks[index + 1]?.list));
        return (
          <p key={index} className={heading ? "font-semibold text-brand-navy" : undefined}>
            <LabelledLine text={line} />
          </p>
        );
      })}
    </div>
  );
}

function LabelledLine({ text }: { text: string }) {
  const match = /^([^:]{1,24}): (.+)$/.exec(text);
  // <bdi> keeps English names and descriptions readable inside Arabic sentences.
  if (!match) return <bdi>{text}</bdi>;
  return (
    <>
      <span className="font-semibold text-brand-navy"><bdi>{match[1]}</bdi>: </span>
      <bdi>{match[2]}</bdi>
    </>
  );
}
