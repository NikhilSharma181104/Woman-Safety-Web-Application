# Static Asset Guidelines

## WebP Image Requirement (Requirement 10.4)

All static images added to this directory **must** be provided in WebP format.
Use a `<picture>` element with a WebP source and a JPEG/PNG fallback:

```html
<picture>
  <source srcset="/assets/image.webp" type="image/webp" />
  <img src="/assets/image.jpg" alt="Descriptive alt text" />
</picture>
```

### Conversion tools

- **CLI**: `cwebp -q 80 input.png -o output.webp`
- **Online**: [Squoosh](https://squoosh.app/) for one-off conversions.

> SVG files are already vector and do not require WebP conversion.
