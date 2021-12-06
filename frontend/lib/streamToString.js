export default async function streamToString(stream) {
  let chunks = [];
  let isDone = false;

  while (isDone === false) {
    const res = await stream.read();
    if (res.done === true) {
      isDone = true;
    } else {
      chunks.push(res.value);
    }
  }

  return Buffer.concat(chunks).toString('utf8');
}
