export default function AudioDeviceSelect({ toggleAudioInput, isRecording, devices }) {
  return (
    <div className="flex flex-col my-2">
      <label htmlFor="input-audio" className="text-gray-500">Input Audio Device:</label>
      <select name="input-audio" id="input-audio" onChange={toggleAudioInput} disabled={isRecording}
        className="p-2 border border-black bg-white rounded-sm">
        <option value="">Choose a device</option>
        {devices ? devices.map((device, i) => {
          if (device.kind === 'audioinput') {
            return <option key={i} value={device.deviceId}>{device.label}</option>
          } else {
            return ''
          }
        }) : ''
        }
      </select>
    </div>
  )
}
