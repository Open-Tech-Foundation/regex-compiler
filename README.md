<div align="center">
  <img src="https://open-tech-foundation.pages.dev/img/Logo.svg" width="100" height="100" alt="OTF Logo" />
  <h1>Regex Compiler</h1>
  <p>A powerful visual regex builder and compiler that transforms human-friendly DSL into optimized Regular Expressions.</p>
  <p>Part of the <a href="https://github.com/Open-Tech-Foundation">Open Tech Foundation</a> ecosystem.</p>
  <p>
    <a href="https://regex-compiler.opentf.workers.dev/"><strong>Regex Workbench →</strong></a>
  </p>
</div>

---

A human-readable DSL for building, debugging, and compiling complex Regular Expressions into standard `RegExp` objects.

- 🎨 **Intuitive DSL**: Designed for clarity, simplicity, and ease of use.
- ⚡ **Optimized Output**: Generates clean, high-performance regular expressions.
- 🛡️ **Smart Wrapping**: Automatically handles non-capturing groups for safety.
- 🌐 **Cross-Language Support**: Designed as a target-agnostic DSL for generating regex across multiple languages.
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

Explore the library's capabilities with the new **Fluent DSL**:

### Compiling a Named Capture Group

```javascript
import { compileToJS } from "@opentf/regex-compiler";

const dsl = {
  nodes: [
    { 
      capture: { 
        name: "user", 
        pattern: [
          { repeat: { type: "word" }, oneOrMore: true }
        ] 
      } 
    }
  ]
};

const result = compileToJS(dsl); 
//=> { pattern: "(?<user>\\w+)", flags: "" }
```

## 🚀 Fluent DSL Features

Our DSL is optimized for developer productivity with a "one-form, no-confusion" standard:

### 1. Implicit String Literals
Any plain string is automatically treated as an escaped literal.
- `nodes: ["api.v1"]` ⮕ `api\.v1`

### 2. The Dual-System
- **Strings** = Literals (e.g., `"digit"` matches the word "digit").
- **`{ type: "..." }`** = Keywords (e.g., `{ type: "digit" }` matches `\d`).

### 3. Inline Flags
Declare your flags anywhere in the array.
```json
[
  "hello",
  { "flags": { "ignoreCase": true } }
]
```

## 📝 Email Validator Example

The ultimate "Zero-Wrapper" experience:

```json
[
  { "$": "start" },
  { 
    "capture": { 
      "name": "user", 
      "pattern": [{ "repeat": { "charSet": { "chars": "a-z0-9._%+-", "exclude": false } }, "oneOrMore": true }] 
    } 
  },
  "@",
  { 
    "capture": { 
      "name": "domain", 
      "pattern": [{ "repeat": { "charSet": { "chars": "a-z0-9-", "exclude": false } }, "oneOrMore": true }] 
    } 
  },
  ".",
  { 
    "capture": { 
      "name": "tld", 
      "pattern": [{ "repeat": { "charSet": { "chars": "a-z", "exclude": false } }, "min": 2 }] 
    } 
  },
  { "$": "end" },
  { "flags": { "ignoreCase": true } }
]
```


## 📄 License

This project is licensed under the [MIT License](LICENSE).
