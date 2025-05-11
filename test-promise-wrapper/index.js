const {promiseFor,pipeFor} = require("promise-for-wrapper");

async function loadText(){


  const [data1,err1] = await pipeFor(fetch("https://jsonplaceholder.typicode.com/posts/1"))
    .transform(res=>res.json())
    .transform(data=>data.idd)
    .pipe((id)=>fetch(`https://jsonplaceholder.typicode.com/posts/${id}`))
    .transform(res=>res.json())
    .execute()
  console.log(data1)
  console.log(err1)

}

await loadText()