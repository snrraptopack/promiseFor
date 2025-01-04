# Promise Wrapper

A TypeScript utility library providing robust error handling and data transformation pipelines for asynchronous operations.

## Core Utilities

The library provides two main utilities:
- `promiseFor`: Single-step transformation with built-in error handling
- `pipeFor`: Multi-step transformation pipeline with automatic error propagation

## Installation

```bash
npm install promise-wrapper
```

## Error Handling Structure

All operations use a standardized error context:

```typescript
interface ErrorContext {
    message: string;
    name: string;
    stack?: string | null;
    status?: number | null;
    url?: string | null;
    method?: string | null;
    code?: string | null;
    context: string;
}
```

## promiseFor: Single-Step Operations

### Basic Structure
```typescript
const [result, error] = await promiseFor(
    promise,
    postProcessor // optional
);
```

### Simple Example
```javascript
// Helper function for JSON parsing
const parseJson = async (response) => await response.json();

// Using promiseFor with post-processing
const [data, error] = await promiseFor(
    fetch('/api/users'),
    parseJson
);

or

const [data, error] = await promiseFor(
        fetch('/api/users'),
        async (res)=>res.json()
);


if (error) {
    console.error('Operation failed:', error.message);
    return;
}
```

## pipeFor: Multi-Step Operations

### Basic Structure
```javascript
const [result, error] = await pipeFor(promise)
    .transform(transformFn)
    .pipe(pipelineFn)
    .transform(anotherTransform)
    .execute();
```

### Key Concepts

1. **transform()**:
  - Takes exactly one argument
  - Transforms data synchronously or asynchronously
  - Automatically handles null/undefined checks
  - Returns transformed data to next step

2. **pipe()**:
  - Introduces new promise-based operations
  - Used when you need to make new async calls
  - Takes previous result as input

3. **execute()**:
  - Mandatory final step
  - Runs the pipeline
  - Returns [result, error] tuple

### Practical Example: Chained API Calls

```javascript
// Helper functions
const parseJson = response => response.json();
const extractUserId = todo => todo.userId;
const extractUserProfile = user => user.profile;
const formatUserData = profile => ({
    name: profile.name,
    email: profile.email
});

// Using pipeFor with clean transformations
const [userData, error] = await pipeFor(fetch('/api/todos/1'))
    .transform(parseJson)                                    // Parse todo response
    .transform(extractUserId)                               // Get user ID
    .pipe(userId => fetch(`/api/users/${userId}`))          // New request with userId
    .transform(parseJson)                                   // Parse user response
    .transform(extractUserProfile)                          // Get profile
    .transform(formatUserData)                              // Format final data
    .execute();                                            // Run pipeline

if (error) {
    console.error('Failed to fetch user data:', error.message);
    return;
}
```

### Automatic Null Checking Example

```javascript
// Helper functions
const parseJson = response => response.json();
const extractField = data => data.requiredField;

// pipeFor handles null checks automatically
const [result, error] = await pipeFor(fetch('/api/data'))
    .transform(parseJson)
    .transform(extractField)    // No explicit null check needed
    .execute();

// If data.requiredField doesn't exist:
// result = null
// error = { message: "Cannot read property 'requiredField' of undefined", ... }
```

## Comparative Examples

### Processing Nested Data

#### Traditional Approach
```javascript
async function getUserData() {
    try {
        const todoRes = await fetch('/api/todos/1');
        const todo = await todoRes.json();
        
        if (!todo.userId) {
            throw new Error('User ID not found');
        }
        
        const userRes = await fetch(`/api/users/${todo.userId}`);
        const user = await userRes.json();
        
        if (!user.profile) {
            throw new Error('User profile not found');
        }
        
        return user.profile;
    } catch (error) {
        console.error(error);
        return null;
    }
}
```

#### Using promiseFor
```javascript
async function getUserData() {
    const [userData, error] = await promiseFor(
        fetch('/api/todos/1'),
        async (response) => {
            const todo = await response.json();
            const userRes = await fetch(`/api/users/${todo.userId}`);
            const user = await userRes.json();
            return user.profile;
        }
    );

    if (error) {
        console.error('Failed to get user data:', error);
        return null;
    }

    return userData;
}
```

#### Using pipeFor
```javascript
// Helper functions make the code cleaner and more maintainable
const parseJson = response => response.json();
const extractUserId = todo => todo.userId;
const extractProfile = user => user.profile;

async function getUserData() {
    const [profile, error] = await pipeFor(fetch('/api/todos/1'))
        .transform(parseJson)
        .transform(extractUserId)
        .pipe(userId => fetch(`/api/users/${userId}`))
        .transform(parseJson)
        .transform(extractProfile)
        .execute();

    if (error) {
        console.error('Failed to get user data:', error);
        return null;
    }

    return profile;
}
```

## Best Practices

1. **Extract Transform Functions**
```javascript
// Helper functions at the top level
const parseJson = response => response.json();
const extractUserId = data => data.userId;
const formatUserData = user => ({
    name: user.name,
    email: user.email
});

// Clean, readable pipeline
const [result, error] = await pipeFor(fetch('/api/users'))
    .transform(parseJson)
    .transform(extractUserId)
    .transform(formatUserData)
    .execute();
```

2. **Group Related Operations**
```javascript
const [result, error] = await pipeFor(fetch('/api/users'))
    // Data parsing group
    .transform(parseJson)
    .transform(extractUserData)
    
    // Profile enrichment group
    .pipe(user => fetch(`/api/profiles/${user.id}`))
    .transform(parseJson)
    .transform(enrichUserProfile)
    
    // Final formatting group
    .transform(formatResponse)
    .execute();
```

3. **Keep Transforms Simple**
```javascript
// Don't do this:
.transform(data => {
    // Complex logic here
    return complexOperation(data).someField;
})

// Do this instead:
const processData = data => complexOperation(data);
const extractField = result => result.someField;

.transform(processData)
.transform(extractField)
```

4. **Use Meaningful Names**
```javascript
const [userData, userError] = await pipeFor(fetch('/api/users'))
    .transform(parseJson)
    .transform(extractUserData)
    .execute();
```

5. **Handle Errors Appropriately**
```javascript
const [result, error] = await pipeFor(fetch('/api/data'))
    .transform(parseJson)
    .transform(processData)
    .execute();

if (error) {
    if (error.status === 404) {
        return defaultValue;
    }
    throw error;
}
```

## Key Reminders

1. `transform`:
  - Takes exactly one parameter
  - Returns transformed data
  - Automatically handles null/undefined

2. `pipe`:
  - Use for new promise-based operations
  - Takes previous result as input
  - Returns new promise

3. `execute`:
  - Required as final step
  - Returns [result, error] tuple

4. Error handling:
  - Automatic null checking in transforms
  - Consistent error format
  - Pipeline stops at first error

## License

MIT License