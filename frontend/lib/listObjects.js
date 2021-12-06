export default function listObjects() {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/ListObjectsV2Command.html
  // Returns some or all (up to 1,000) of the objects in a
  // bucket with each request.
  const cmd = new ListObjectsV2Command({ "Bucket": bucket });
  const data = await s3Client.send(cmd);
  console.log(JSON.stringify(data));
}
