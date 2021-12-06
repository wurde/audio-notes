// https://www.npmjs.com/package/@aws-sdk/client-s3
import {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/listobjectsv2command.html
  ListObjectsV2Command
} from '@aws-sdk/client-s3';

import createPrefixFilters from './createPrefixFilters';

const transcriptBucket = process.env.NEXT_PUBLIC_OUTPUTTRANSCRIPT_BUCKET;

export default async function fetchTranscriptList(s3Client) {
  try {
    const [thisMonth, lastMonth, prevLastMonth] = createPrefixFilters();
    let results = [];

    // Returns some or all (up to 1,000) of the objects in a
    // bucket. To use this, you must have `s3:ListBucket` access
    // to the bucket.
    const thisMonthTranscriptList = await s3Client.send(
      new ListObjectsV2Command({
        // (required) Bucket name to list.
        Bucket: transcriptBucket,
        //  Limits the response to keys that begin with the prefix.
        Prefix: thisMonth
      })
    );
    const lastMonthTranscriptList = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: transcriptBucket,
        Prefix: lastMonth
      })
    );
    const prevLastMonthTranscriptList = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: transcriptBucket,
        Prefix: prevLastMonth
      })
    );
    //=> {
    //=>   "$metadata": {
    //=>     "httpStatusCode": 200,
    //=>     "attempts": 1,
    //=>     "totalRetryDelay": 0
    //=>   },
    //=>   "Contents": [
    //=>     {
    //=>       "Key": "20211127-131943.json",
    //=>       "LastModified": "2021-11-27T19:20:07.000Z",
    //=>       "ETag": "\"ce0ca97d9a9189e1e71713703436d12b\"",
    //=>       "Size": 3984,
    //=>       "StorageClass": "STANDARD"
    //=>     },
    //=>     {
    //=>       "Key": "20211127-132150.json",
    //=>       "LastModified": "2021-11-27T19:22:11.000Z",
    //=>       "ETag": "\"25a87c750934e31ea256e570d8d70e09\"",
    //=>       "Size": 2729,
    //=>       "StorageClass": "STANDARD"
    //=>     },
    //=>     {
    //=>       "Key": "20211127-132208.json",
    //=>       "LastModified": "2021-11-27T19:22:32.000Z",
    //=>       "ETag": "\"f7bc46fa7d224d18b53eed795b51c0c8\"",
    //=>       "Size": 2666,
    //=>       "StorageClass": "STANDARD"
    //=>     }
    //=>   ],
    //=>   "IsTruncated": false,
    //=>   "KeyCount": 4,
    //=>   "MaxKeys": 250,
    //=>   "Name": "example-com-outputtranscript",
    //=>   "Prefix": ""
    //=> }

    thisMonthTranscriptList.Contents &&
      results.push(...thisMonthTranscriptList.Contents.reverse());
    lastMonthTranscriptList.Contents &&
      results.push(...lastMonthTranscriptList.Contents.reverse());
    prevLastMonthTranscriptList.Contents &&
      results.push(...prevLastMonthTranscriptList.Contents.reverse());

    return results;
  } catch(err) {
    console.error(err);
    return [];
  }
}
