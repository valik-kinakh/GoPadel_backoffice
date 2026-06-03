// svg.d.ts
declare module "*.svg" {
  import * as React from "react";
  const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  // SVGs are loaded through @svgr/webpack, whose default export (the default
  // `exportType: 'default'`) is the React component — so the module's DEFAULT
  // export is the component, not a file-URL string. Next.js's generated
  // next-env.d.ts otherwise re-declares the default as `any`, which masks this
  // locally but does not exist on a clean CI checkout before `next build`.
  export { ReactComponent };
  export default ReactComponent;
}
