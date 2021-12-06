import TrashIcon from '../TrashIcon';

// https://www.npmjs.com/package/@aws-sdk/client-s3
import {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/deleteobjectcommand.html
  DeleteObjectCommand
} from '@aws-sdk/client-s3';

const transcriptBucket = process.env.NEXT_PUBLIC_OUTPUTTRANSCRIPT_BUCKET;
const audioBucket = process.env.NEXT_PUBLIC_INPUTAUDIO_BUCKET;

export default function DeleteNoteButton({ s3Client, prefix }) {
  const deleteNote = async () => {
    const yes = confirm('Are you sure you want to delete this note?');

    if (yes) {
      // Remove an object from a bucket.
      await s3Client.send(new DeleteObjectCommand({
        // (required) The bucket containing the object.
        Bucket: transcriptBucket,
        // (required) Key of the object to get.
        Key: prefix
      }));
      await s3Client.send(new DeleteObjectCommand({
        Bucket: audioBucket,
        Key: prefix.replace('.json', '')
      }));
    }
  }

  return (
    <button className="p-2" onClick={deleteNote}>
      <TrashIcon size="15" />
    </button>
  )
}
