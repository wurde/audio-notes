// https://www.npmjs.com/package/@aws-sdk/client-s3
import {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
  GetObjectCommand
} from '@aws-sdk/client-s3';

const transcriptBucket = process.env.NEXT_PUBLIC_OUTPUTTRANSCRIPT_BUCKET;

import streamToString from './streamToString';

export default async function fetchTranscripts(s3Client, transcriptList, pageCount, pageSize) {
  try {
    for (let i = 0; i < pageCount * pageSize && i < transcriptList.length; i++) {
      if (transcriptList[i].Content) continue;

      // Retrieves objects from Amazon S3.
      const resTranscript = await s3Client.send(new GetObjectCommand({
        // (required) The bucket containing the object.
        Bucket: transcriptBucket,
        // (required) Key of the object to get.
        Key: transcriptList[i].Key,
        // Sets the Content-Type header of the response.
        ResponseContentType: 'application/json'
      }));
      //=> {
      //=>   "$metadata": {
      //=>     "httpStatusCode": 200,
      //=>     "attempts": 1,
      //=>     "totalRetryDelay": 0
      //=>   },
      //=>   "Body": {},
      //=>   "ContentLength": 3984,
      //=>   "ContentType": "application/json",
      //=>   "ETag": "\"ce0ca97d9a9189e1e71713703436d12b\"",
      //=>   "LastModified": "2021-11-27T19:20:07.000Z",
      //=>   "Metadata": {}
      //=> }

      const textContent = await streamToString(resTranscript.Body.getReader());
      transcriptList[i].Content = JSON.parse(textContent).results.transcripts[0].transcript;
    }

    return transcriptList;
  } catch(err) {
    console.error(err);
    return transcriptList;
  }
}
