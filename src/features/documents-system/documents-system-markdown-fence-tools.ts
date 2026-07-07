const MARKDOWN_FENCE_PATTERN = /^\s*(`{3,}|~{3,})/u;

export type DocumentsSystemMarkdownFence = {
  marker: "`" | "~";
  length: number;
};

export const getDocumentsSystemMarkdownFence = (
  line: string
): DocumentsSystemMarkdownFence | undefined => {
  const match = MARKDOWN_FENCE_PATTERN.exec(line);
  const fence = match?.[1];

  if (!fence) {
    return undefined;
  }

  return {
    marker: fence[0] as DocumentsSystemMarkdownFence["marker"],
    length: fence.length,
  };
};

const shouldToggleMarkdownFence = (
  fence: DocumentsSystemMarkdownFence | undefined,
  activeFence: DocumentsSystemMarkdownFence | undefined
) =>
  Boolean(
    fence &&
    (!activeFence || (fence.marker === activeFence.marker && fence.length >= activeFence.length))
  );

export const stripDocumentsSystemMarkdownFencedCodeBlocks = (content: string) => {
  const lines = content.split(/\r?\n/u);
  let activeFence: DocumentsSystemMarkdownFence | undefined;

  return lines
    .map((line) => {
      const fence = getDocumentsSystemMarkdownFence(line);

      if (shouldToggleMarkdownFence(fence, activeFence)) {
        activeFence = activeFence ? undefined : fence;
        return "";
      }

      return activeFence ? "" : line;
    })
    .join("\n");
};
