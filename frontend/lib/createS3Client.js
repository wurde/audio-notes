// https://www.npmjs.com/package/@aws-sdk/client-s3
import {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3client.html
  S3Client,
} from '@aws-sdk/client-s3';

// https://www.npmjs.com/package/@aws-sdk/client-cognito-identity
import {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/cognitoidentityclient.html
  CognitoIdentityClient,
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/getidcommand.html
  GetIdCommand,
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/classes/getcredentialsforidentitycommand.html
  GetCredentialsForIdentityCommand
} from "@aws-sdk/client-cognito-identity";

const region = 'us-east-1';

// Grab AWS credentials and create an S3 client.
export default async function createS3Client(cognitoIdToken) {
  // Get temporary AWS credentials.
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity/index.html
  const cognito = new CognitoIdentityClient({
    // The AWS region to which this client will send requests.
    region
  });

  const Logins = {};
  Logins[process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ENDPOINT] = cognitoIdToken;

  // Retrieves the Cognito ID.
  const idResponse = await cognito.send(
    new GetIdCommand({
      // IdentityPoolId: "us-east-1:123abc-d041-394e-2eb6-faea3d88fc2b",
      IdentityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
      // Logins: { "cognito-idp.us-east-1.amazonaws.com/us-east-1_123abcv05": cognitoIdToken }
      Logins,
    })
  );
  //=> {
  //=>   "$metadata": {
  //=>     "httpStatusCode": 200,
  //=>     "requestId": "123abce0-28db-4b70-8e87-0e5f57850ad7",
  //=>     "attempts": 1,
  //=>     "totalRetryDelay": 0
  //=>   },
  //=>   "IdentityId": "us-east-1:123abc-d041-394e-2eb6-faea3d88fc2b"
  //=> }

  // Returns credentials for the provided Cognito ID.
  const credentialsResponse = await cognito.send(
    new GetCredentialsForIdentityCommand({
      IdentityId: idResponse.IdentityId,
      // Logins: { "cognito-idp.us-east-1.amazonaws.com/us-east-1_123abcv05": cognitoIdToken }
      Logins,
    })
  );
  //=> {
  //=>   "$metadata": {
  //=>     "httpStatusCode": 200,
  //=>     "requestId": "123abc2a-bfda-46d1-ad13-2437e7beb2b6",
  //=>     "attempts": 1,
  //=>     "totalRetryDelay": 0
  //=>   },
  //=>   "Credentials": {
  //=>     "AccessKeyId": "ABCUV2XP27YW2C6MB7",
  //=>     "Expiration": "2021-11-23T12:31:19.000Z",
  //=>     "SecretKey": "123abcyFpL2vlBqA0LSWg5CXm3tx+ghyh1qUVaS",
  //=>     "SessionToken": "IQoJb3JpZ2..."
  //=>   },
  //=>   "IdentityId": "us-east-1:123abc-d041-394e-2eb6-faea3d88fc2b"
  //=> }

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3client.html
  const client = new S3Client({
    // The AWS region to which this client will send requests.
    region,
    // The credentials used to sign requests.
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html#credentials
    credentials: {
      // The access key ID that identifies the temporary security credentials.
      accessKeyId: credentialsResponse.Credentials.AccessKeyId,
      // The secret access key that can be used to sign requests.
      secretAccessKey: credentialsResponse.Credentials.SecretKey,
      // The token that users must pass to the service API to use the temporary credentials.
      sessionToken: credentialsResponse.Credentials.SessionToken,
      // The date on which the current credentials expire.
      expiration: credentialsResponse.Credentials.Expiration,
    },
  });

  return client;
}
