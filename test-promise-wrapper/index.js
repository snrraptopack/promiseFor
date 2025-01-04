const {promiseFor,pipeFor} = require("promise-for-wrapper");

async function loadText(){
  const [data,err] = await promiseFor(fetch("https://jsonplaceholder.typicode.com/posts/1"),
    res=>res.json())

  console.log(data)


  const [data1,err1] = await pipeFor(fetch("https://jsonplaceholder.typicode.com/posts/1"))
    .transform(res=>res.json())
    .transform(json=>json.title)
    .execute()
  console.log(data1)

}

loadText()