declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}
