
# Promise-for-Wrapper

A versatile promise error handling utility that simplifies asynchronous error management in JavaScript.

## 🚀 Overview

`promise-for-wrapper` provides a clean, intuitive way to handle promises and callbacks, returning a tuple of `[result, error]` that makes error checking straightforward and reduces complex error handling patterns.

## 📦 Installation

```bash
npm install promise-for-wrapper
```

## 🔍 Problem: Async Error Handling Complexity

### Traditional Approach

In JavaScript, handling multiple sequential asynchronous operations can be cumbersome due to nested `try-catch` blocks, as shown here:

```javascript
async function fetchUserDataTraditional() {
  try {
    const userResponse = await fetch('https://api.example.com/user');
    const user = await userResponse.json();

    try {
      const postsResponse = await fetch(`https://api.example.com/posts?userId=${user.id}`);
      const posts = await postsResponse.json();
      return { user, posts };
    } catch (postsError) {
      console.error('Posts fetch error:', postsError);
      return null;
    }
  } catch (userError) {
    console.error('User fetch error:', userError);
    return null;
  }
}
```

### Drawbacks of Traditional Approach
- Nested `try-catch` blocks
- Complex error handling
- Reduced readability and maintainability
- Verbose error management

## ✨ Solution: Promise-for-Wrapper

Using `promiseFor` makes error handling more efficient and readable:

```javascript
import promiseFor from 'promise-for-wrapper';

async function fetchUserDataModern() {
  const [userResponse, userError] = await promiseFor(fetch('https://api.example.com/user'));
  if (userError) {
    console.error('User fetch error:', userError);
    return null;
  }

  const user = await userResponse.json();
  const [postsResponse, postsError] = await promiseFor(fetch(`https://api.example.com/posts?userId=${user.id}`));

  if (postsError) {
    console.error('Posts fetch error:', postsError);
    return null;
  }

  const posts = await postsResponse.json();
  return { user, posts };
}
```

## 🌟 Key Features

### 1. Dual Function Support
Supports multiple async function types:
- **Promise-based** functions
- **Callback-based** functions
- **Functions returning promises**

```javascript
// Promise-based
const [promiseResult, promiseError] = await promiseFor(fetch('https://api.example.com/data'));

// Callback-based
const [callbackResult, callbackError] = await promiseFor((cb) => {
  legacyAsyncFunction((error, data) => cb(error, data));
});

// Function returning a promise
const [functionResult, functionError] = await promiseFor(() => axios.get('https://api.example.com/users'));
```

### 2. Simplified Error Handling
- Flat error checking
- Consistent `[result, error]` return pattern
- Eliminates nested `try-catch` blocks

### 3. Versatile Use Cases
- File system operations
- Network requests
- API calls
- Legacy code integration
- Mixed async environments

## 📋 Best Practices

- Use destructuring for clean error checking.
- **Type Safety**: If automatic type inference doesn’t work in complex expressions, use callback style for improved clarity.
- Wrap potentially failing async operations to ensure consistent error handling.
- Leverage `promiseFor` for both legacy and modern code to maintain a consistent error-handling pattern.

### Example for Type Safety with Complex Expressions

When using `promiseFor` with complex expressions that might not infer types correctly, you can use callback syntax:

```javascript
const [data, error] = await promiseFor(() => someAsyncFunctionWithComplexTypes());
```

This allows for better type control in TypeScript or with complex return values.

## 📝 Real-World Example

```javascript
const fs = require('fs').promises;
const superagent = require('superagent');
const { promiseFor } = require('promise-for-wrapper');

async function fetchDogImage() {
  // Read dog breed from file
  const [dogName, fileError] = await promiseFor(() => fs.readFile('dog.txt', 'utf-8'));

  if (fileError) {
    console.log("File read error:", fileError);
    return;
  }

  // Fetch dog image
  const [dogImage, imageError] = await promiseFor(() => superagent.get(`https://dog.ceo/api/breed/${dogName}/images/random`));

  if (imageError) {
    console.log("Image fetch error:", imageError);
    return;
  }

  console.log(dogImage.body.message);
}
```

## 💡 Comparative Analysis

| Aspect               | Traditional Approach | Promise-for-Wrapper |
|----------------------|----------------------|----------------------|
| **Error Handling**   | Nested `try-catch`  | Flat, simple tuples |
| **Code Readability** | Complex             | Clean               |
| **Error Propagation**| Manual              | Automatic           |
| **Async Function Support** | Limited       | Comprehensive       |
| **Boilerplate Code** | High                | Minimal             |

## 🛠 API Reference

### `promiseFor(promiseOrFunction)`

- **Parameters**:
    - `promiseOrFunction`: A function returning a promise, a promise, or a callback-based function.
- **Returns**: `Promise<[result | null, error | null]>` - A tuple with the result and any error.

## 🔒 License

MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! To contribute, please fork the repository, create a branch, make your changes, and submit a pull request.

