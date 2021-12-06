// https://www.npmjs.com/package/@aws-sdk/client-s3
import {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/createmultipartuploadcommand.html
  CreateMultipartUploadCommand,
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/uploadpartcommand.html
  UploadPartCommand,
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/completemultipartuploadcommand.html
  CompleteMultipartUploadCommand
} from '@aws-sdk/client-s3';

import createAudioNoteName from './createAudioNoteName';

const bucket = process.env.NEXT_PUBLIC_INPUTAUDIO_BUCKET;

export default class AudioStream {
  constructor(s3Client, mediaRecorder, setAudioStream) {
    this.s3Client = s3Client;
    this.mediaRecorder = mediaRecorder;
    this.setAudioStream = setAudioStream;

    this.recordedChunks = [];
    this.etags = [];
    this.partCount = 0;
    this.isRecording = false;
  }

  audioStreamInitialize() {
    // Run code in response to Blob data being made available
    // for use by the MediaRecorder.
    //
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/ondataavailable
    this.mediaRecorder.ondataavailable = e => {
      let chunks = [];

      this.recordedChunks.push(e.data);
      chunks.push(e.data);

      let blob = new Blob(chunks, {
        type: 'audio/webm'
      });

      if (this.recordedChunks.length == 1) {
        // Set name of the audio note.
        this.audioNoteName = createAudioNoteName();
        this.startMultipartUpload(blob);
      } else {
        this.partCount += 1;
        this.continueMultipartUpload(blob);
      }
    };
  }

  startRecording() {
    this.isRecording = true;

    // The MediaRecorder method start(), which is part of the
    // MediaStream Recording API, begins recording media into one
    // or more Blob objects.
    //
    // You can record the entire duration of the media into a
    // single Blob or you can specify the number of milliseconds
    // to record at a time. Then, each time that amount of media
    // has been recorded, an event will be delivered to let you
    // act upon the recorded media, while a new Blob is created
    // to record the next slice of the media.
    //
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
    // Warning: The size of the buffer must be greater than or
    // equal to 5MB. Setting the duration to 15 minutes
    // guarantees that. However many notes may and can be shorter
    // than that.
    this.mediaRecorder.start(900000); // 15 minute buffer
  }

  stopRecording() {
    this.isRecording = false;

    // Stop recording
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop
    this.mediaRecorder.stop();

    this.setAudioStream(null);
  }

  async startMultipartUpload(blob) {
    // When you send a request to initiate a multipart upload,
    // Amazon S3 returns a response with an upload ID, which is
    // a unique identifier for your multipart upload. You must
    // include this upload ID whenever you upload parts, list
    // the parts, complete an upload, or stop an upload.
    //
    // Multipart upload is a three-step process: You initiate the
    // upload, you upload the object parts, and after you have
    // uploaded all the parts, you complete the multipart upload.
    //
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/createmultipartuploadcommandinput.html
    const resInit = await this.s3Client.send(new CreateMultipartUploadCommand({
      // (required) Name of the bucket to initiate the upload to.
      Bucket: bucket,
      // (required) Object key for the multipart upload.
      Key: this.audioNoteName,
      // A MIME type describing the format of the object data.
      ContentType: 'audio/webm',
      // Specifies caching behavior along the request/reply chain.
      // Default to a maximum of 100 years.
      CacheControl: 'max-age=3153600000',
      // By default, Amazon S3 uses the STANDARD Storage Class
      // to store newly created objects. Valid values: STANDARD,
      // REDUCED_REDUNDANCY, STANDARD_IA, ONEZONE_IA,
      // INTELLIGENT_TIERING, GLACIER, DEEP_ARCHIVE, OUTPOSTS.
      StorageClass: 'STANDARD'
    }));

    this.uploadId = resInit.UploadId;
    this.partCount += 1;

    this.continueMultipartUpload(blob);
  }

  async continueMultipartUpload(blob) {
    try {
      // Uploads a part in a multipart upload.
      //
      // When uploading a part, in addition to the upload ID, you
      // must specify a part number. You can choose any part
      // number between 1 and 10,000. A part number uniquely
      // identifies a part and its position in the object you are
      // uploading. The part number that you choose doesn’t need
      // to be in a consecutive sequence (for example, it can be
      // 1, 5, and 14). If you upload a new part using the same
      // part number as a previously uploaded part, the
      // previously uploaded part is overwritten.
      //
      // Whenever you upload a part, Amazon S3 returns an ETag
      // header in its response. For each part upload, you must
      // record the part number and the ETag value. You must
      // include these values in the subsequent request to
      // complete the multipart upload.
      const resPart = await this.s3Client.send(new UploadPartCommand({
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/uploadpartcommandinput.html
        // (required) Name of the bucket to initiate the upload to.
        Bucket: bucket,
        // (required) Object key for the multipart upload.
        Key: this.audioNoteName,
        // (required) Upload ID for the multipart upload.
        UploadId: this.uploadId,
        // Part number of part being uploaded. Between 1 and 10,000.
        PartNumber: this.partCount,
        // Object data.
        Body: blob,
        // 5 MB to 5 GB. There is no minimum size limit on the
        // last part of your multipart upload.
        ContentLength: blob.size
      }));

      // Save ETag value to array.
      this.etags.push(resPart.ETag);

      // If recording has stopped then complete the upload.
      if (this.isRecording === false) {
        await this.completeMultipartUpload();
      }
    } catch (err) {
      console.log(err, err.stack);
    }
  }

  async completeMultipartUpload() {
    let etagParts = [];

    this.etags.forEach((data, index) => {
      etagParts.push({
        PartNumber: index + 1,
        ETag: data
      });
    });

    try {
      // Completes a multipart upload by assembling previously
      // uploaded parts.
      //
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/completemultipartuploadcommandinput.html
      await this.s3Client.send(new CompleteMultipartUploadCommand({
        // (required) Name of the bucket to initiate the upload to.
        Bucket: bucket,
        // (required) Object key for the multipart upload.
        Key: this.audioNoteName,
        // (required) Upload ID for the multipart upload.
        UploadId: this.uploadId,
        // The container for the multipart upload request info.
        MultipartUpload: {
          // PartNumber: Part number that identifies the part.
          // ETag: Entity tag returned when the part was uploaded.
          Parts: etagParts
        }
      }));

      // Reset initial variables
      this.etags = [];
      this.recordedChunks = [];
      this.partCount = 0;
      this.uploadId = null;
      this.audioNoteName = null;

      alert('Successfully uploaded audio recording!')
    } catch (err) {
      console.log(err, err.stack);
    }
  }
}
