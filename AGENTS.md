# Project Guidelines & Rules

## DOM Manipulation Rules
- **DO NOT USE `innerHTML`**: Under any circumstances, do not use `innerHTML` (or `outerHTML` / `insertAdjacentHTML`) when creating or modifying DOM elements in this project.
- **Use Standard DOM Methods**:
  - Use `document.createElement(...)` to create elements.
  - Use `element.textContent` or `document.createTextNode(...)` for text.
  - Use `element.appendChild(...)`, `element.append(...)`, or `element.replaceChildren(...)` for adding and clearing child nodes.
  - Set attributes, properties, and event listeners directly (e.g. `element.className`, `element.onclick`, `element.disabled`).
