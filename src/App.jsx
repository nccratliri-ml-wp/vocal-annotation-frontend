import {useState, useRef, useEffect} from 'react'
import './App.css'
import Visuals from "./Visuals.jsx"

function App() {
    const [audioLength, setAudioLength] = useState()
    const audioFile = useRef(null)

    const spectrogramImg = new Image()
    spectrogramImg.src = '/test-media/birdname_130519_113316.31.png'

    function handleAudioLoaded(event){
        setAudioLength(event.target.duration)
    }

    return (
    <>
        <div id='upload-container'>
            Mock Up Backend Branch
        </div>
        <audio src="test-media/birdname_130519_113316.31.wav" preload="metadata" ref={audioFile} onLoadedMetadata={handleAudioLoaded}></audio>
            <Visuals
                audioFile={audioFile.current}
                audioLength={audioLength}
                spectrogramImg={spectrogramImg}
            />
    </>
    )
}

export default App
