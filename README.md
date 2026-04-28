<div align="center">
  <img src="https://open-tech-foundation.pages.dev/img/Logo.svg" width="100" height="100" alt="OTF Logo" />
  <h1>Regex Compiler</h1>
  <p>A powerful regex builder and compiler that transforms human-friendly DSL into optimized Regular Expressions.</p>
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

Explore the library's capabilities with full TypeScript support:

### Compiling a Named Capture Group

```typescript
import { compileToJS, type RegexDSL } from "@opentf/regex-compiler";

const dsl: RegexDSL = [
  { capture: { name: "user", pattern: [{ repeat: { type: "word" }, oneOrMore: true }] } }
];

const result = compileToJS(dsl); 

if ('error' in result) {
  console.error(result.error);
} else {
  console.log(result.pattern); //=> "(?<user>\\w+)"
}
```

## 🛡️ Validation & Error Handling

The compiler performs deep logical validation. If the DSL is invalid, it returns an object containing an `error` string and a detailed `issues` array.

### Handling Errors

```typescript
const invalidDSL = [
  { repeat: "a", oneOrMore: true, count: 5 } // ❌ Conflicting quantifiers
];

const result = compileToJS(invalidDSL);

if ('error' in result) {
  console.log(result.error); 
  //=> "root.0.repeat: Conflicting quantifiers. Use only one of: count, min/max..."
  
  console.log(result.issues);
  /*=> [
    { 
      path: "root.0.repeat", 
      message: "Conflicting quantifiers. Use only one of: count, min/max..." 
    }
  ] */
}
```

## 🚀 DSL Features

Our DSL is optimized for developer productivity with a "one-form, no-confusion" standard:

### 1. Implicit String Literals
Any plain string is automatically treated as an escaped literal.
- `["api.v1"]` ⮕ `api\.v1`

### 2. The Dual-System
- **Strings** = Literals (e.g., `"digit"` matches the word "digit").
- **`{ type: "..." }`** = Keywords (e.g., `{ type: "digit" }` matches `\d`).

### 3. Inline Flags
Declare your flags anywhere in the array.
```json
["hello", { "flags": { "ignoreCase": true } }]
```
> [!NOTE]
> The `unicodeSets` (v) and `unicode` (u) flags are mutually exclusive — using both will produce a validation error.

## 📝 Email Validator Example

The ultimate "Zero-Wrapper" experience:

```json
[
  { "$": "start" },
  {
    "capture": {
      "name": "user",
      "pattern": [
        {
          "repeat": { "charSet": { "chars": "a-z0-9._%+-", "exclude": false } },
          "oneOrMore": true
        }
      ]
    }
  },
  "@",
  {
    "capture": {
      "name": "domain",
      "pattern": [
        {
          "repeat": { "charSet": { "chars": "a-z0-9-", "exclude": false } },
          "oneOrMore": true
        }
      ]
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
