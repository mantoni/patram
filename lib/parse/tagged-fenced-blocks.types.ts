export interface TaggedFencedBlocksInput {
  file_path: string;
  source_text: string;
}

export interface TaggedFencedBlockCriteria {
  [key: string]: string;
}

export interface TaggedFencedBlockOrigin {
  path: string;
  line_start: number;
  line_end: number;
  tag_lines: number[];
}

export interface TaggedFencedBlockContext {
  heading_path: string[];
}

export interface TaggedFencedBlock {
  id: string;
  lang: string;
  value: string;
  metadata: Record<string, string>;
  origin: TaggedFencedBlockOrigin;
  context: TaggedFencedBlockContext;
}

export interface TaggedFencedBlockFile {
  path: string;
  title: string;
  blocks: TaggedFencedBlock[];
}

export interface TaggedFencedBlockError extends Error {
  code: string;
}
