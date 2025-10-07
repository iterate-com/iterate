import { remark } from "remark";
import remarkHtml from "remark-html";
import { visit } from "unist-util-visit";
import type { Root, Image } from "mdast";

function remarkImagePaths(contentDir: string) {
  return function transformer(tree: Root) {
    visit(tree, "image", (node: Image) => {
      if (node.url && !node.url.startsWith("http") && !node.url.startsWith("/")) {
        node.url = `/content-images/${contentDir}/${node.url}`;
      }
    });
  };
}

export async function markdownToHtml(markdown: string, contentDir = "docs") {
  const result = await remark()
    .use(remarkImagePaths, contentDir)
    .use(remarkHtml as any)
    .process(markdown);
  return result.toString();
}
