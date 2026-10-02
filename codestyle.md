# Frontend Code Style

## Standard Sources

This document follows the
[Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html),
the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), and
the [MDN Accessibility Guidelines](https://developer.mozilla.org/en-US/docs/Web/Accessibility).

## HTML

- Use the HTML5 document type.
- Keep the document language set to `zh-CN` while the user interface is Chinese.
- Use lowercase tag and attribute names.
- Use double quotes for attribute values.
- Use semantic elements and maintain a logical heading order.
- Give every form control a label or accessible name.
- Use `aria-live`, `aria-busy`, and `aria-selected` for interactive state.

## CSS

- Use lowercase, hyphenated class names.
- Define shared colors, spacing, and surfaces with custom properties.
- Prefer Grid and Flexbox over absolute positioning.
- Keep letter spacing at zero.
- Maintain focus-visible states.
- Support both desktop and mobile layouts.
- Do not rely on hover alone to communicate state.

## JavaScript

- Use `const` and `let`; do not use `var`.
- Keep DOM queries near the start of the module.
- Build DOM nodes with `createElement` and `textContent`.
- Do not use `innerHTML` for backend or user data.
- Send all network requests through the shared `apiRequest` function.
- Handle success, error, and empty responses explicitly.
- Do not evaluate expressions in the front end.
- Do not use `eval` or `Function` to execute user input.
