# Using Images in Markdown Content

You can now reference images in your markdown files using relative paths!

## How to Use

1. **Create an images directory** alongside your markdown files:
   - For docs: `content/docs/images/`
   - For roadmap: `content/roadmap/images/`
   - For changelog: `content/changelog/images/`
   - For blog: `content/blog/images/`

2. **Add your image files** to the appropriate images directory

3. **Reference images in markdown** using relative paths:
   ```markdown
   ![Alt text](images/my-image.png)
   ```

## Example

For a docs page at `content/docs/getting-started.md`:

```markdown
---
title: Getting Started
---

# Getting Started

Here's a screenshot of the dashboard:

![Dashboard Screenshot](images/dashboard-screenshot.png)

The image will be automatically served when the page is rendered.
```

## Supported Image Formats

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- GIF (`.gif`)
- SVG (`.svg`)
- WebP (`.webp`)

## Notes

- Absolute URLs (starting with `http://` or `https://`) work as-is
- Paths starting with `/` are treated as absolute paths
- All other paths are treated as relative to the markdown file's directory
