import { useState } from 'react'
import './App.css'
import Visuals from "./Visuals.jsx"


function App() {

    const [audioLength, setAudioLength] = useState()
    const spectrogramImg = new Image()
    spectrogramImg.src = 'test-media/birdname_130519_113316.31.png'

    function handleAudioLoaded(event){
        setAudioLength(event.target.duration)
    }

    return (
    <>
        <h1>Witaj</h1>
        <audio src="test-media/birdname_130519_113316.31.wav" preload="metadata" onLoadedMetadata={handleAudioLoaded}></audio>
            <Visuals
                audioLength={audioLength}
                spectrogramImg={spectrogramImg}
            />


    </>
    )
}

export default App
