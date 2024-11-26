# Promise For Wrapper

`promise-for-wrapper` is a utility package that wraps both callback-based functions and promise-based functions into a unified format that always returns a tuple containing the result and error. It provides a simpler, more consistent way to handle asynchronous code in JavaScript and Node.js.

---

## Features

- Supports both promise-based and callback-based functions.
- Returns a tuple `[data, error]`, making it easy to handle both success and failure cases.
- Works with both Node.js and browser environments.
- Simple API and lightweight.

---

## Installation

To install `promise-for-wrapper`, use npm or yarn:

```bash
npm install promise-for-wrapper
yarn add promise-for-wrapper

// Importing the library
const promiseFor = require('promise-for-wrapper');

// A simple callback-based function (Node.js fs.readFile for example)
const fs = require('fs');

// Wrap the function using promiseFor
const readFilePro = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf-8', (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

// Example with a promise-based function
async function getFileContent() {
  const [content, error] = await promiseFor(readFilePro('example.txt'));

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('File Content:', content);
  }
}

getFileContent();


const superagent = require('superagent');

// A function that fetches data from an API
const fetchData = (url) => superagent.get(url);

// Example of using multiple asynchronous operations
async function getDogData() {
  const [dogName, dogErr] = await promiseFor(readFilePro('dog.txt')); or
  const [dogName, dogErr] = await promiseFor(()=>readFilePro('dog.txt'));

  if (dogErr) {
    console.error('Error reading dog name:', dogErr);
    return;
  }

  const [dogData, dogDataErr] = await promiseFor(fetchData(`https://dog.ceo/api/breed/${dogName}/images/random`));

  if (dogDataErr) {
    console.error('Error fetching dog data:', dogDataErr);
    return;
  }

  console.log('Dog Image URL:', dogData.body.message);
}

getDogData();
