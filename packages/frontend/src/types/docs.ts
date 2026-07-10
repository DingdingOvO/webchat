export interface DocChild {
  id: string;
  title: string;
}

export interface Section {
  id: string;
  title: string;
  path: string;
  children: DocChild[];
}

export interface DocsConfig {
  sections: Section[];
}
