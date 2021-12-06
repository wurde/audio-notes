// Return a list of available media devices.
export default async function getDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }

  try {
    // The MediaDevices method enumerateDevices() requests a list of
    // the available media input and output devices, such as
    // microphones, cameras, headsets, and so forth.
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
  } catch (err) {
    console.log(err.name + ": " + err.message);
  }
}
