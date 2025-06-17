# Promise For Wrapper

A powerful TypeScript utility library that revolutionizes asynchronous JavaScript by providing robust error handling, elegant data transformation pipelines, and predictable control flow for complex asynchronous operations.

## Why Promise For Wrapper?

Working with asynchronous operations in JavaScript often leads to:
- Deeply nested try/catch blocks
- Inconsistent error handling patterns
- Difficult-to-follow transformation chains
- Unpredictable null/undefined behaviors
- Hard-to-debug promise chains

**Promise For Wrapper** solves these problems with a declarative, functional approach that makes async code more:
- **Readable**: Clear, linear flow of operations
- **Maintainable**: Modular, testable transformation functions
- **Robust**: Consistent error handling throughout
- **Predictable**: Standardized [result, error] tuple pattern
- **Type-safe**: Full TypeScript support with accurate type inference

## Core Utilities

The library provides two main utilities:
- `promiseFor`: Single-step promise resolution with built-in error handling
- `pipeFor`: Multi-step transformation pipeline with automatic error propagation

## Traditional vs Promise For Approach

| Feature | Traditional Promises | Promise For Wrapper |
|---------|---------------------|---------------------|
| Error Handling | Try/catch blocks | Automatic with [result, error] tuples |
| Null Checking | Manual checks throughout code | Automatic in transformations |
| Composition | Nested .then() chains | Linear transform/pipe chains |
| Error Context | Lost in catch blocks | Preserved with detailed context |
| HTTP Errors | Manual response.ok checks | Automatic detection and handling |
| Type Safety | Limited inference in chains | Full type inference throughout |
| Debugging | Complex stack traces | Clear error contexts with step info |

## Installation

```bash
npm install promise-for-wrapper
```

## Error Handling Philosophy

Traditional promise error handling relies on try/catch blocks that often lose context and make error propagation difficult. Promise For Wrapper takes a fundamentally different approach:

1. **Explicit Error Returns**: All operations return a tuple of [result, error] instead of throwing exceptions
2. **Rich Error Context**: Errors maintain their original information plus additional context
3. **Automatic Propagation**: Errors automatically flow through pipelines without manual handling
4. **Type Safety**: TypeScript ensures you handle both success and error cases

### Error Context Structure

All operations use a standardized error context that preserves and enhances error information:

```typescript
interface ErrorContext {
    message: string;        // Human-readable error message
    name: string;           // Error type name (e.g., "HTTPError", "TypeError")
    stack?: string | null;  // Original stack trace when available
    status?: number | null; // HTTP status code for network requests
    url?: string | null;    // URL for network requests
    method?: string | null; // HTTP method for network requests
    code?: string | null;   // Error code (e.g., "ECONNREFUSED")
    context: string;        // Description of the operation that failed
    stepInfo?: {            // For pipeline operations
        index: number;      // Position in the pipeline
        type: 'initialization' | 'transform' | 'pipe'; // Step type
        pipelineContext?: string; // Pipeline segment context
    };
}
```

### Special Error Handling

The library includes specialized error handling for common scenarios:

1. **HTTP Errors**: Automatically detects and normalizes HTTP errors from fetch responses
2. **Null/Undefined**: Automatically handles null/undefined values in transformations
3. **Throwable Errors**: Provides `PipelineError` and `PromiseForError` classes for when you need to throw

## promiseFor: Single-Step Operations

`promiseFor` is the foundation of the library, providing a clean way to handle a promise and its potential errors without try/catch blocks.

### API Overview

```typescript
// Modern API (recommended)
const [result, error] = await promiseFor(
    promiseOrFunction,
    {
        postProcessor?: (value: T) => R | Promise<R>,
        context?: string
    }
);

// Legacy API (still supported)
const [result, error] = await promiseFor(
    promiseOrFunction,
    postProcessor,
    context
);
```

### Key Features

- **Flexible Input**: Accepts either a Promise or a function that returns a Promise
- **Post-Processing**: Optional transformation of the resolved value
- **Error Context**: Custom context string for better error messages
- **HTTP Detection**: Automatic handling of HTTP error responses
- **Type Safety**: Full TypeScript support with accurate type inference

### Basic Example

```typescript
// Using promiseFor with a direct promise
const [data, error] = await promiseFor(fetch('/api/users'));

if (error) {
    console.error('Failed to fetch users:', error.message);
    // Access additional error information
    if (error.status === 404) {
        return { users: [] };
    }
    return null;
}

// Process the successful result
console.log(`Fetched ${data.length} users`);
```

### With Post-Processing

```typescript
// Helper function for JSON parsing
const parseJson = async (response) => await response.json();

// Using promiseFor with post-processing (modern API)
const [userData, error] = await promiseFor(
    fetch('/api/users'),
    {
        postProcessor: parseJson,
        context: 'Fetching user data'
    }
);

// Alternative with legacy API
const [userData, error] = await promiseFor(
    fetch('/api/users'),
    parseJson,
    'Fetching user data'
);

if (error) {
    console.error(`${error.context} failed:`, error.message);
    return null;
}

return userData;
```

### Function-Based Input

```typescript
// Function that returns a promise
const fetchUserData = (userId) => fetch(`/api/users/${userId}`);

// Using promiseFor with a function
const [response, error] = await promiseFor(
    () => fetchUserData(123),
    {
        context: 'User data retrieval'
    }
);

if (error) {
    console.error('User data retrieval failed:', error);
    return null;
}

// Process the response
const userData = await response.json();
```

## pipeFor: Multi-Step Operations

`pipeFor` is the powerful pipeline builder that enables clean, functional transformation chains for complex asynchronous operations.

### API Overview

```typescript
// Create a pipeline
const pipeline = pipeFor(promiseOrFunction, context?);

// Add transformation steps
pipeline.transform(transformFn, stepContext?);

// Add new promise-based operations
pipeline.pipe(promiseFn, stepContext?);

// Execute the pipeline
const [result, error] = await pipeline.execute();
```

### Key Concepts

1. **transform(fn, context?)**:
   - **Purpose**: Transform data without creating new promises
   - **Input**: Takes exactly one argument (previous step's result)
   - **Output**: Returns transformed data (synchronously or asynchronously)
   - **Null Safety**: Automatically handles null/undefined values
   - **Context**: Optional context string for error reporting

2. **pipe(fn, context?)**:
   - **Purpose**: Introduce new promise-based operations
   - **Input**: Takes previous result as input
   - **Output**: Must return a Promise
   - **Use Case**: For making new API calls or other async operations
   - **Context**: Optional context string for error reporting

3. **execute()**:
   - **Purpose**: Run the pipeline and get the final result
   - **Required**: Must be called as the final step
   - **Returns**: [result, error] tuple
   - **Behavior**: Stops at the first error encountered

### Pipeline Flow Visualization

```
Initial Promise → transform → transform → pipe → transform → [result, error]
                    ↓           ↓        ↓        ↓
                 Step 1       Step 2   Step 3   Step 4
                    ↓           ↓        ↓        ↓
                Data transform → New Promise → Final transform
```

### Practical Example: Chained API Calls

This example demonstrates how `pipeFor` elegantly handles a complex workflow involving multiple API calls, data transformations, and error handling:

```typescript
// Helper functions - small, focused, and reusable
const parseJson = (response: Response) => response.json();
const extractUserId = (todo: any) => todo.userId;
const fetchUserById = (userId: string) => fetch(`/api/users/${userId}`);
const extractUserProfile = (user: any) => user.profile;
const formatUserData = (profile: any) => ({
    name: profile.name,
    email: profile.email,
    lastUpdated: new Date().toISOString()
});

// Using pipeFor with clean, descriptive transformations
const [userData, error] = await pipeFor(fetch('/api/todos/1'), 'Todo retrieval')
    // Data extraction group
    .transform(parseJson, 'Parse todo JSON')                  
    .transform(extractUserId, 'Extract user ID')              

    // User data retrieval group
    .pipe(fetchUserById, 'Fetch user data')                   
    .transform(parseJson, 'Parse user JSON')                  
    .transform(extractUserProfile, 'Extract user profile')    

    // Final formatting
    .transform(formatUserData, 'Format user data')            
    .execute();                                              

if (error) {
    console.error(`Error in ${error.context}:`, error.message);

    // Detailed error handling based on step and status
    if (error.stepInfo?.type === 'pipe' && error.status === 404) {
        return { error: 'User not found', code: 'USER_NOT_FOUND' };
    }

    return { error: 'Failed to process user data', code: 'PROCESSING_ERROR' };
}

return { success: true, data: userData };
```

### Automatic Null Checking Example

One of the most powerful features of `pipeFor` is automatic null/undefined handling, which eliminates a common source of runtime errors:

```typescript
interface ApiData {
    items?: {
        results?: {
            mainData?: string;
        }[];
    };
}

// Helper functions
const parseJson = (response: Response): Promise<ApiData> => response.json();

// These would normally require extensive null checking
const extractItems = (data: ApiData) => data.items?.results;
const getFirstItem = (items: any[]) => items[0];
const getMainData = (item: any) => item.mainData;

// pipeFor handles all null checks automatically
const [result, error] = await pipeFor(fetch('/api/deeply/nested/data'))
    .transform(parseJson, 'Parse API response')
    .transform(extractItems, 'Extract results array')  // No explicit null check needed
    .transform(getFirstItem, 'Get first result')       // Safely handles empty arrays
    .transform(getMainData, 'Extract main data')       // Safely handles undefined properties
    .execute();

if (error) {
    console.error('Data extraction failed:', error);
    // Error will include which exact transform failed and why
    return null;
}

return result; // Only contains the value if all steps succeeded
```

### Real-World Example: User Authentication Flow

This example shows how `pipeFor` can handle a complex authentication flow with validation, API calls, and data transformation:

```typescript
// Helper functions
const parseJson = (res: Response) => res.json();
const validateCredentials = (credentials: any) => {
    if (!credentials.username || !credentials.password) {
        throw new Error('Invalid credentials');
    }
    return credentials;
};

const authenticateUser = async (credentials: any) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return response;
};

const extractAuthToken = (data: any) => data.token;
const fetchUserProfile = (token: string) => 
    fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

// Complete authentication flow
const [session, error] = await pipeFor(userInput)
    // Validation group
    .transform(validateCredentials, 'Validate user input')

    // Authentication group
    .pipe(authenticateUser, 'Authenticate user')
    .transform(parseJson, 'Parse authentication response')
    .transform(extractAuthToken, 'Extract auth token')

    // Profile retrieval group
    .pipe(fetchUserProfile, 'Fetch user profile')
    .transform(parseJson, 'Parse profile data')

    // Session creation
    .transform(profile => ({ 
        user: profile,
        authenticated: true,
        loginTime: new Date().toISOString()
    }), 'Create user session')
    .execute();

if (error) {
    // Detailed error handling based on which step failed
    if (error.context === 'Validate user input') {
        return { error: 'Please provide valid credentials' };
    }

    if (error.status === 401) {
        return { error: 'Invalid username or password' };
    }

    return { error: 'Authentication failed', details: error.message };
}

return { success: true, session };
```

## Comparative Examples: Traditional vs Promise For Approach

This section compares traditional promise handling with the Promise For Wrapper approach across different scenarios.

### Scenario 1: Error Handling in API Calls

#### Traditional Approach
```typescript
async function fetchUserData(userId: string) {
    try {
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        // Error information is limited and context is lost
        return null;
    }
}
```

#### Promise For Approach
```typescript
async function fetchUserData(userId: string) {
    const [data, error] = await promiseFor(
        fetch(`/api/users/${userId}`),
        { 
            postProcessor: res => res.json(),
            context: 'User data retrieval'
        }
    );

    if (error) {
        // Rich error information with context
        console.error(`${error.context} failed:`, error.message);

        // Detailed error handling based on status
        if (error.status === 404) {
            return { error: 'User not found' };
        }

        return { error: 'Service unavailable', details: error };
    }

    return { data };
}
```

### Scenario 2: Complex Data Processing Chain

#### Traditional Approach
```typescript
async function processOrderData(orderId: string) {
    try {
        // Fetch order details
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        if (!orderResponse.ok) throw new Error(`HTTP error! status: ${orderResponse.status}`);
        const order = await orderResponse.json();

        // Fetch customer details
        const customerResponse = await fetch(`/api/customers/${order.customerId}`);
        if (!customerResponse.ok) throw new Error(`HTTP error! status: ${customerResponse.status}`);
        const customer = await customerResponse.json();

        // Calculate tax based on customer location
        const taxResponse = await fetch(`/api/tax-rates?region=${customer.region}`);
        if (!taxResponse.ok) throw new Error(`HTTP error! status: ${taxResponse.status}`);
        const taxData = await taxResponse.json();

        // Apply tax calculation
        const taxRate = taxData.rate || 0;
        const totalWithTax = order.total * (1 + taxRate);

        return {
            order,
            customer,
            tax: { rate: taxRate, amount: order.total * taxRate },
            totalWithTax
        };
    } catch (error) {
        console.error("Order processing failed:", error);
        // Hard to determine which step failed
        return null;
    }
}
```

#### Promise For Approach
```typescript
// Clean, focused helper functions
const parseJson = (res: Response) => res.json();
const fetchCustomer = (order: any) => fetch(`/api/customers/${order.customerId}`);
const fetchTaxRate = (customer: any) => fetch(`/api/tax-rates?region=${customer.region}`);
const calculateTax = (data: { order: any, customer: any, taxData: any }) => {
    const taxRate = data.taxData.rate || 0;
    return {
        order: data.order,
        customer: data.customer,
        tax: { 
            rate: taxRate, 
            amount: data.order.total * taxRate 
        },
        totalWithTax: data.order.total * (1 + taxRate)
    };
};

async function processOrderData(orderId: string) {
    const [result, error] = await pipeFor(fetch(`/api/orders/${orderId}`), 'Order processing')
        // Order data retrieval
        .transform(parseJson, 'Parse order data')

        // Customer data retrieval
        .pipe(fetchCustomer, 'Fetch customer data')
        .transform(parseJson, 'Parse customer data')
        .transform(customer => ({ order, customer }), 'Combine order and customer')

        // Tax calculation
        .pipe(data => fetchTaxRate(data.customer), 'Fetch tax rate')
        .transform(parseJson, 'Parse tax data')
        .transform(taxData => ({ order, customer, taxData }), 'Prepare tax calculation')
        .transform(calculateTax, 'Calculate final price with tax')
        .execute();

    if (error) {
        // Precise error information with context
        console.error(`Error in ${error.context}:`, error.message);

        // Can determine exactly which step failed
        if (error.context === 'Fetch customer data' && error.status === 404) {
            return { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' };
        }

        return { error: 'Order processing failed', details: error };
    }

    return { success: true, data: result };
}
```

### Scenario 3: Handling Conditional Logic

#### Traditional Approach
```typescript
async function processPayment(paymentData) {
    try {
        // Validate payment data
        if (!paymentData.amount || paymentData.amount <= 0) {
            throw new Error('Invalid payment amount');
        }

        // Process based on payment method
        let paymentResult;
        if (paymentData.method === 'credit') {
            const response = await fetch('/api/payments/credit', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
            if (!response.ok) throw new Error(`Payment failed: ${response.status}`);
            paymentResult = await response.json();
        } else if (paymentData.method === 'paypal') {
            const response = await fetch('/api/payments/paypal', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
            if (!response.ok) throw new Error(`Payment failed: ${response.status}`);
            paymentResult = await response.json();
        } else {
            throw new Error('Unsupported payment method');
        }

        // Record transaction
        const transactionResponse = await fetch('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
                paymentId: paymentResult.id,
                amount: paymentData.amount,
                status: paymentResult.status
            })
        });
        if (!transactionResponse.ok) throw new Error('Failed to record transaction');

        return { success: true, transaction: await transactionResponse.json() };
    } catch (error) {
        console.error('Payment processing error:', error);
        return { success: false, error: error.message };
    }
}
```

#### Promise For Approach
```typescript
// Helper functions
const validatePayment = (data: any) => {
    if (!data.amount || data.amount <= 0) {
        throw new Error('Invalid payment amount');
    }
    return data;
};

const processPaymentMethod = (data: any) => {
    // Determine the correct payment processor based on method
    const endpoint = data.method === 'credit' 
        ? '/api/payments/credit' 
        : data.method === 'paypal'
            ? '/api/payments/paypal'
            : null;

    if (!endpoint) {
        throw new Error('Unsupported payment method');
    }

    return fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

const recordTransaction = (paymentResult: any) => {
    return fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
            paymentId: paymentResult.id,
            amount: paymentResult.amount,
            status: paymentResult.status
        })
    });
};

async function processPayment(paymentData: any) {
    const [result, error] = await pipeFor(Promise.resolve(paymentData), 'Payment processing')
        // Validation
        .transform(validatePayment, 'Validate payment data')

        // Payment processing
        .pipe(processPaymentMethod, 'Process payment method')
        .transform(response => response.json(), 'Parse payment response')

        // Transaction recording
        .pipe(recordTransaction, 'Record transaction')
        .transform(response => response.json(), 'Parse transaction response')
        .transform(transaction => ({ 
            success: true, 
            transaction,
            timestamp: new Date().toISOString()
        }), 'Format final result')
        .execute();

    if (error) {
        // Detailed error handling with context
        console.error(`Payment error in ${error.context}:`, error.message);

        // User-friendly error messages based on context
        if (error.context === 'Validate payment data') {
            return { success: false, error: 'Please provide a valid payment amount' };
        }

        if (error.context === 'Process payment method') {
            if (error.message.includes('Unsupported')) {
                return { success: false, error: 'Please select a supported payment method' };
            }
            return { success: false, error: 'Payment processing failed' };
        }

        return { success: false, error: 'Transaction could not be completed' };
    }

    return result;
}
```

## API Documentation

### promiseFor

```typescript
function promiseFor<T, R = T>(
    promiseOrFunction: (() => Promise<T>) | Promise<T>,
    optionsOrPostProcessor?: PromiseForOptions<T, R> | PostProcessor<T, R>,
    legacyContext?: string
): Promise<[R | null, ErrorContext | null]>

interface PromiseForOptions<T, R> {
    postProcessor?: (value: T) => R | Promise<R>;
    context?: string;
}
```

#### Parameters:
- **promiseOrFunction**: A Promise or a function that returns a Promise
- **optionsOrPostProcessor**: Either an options object or a post-processor function
- **legacyContext**: Optional context string (legacy API)

#### Returns:
- Promise resolving to a tuple: `[result, error]`

#### Example:
```typescript
const [data, error] = await promiseFor(fetch('/api/data'), {
    postProcessor: res => res.json(),
    context: 'Data fetching'
});
```

### pipeFor

```typescript
function pipeFor<T>(
    initial: Promise<T> | (() => Promise<T>), 
    context?: string
): Pipeline<T>
```

#### Parameters:
- **initial**: A Promise or a function that returns a Promise
- **context**: Optional context string for the pipeline

#### Returns:
- A Pipeline instance with transform, pipe, and execute methods

#### Example:
```typescript
const pipeline = pipeFor(fetch('/api/data'), 'Data pipeline');
const [result, error] = await pipeline.execute();
```

### Pipeline Methods

#### transform

```typescript
transform<R>(
    fn: (input: T) => R | Promise<R>, 
    stepContext?: string
): Pipeline<R>
```

- **fn**: Function to transform the input data
- **stepContext**: Optional context string for this step
- **Returns**: A new Pipeline instance with the transformed type

#### pipe

```typescript
pipe<R>(
    fn: (input: NonNullable<T>) => Promise<R>, 
    stepContext?: string
): Pipeline<R>
```

- **fn**: Function that takes the previous result and returns a new Promise
- **stepContext**: Optional context string for this step
- **Returns**: A new Pipeline instance with the new Promise's type

#### execute

```typescript
execute(): Promise<[T | null, ErrorContext | null]>
```

- **Returns**: Promise resolving to a tuple: `[result, error]`

### Error Types

#### ErrorContext

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
    stepInfo?: {
        index: number;
        type: 'initialization' | 'transform' | 'pipe';
        pipelineContext?: string;
    };
}
```

#### HTTPError

```typescript
class HTTPError extends Error {
    status: number;
    url: string;
}
```

#### PipelineError & PromiseForError

```typescript
class PipelineError extends Error {
    errorContext: ErrorContext;
    statusCode: number;
}

class PromiseForError extends Error {
    errorContext: ErrorContext;
    statusCode: number;
}
```

## Best Practices

### 1. Design for Composability

```typescript
// Create reusable transformation functions
const parseJson = (res: Response) => res.json();
const extractItems = (data: any) => data.items;
const filterActive = (items: any[]) => items.filter(item => item.active);
const sortByDate = (items: any[]) => [...items].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
);

// Compose them in different ways as needed
const getActiveItems = async (url: string) => {
    return pipeFor(fetch(url))
        .transform(parseJson)
        .transform(extractItems)
        .transform(filterActive)
        .execute();
};

const getRecentActiveItems = async (url: string) => {
    return pipeFor(fetch(url))
        .transform(parseJson)
        .transform(extractItems)
        .transform(filterActive)
        .transform(sortByDate)
        .execute();
};
```

### 2. Use Descriptive Context Strings

```typescript
// Add context to both pipeline and individual steps
const [result, error] = await pipeFor(fetch('/api/users'), 'User data pipeline')
    .transform(parseJson, 'Parse user JSON')
    .transform(validateUserData, 'Validate user data')
    .transform(formatUserProfile, 'Format user profile')
    .execute();

// Makes error messages much more helpful
if (error) {
    console.error(`Error in ${error.context}: ${error.message}`);
    // Example: "Error in Validate user data: Missing required field: email"
}
```

### 3. Group Related Operations with Comments

```typescript
const [result, error] = await pipeFor(fetch('/api/orders/123'))
    // Data retrieval and parsing
    .transform(parseJson, 'Parse order data')
    .transform(validateOrderData, 'Validate order data')

    // Payment processing
    .pipe(order => processPayment(order.payment), 'Process payment')
    .transform(validatePaymentResult, 'Validate payment result')

    // Inventory management
    .pipe(data => updateInventory(data.order.items), 'Update inventory')

    // Notification
    .pipe(data => sendOrderConfirmation(data), 'Send confirmation')
    .execute();
```

### 4. Keep Transforms Focused and Simple

```typescript
// Don't do this:
.transform(data => {
    // Complex logic with multiple responsibilities
    const processed = complexOperation(data);
    const validated = validateData(processed);
    return formatOutput(validated).someField;
})

// Do this instead:
.transform(complexOperation, 'Process data')
.transform(validateData, 'Validate processed data')
.transform(formatOutput, 'Format for output')
.transform(result => result.someField, 'Extract required field')
```

### 5. Leverage TypeScript for Better Type Safety

```typescript
interface User {
    id: string;
    name: string;
    email: string;
}

interface Order {
    id: string;
    items: OrderItem[];
    total: number;
}

// Type-safe transformations
const fetchUser = (userId: string) => fetch(`/api/users/${userId}`);
const parseUser = (res: Response): Promise<User> => res.json();
const fetchUserOrders = (user: User) => fetch(`/api/users/${user.id}/orders`);
const parseOrders = (res: Response): Promise<Order[]> => res.json();

// Pipeline with proper typing
const [orders, error] = await pipeFor(fetchUser('123'))
    .transform(parseUser)
    .pipe(fetchUserOrders)
    .transform(parseOrders)
    .execute();

// TypeScript knows that orders is Order[] | null
```

## License

MIT License
