
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

The `promiseFor` wrapper can handle a wide variety of asynchronous operations, making it useful across many real-world scenarios. Below are some examples demonstrating its versatility.

#### 3.1 File System Operations

You can use `promiseFor` to work with Node.js's file system (fs) asynchronously. This makes it easy to read, write, or modify files while handling potential errors uniformly.

```javascript
const fs = require('fs').promises;

async function readFileContent() {
  const [data, error] = await promiseFor(() => fs.readFile('path/to/file.txt', 'utf8'));
  
  if (error) {
    console.error('Error reading file:', error.message);
    return;
  }
  
  console.log('File content:', data);
}
```
Here, fs.readFile is wrapped as a function returning a promise, and promiseFor handles both the result and any error that may occur during the file reading process.

### 3.2 Network Requests
promiseFor works seamlessly with network requests like fetch to make API calls, providing error handling for unsuccessful requests.

```javascript
async function fetchUserData() {
  const [response, error] = await promiseFor(fetch('https://api.example.com/user'));
  
  if (error) {
    console.error('Error fetching user data:', error.message);
    return;
  }
  
  const userData = await response.json();
  console.log('User data:', userData);
}
```
The example uses the fetch API to make an HTTP request. promiseFor ensures that the error (if any) is caught and returned in a consistent structure.

### 3.3 API Calls
You can also use promiseFor with more complex API calls, such as those using libraries like axios. It handles both successful responses and errors from HTTP requests.
```javascript
const axios = require('axios');

async function fetchPosts() {
  const [response, error] = await promiseFor(() => axios.get('https://api.example.com/posts'));
  
  if (error) {
    console.error('Error fetching posts:', error.message);
    return;
  }
  
  console.log('Posts:', response.data);
}
```
axios.get returns a promise, and promiseFor handles the success and error conditions uniformly.

### 3.4 Legacy Code Integration
Many legacy systems still rely on callback-based asynchronous operations. promiseFor can be used to modernize and integrate these legacy systems with promise-based code, making it easier to handle errors.
```javascript
function legacyCallbackFunction(callback) {
  setTimeout(() => {
    callback(null, 'Success');
  }, 1000);
}

async function handleLegacyCode() {
  const [result, error] = await promiseFor((cb) => legacyCallbackFunction(cb));
  
  if (error) {
    console.error('Legacy code error:', error.message);
    return;
  }
  
  console.log('Legacy code result:', result);
}
```
The legacyCallbackFunction uses a traditional callback to signal completion, and promiseFor wraps it in a promise-based API, making it easier to integrate with newer async code.

### 3.5 Mixed Async Environments
In real-world applications, you may encounter mixed environments where some code is promise-based, while other parts still use callbacks or events. promiseFor unifies these approaches, allowing for consistent error handling across both types.

```javascript
const { promisify } = require('util');
const fs = require('fs');

// Convert a callback-based function (fs.readFile) to a promise-based function using promisify
const readFileAsync = promisify(fs.readFile);

async function fetchData() {
  // Example where we mix promise-based and callback-based code
  const [fileData, fileError] = await promiseFor(() => readFileAsync('path/to/file.txt', 'utf8'));

  if (fileError) {
    console.error('Error reading file:', fileError.message);
    return;
  }
  
  const [response, apiError] = await promiseFor(fetch('https://api.example.com/data'));
  
  if (apiError) {
    console.error('Error fetching API data:', apiError.message);
    return;
  }

  const data = await response.json();
  console.log('Fetched data and file content:', data, fileData);
}
```

In this example, we’re using promisify to convert the callback-based fs.readFile into a promise. We then mix it with the fetch API call, showcasing how promiseFor can handle multiple types of async operations and errors in a uniform way.

### 4. Flexible Promise Handling with Post-Processing

## Why Post-Processing?

Post-processing is a powerful technique that provides developers with several key advantages:

1. **Data Transformation**: Easily modify raw data into a more usable format
2. **Separation of Concerns**: Decouple data fetching from data processing
3. **Error Handling**: Add custom error checking and data validation
4. **Flexibility**: Transform data without modifying the original fetch logic

## Basic Usage Examples

### 4.1 Simple JSON Parsing

```javascript
// Basic JSON parsing
const [userData, error] = await promiseFor(fetch('/api/user'),(response) => response.json());

if (error) {
    console.error('Failed to fetch user:', error);
    return;
}

console.log(userData); // Parsed JSON data
```

### 4.2 Extracting Specific Fields

```javascript
// Post-processor to extract only needed fields
const [userProfile, error] = await promiseFor(
    () => fetch('/api/user'),
    async (response) => {
        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            email: data.email
        };
    }
);
// The result of userProfile will be an object containing id,name and email
```

## Advanced Post-Processing Techniques

### 4.3 Data Transformation

```javascript
// Transform data structure
const [processedUsers, error] = await promiseFor(
    () => fetch('/api/users'),
    async (response) => {
        const users = await response.json();
        return users.map(user => ({
            fullName: `${user.firstName} ${user.lastName}`,
            contactInfo: {
                email: user.email,
                phone: user.phone
            }
        }));
    }
);
```

### 4. Validation and Error Handling

```javascript
// Add custom validation during post-processing
const [validatedData, error] = await promiseFor(
    () => fetch('/api/sensitive-data'),
    async (response) => {
        const data = await response.json();
        
        // Custom validation
        if (!data.id || !data.name) {
            throw new Error('Invalid data structure');
        }
        
        return data;
    }
);
```

### 5. Complex Transformation with Multiple Steps

```javascript
// Multi-step transformation
const [enrichedData, error] = await promiseFor(
    () => fetch('/api/products'),
    async (response) => {
        const products = await response.json();
        
        // Complex transformation with multiple operations
        return products.map(product => ({
            ...product,
            // Add computed properties
            discountedPrice: product.price * 0.9,
            isOnSale: product.price > 100,
            // Format specific fields
            formattedPrice: `$${product.price.toFixed(2)}`
        }));
    }
);
```

## Use Cases

### Real-world Scenarios

1. **API Response Normalization**
  - Standardize responses from different endpoints
  - Remove unnecessary fields
  - Add computed properties

2. **Data Cleaning**
  - Remove null or undefined values
  - Normalize date formats
  - Convert data types

3. **Performance Optimization**
  - Reduce payload size by selecting only necessary fields
  - Perform initial data filtering during post-processing



- Keep post-processors focused and single-purpose
- Handle potential errors within the post-processor
- Use async post-processors for complex transformations
- Avoid heavy computations in post-processors

## Error Handling

The wrapper automatically normalizes errors, providing a consistent error object with:
- Error message
- Error name
- Stack trace
- HTTP status (if applicable)
- Request URL and method

```javascript
const [data, error] = await promiseFor(fetchOperation);

if (error) {
    // Normalized error object
    console.log(error.message);
    console.log(error.status);
    console.log(error.url);
    console.error(`Error in post-processing: ${error.context}`);
}
```
### NOTE:
If an error occurs in postProcessing upon it is noted in the error object as "Error occurred during post-processing"

how the error is structured
```javascript
    {
    message: string,
    name: string,
    stack?: string,
    status?: number,
    url?: string,
    method?: string,
    code?: string,
    context?: string
  }
```

The optional post-processing argument in `promiseFor` provides an elegant solution for transforming and validating data directly after fetching, improving code readability and maintainability.

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

