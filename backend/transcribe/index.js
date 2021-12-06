// https://www.npmjs.com/package/@aws-sdk/client-transcribe
const {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-transcribe
  TranscribeClient,
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-transcribe/classes/starttranscriptionjobcommand.html
  StartTranscriptionJobCommand
} = require('@aws-sdk/client-transcribe');

const region = process.env.AWS_REGION;
const dataAccessRoleArn = process.env.DATA_ACCESS_ROLE_ARN;
const outputBucket = process.env.OUTPUT_BUCKET;

module.exports.main = async (event) => {
  // event.Records
  //=> {
  //=>   "eventVersion": "2.1",
  //=>   "eventSource": "aws:s3",
  //=>   "awsRegion": "us-east-1",
  //=>   "eventTime": "2021-11-27T13:32:18.146Z",
  //=>   "eventName": "ObjectCreated:CompleteMultipartUpload",
  //=>   "userIdentity": {
  //=>       "principalId": "AWS:123abc:CognitoIdentityCredentials"
  //=>   },
  //=>   "requestParameters": {
  //=>       "sourceIPAddress": "127.0.0.1"
  //=>   },
  //=>   "responseElements": {
  //=>       "x-amz-request-id": "BSXYDBCPFJJASDB3",
  //=>       "x-amz-id-2": "CNsVwXY2VsNbJsiC7R3YjZx51fKyfevviEx..."
  //=>   },
  //=>   "s3": {
  //=>       "s3SchemaVersion": "1.0",
  //=>       "configurationId": "tf-s3-lambda-20211127114007590300000001",
  //=>       "bucket": {
  //=>           "name": "example-com-inputaudio",
  //=>           "ownerIdentity": {
  //=>               "principalId": "123abc"
  //=>           },
  //=>           "arn": "arn:aws:s3:::example-com-inputaudio"
  //=>       },
  //=>       "object": {
  //=>           "key": "20211127-073217",
  //=>           "size": 94085,
  //=>           "eTag": "693e61fe25cfe0ff52cb3892a9936762-1",
  //=>           "sequencer": "0061A233617D3F7991"
  //=>       }
  //=>   }
  //=> }

  try {
    // Get bucket and key from event.
    const input_bucket = event.Records[0].s3.bucket.name;
    const input_key = event.Records[0].s3.object.key;

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-transcribe/interfaces/transcribeclientconfig.html
    const transcribe = new TranscribeClient({
      // The AWS region to which this client will send requests.
      region
    });

    // Start the transcription job.
    await transcribe.send(new StartTranscriptionJobCommand({
      // This is a personal knowledge repository. I've gone through
      // (Required) The name of the job. You can't use the strings
      // "." or ".." by themselves as the job name. The name must
      // also be unique within an AWS account. If you try to create
      // a transcription job with the same name as a previous
      // transcription job, you get a ConflictException error.
      TranscriptionJobName: `transcribe-${input_key}`,
      // (Required) Describes the input media for a transcription job.
      Media: {
        MediaFileUri: `s3://${input_bucket}/${input_key}`
      },
      // The language code for the language used in the input media.
      LanguageCode: 'en-US',
      // The format of the input media. Possible values: mp3, mp4, wav,
      // flac, ogg, amr, or webm.
      MediaFormat: 'webm',
      // How a transcription job is executed.
      JobExecutionSettings: {
        AllowDeferredExecution: true,
        // A role that has access to the input and output S3 buckets.
        // Amazon Transcribe assumes this role to read and write
        // media files.
        DataAccessRoleArn: dataAccessRoleArn
      },
      // The location where the transcription is stored. The S3 bucket
      // must have permissions that allow Amazon Transcribe to put
      // files in the bucket.
      OutputBucketName: outputBucket,
      // You can specify a location in an S3 bucket to store the output
      // of your transcription job. If you don't specify an output key,
      // Amazon Transcribe stores the output of your transcription job
      // in the S3 bucket you specified. By default, the object key is
      // "your-transcription-job-name.json".
      OutputKey: `${input_key}.json`
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Successfully created a transcription job.',
      }),
    }
  } catch (err) {
    console.error(err);

    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error creating a transcription job.',
      }),
    }
  }
}
