export default async function toggleAudioInput(e, setMediaRecorder) {
  e.preventDefault();

  try {
    const deviceId = e.target.options[e.target.selectedIndex].value

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } }
    });

    if (MediaRecorder.isTypeSupported('audio/webm')) {
      // Creates a new MediaRecorder object that will record a
      // specified MediaStream.
      //
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
      const recorder = new MediaRecorder(stream, {
        // A MIME type specifying the format for the resulting media.
        mimeType: 'audio/webm'
      });
      setMediaRecorder(recorder);
    } else {
      alert('ERROR: Your browser does not support the audio/webm mime type.');
    }
  } catch (err) {
    console.error(err);
    setMediaRecorder(null);
  }
}
