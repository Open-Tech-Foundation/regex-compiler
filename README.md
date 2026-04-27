<div align="center">
  <img src="https://open-tech-foundation.pages.dev/img/Logo.svg" width="100" height="100" alt="OTF Logo" />
  <h1>Regex Compiler</h1>
  <p>A powerful visual regex builder and compiler that transforms human-friendly DSL into optimized Regular Expressions.</p>
  <p>Part of the <a href="https://github.com/Open-Tech-Foundation">Open Tech Foundation</a> ecosystem.</p>
</div>

---

A human-readable DSL for building, debugging, and compiling complex Regular Expressions into standard JavaScript `RegExp` objects.

- 🎨 **Intuitive DSL**: Designed for clarity, simplicity, and ease of use.
- ⚡ **Optimized Output**: Generates clean, high-performance regular expressions.
- 🛡️ **Smart Wrapping**: Automatically handles non-capturing groups for safety.
- 📦 **Zero Dependencies**: Lightweight and focused on core functionality.

## 📦 Installation

Install the compiler using your preferred package manager:

```bash
# Bun
bun add @opentf/regex-compiler

# pnpm
pnpm add @opentf/regex-compiler

# npm
npm install @opentf/regex-compiler
```

## 🛠 Usage

Explore the library's capabilities with this example:

### Compiling a Named Capture Group

```javascript
import { compileToJS } from "@opentf/regex-compiler";

const dsl = {
  nodes: [
    {
      type: "group",
      name: "user",
      token: { 
        type: "charset", 
        value: "a-z", 
        quantifier: "+" 
      }
    }
  ]
};

const result = compileToJS(dsl); 
//=> { pattern: "(?<user>[a-z]+)", flags: "" }
```

## 📝 DSL Example

```json
{
  "nodes": [
    { "type": "anchor", "value": "start" },
    {
      "type": "group",
      "name": "user",
      "token": { "type": "charset", "value": "a-zA-Z0-9._%+-", "quantifier": "+" }
    },
    { "type": "literal", "value": "@" },
    { "type": "anchor", "value": "end" }
  ],
  "flags": { "caseInsensitive": true }
}
```


## 📄 License

This project is licensed under the [MIT License](LICENSE).
