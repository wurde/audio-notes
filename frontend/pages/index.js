import React, { useState, useEffect } from 'react';
import Head from 'next/head';

import SignOutButton from '../components/SignOutButton';
import SignInButton from '../components/SignInButton';
import AudioDeviceSelect from '../components/AudioDeviceSelect';
import MissingAudioDeviceError from '../components/MissingAudioDeviceError';
import DeleteNoteButton from '../components/DeleteNoteButton';

import parseLocationParams from '../lib/parseLocationParams';
import getDevices from '../lib/getDevices';
import createS3Client from '../lib/createS3Client';
import fetchTranscriptList from '../lib/fetchTranscriptList';
import fetchTranscripts from '../lib/fetchTranscripts';
import AudioStream from '../lib/AudioStream';
import toggleAudioInput from '../lib/toggleAudioInput';

const pageSize = 20;

export default function Home() {
  const [cognitoIdToken, setCognitoIdToken] = useState(null);
  const [devices, setDevices] = useState([]);
  const [s3Client, setS3Client] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const [transcriptList, setTranscriptList] = useState([]);

  useEffect(async () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Location/hash
    const params = parseLocationParams(window.location.hash);
    //=> {
    //=>   "id_token": "123abc",
    //=>   "access_token": "123abc",
    //=>   "expires_in": "3600",
    //=>   "token_type": "Bearer"
    //=> }

    if (params.id_token) {
      setCognitoIdToken(params.id_token);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setDevices(await getDevices());
    }
  }, [])

  useEffect(async () => {
    try {
      if (cognitoIdToken) {
        const s3 = await createS3Client(cognitoIdToken);
        setS3Client(s3);
      }
    } catch (err) {
      console.error(err);
      setCognitoIdToken(null);
    }
  }, [cognitoIdToken])

  useEffect(() => {
    if (!s3Client) return;
    let transcripts = [];
    setTranscriptList([]);

    const fetchData = async () => {
      if (transcriptList.length == 0) {
        let list = await fetchTranscriptList(s3Client);
        transcripts = await fetchTranscripts(s3Client, list, pageCount, pageSize);
      } else {
        transcripts = await fetchTranscripts(s3Client, transcriptList, pageCount, pageSize);
      }

      setTranscriptList(transcripts);
    }

    fetchData().catch(console.error);
  }, [s3Client, pageCount])

  async function startRecording(e) {
    e.preventDefault();

    const stream = new AudioStream(s3Client, mediaRecorder, setAudioStream);
    stream.audioStreamInitialize();
    stream.startRecording();
    setAudioStream(stream);
  }

  return (
    <>
      <Head>
        <title>Audio Notes</title>
      </Head>
      <main className="flex justify-center m-4">
        {/* If not signed in then display SignIn button. */}
        {!cognitoIdToken && <SignInButton />}

        {/* If signed in then display audio notes app. */}
        {cognitoIdToken && <>
          <div className="w-9/12 flex flex-col">
            {/* Display sign out link */}
            <SignOutButton setCognitoIdToken={setCognitoIdToken} />

            {/* If no media devices detected show warning. */}
            {devices.length == 0 ?
              <MissingAudioDeviceError /> :
              <>
                {/* If media devices detected show selection. */ }
                <AudioDeviceSelect
                  toggleAudioInput={e => toggleAudioInput(e, setMediaRecorder)}
                  isRecording={audioStream !== null}
                  devices={devices} />

                {/* If media recorder exists show start/stop buttons. */}
                {mediaRecorder &&
                  <div className="my-2">
                    {devices.length > 0 && !audioStream &&
                      <button onClick={e => startRecording(e)}
                        className={`w-full py-6 bg-green-100 hover:bg-green-200 focus:bg-green-300 border border-green-600 text-4xl`}>
                          Start
                      </button>}

                    {audioStream &&
                      <button onClick={e => audioStream.stopRecording(e)}
                        className={`w-full py-6 bg-red-100 hover:bg-red-200 focus:bg-red-300 border border-red-600 text-4xl`}>
                        Stop
                      </button>}
                  </div>}
              </>
            }

            {/* If notes are detected then show in the list. */}
            {transcriptList && transcriptList.length > 0 &&
              <div className="my-2 bg-seashell filter drop-shadow">
                {transcriptList.slice(0, pageCount * pageSize).map((transcript, i) => (
                  <div key={transcript.Key} className="flex justify-between p-5">
                    <div className="w-full flex flex-col">
                      <div className="flex justify-between items-center font-bold text-gray-400">
                        {transcript.Key.replace('.json', '')}
                        <span><DeleteNoteButton s3Client={s3Client} prefix={transcript.Key} /></span>
                      </div>
                      <div>{transcript.Content}</div>
                    </div>
                  </div>
                ))}
              </div>
            }

            {transcriptList && pageCount * pageSize < transcriptList.length &&
              <button onClick={() => setPageCount(pageCount + 1)}
                className={`w-full py-6 bg-white-100 hover:bg-white-200 focus:bg-white-300 border border-white-600 text-4xl`}>
                More
              </button>}
          </div>
        </>}
      </main>
    </>
  )
}
