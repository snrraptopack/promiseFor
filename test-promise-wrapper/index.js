const {promiseFor} = require("promise-for-wrapper");

async function loadText(){
  const [data, error] = await promiseFor(fetch("https://jsonplaceholder.typicode.com/posts/1"),
    async (res)=> await res.json())


  if(error){
    console.log(error)
  }
  console.log(data)
}

loadText()