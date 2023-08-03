import {useState, useRef} from 'react'
import './App.css'
import Visuals from "./Visuals.jsx"
import axios from 'axios'

const formData = new FormData();

function App() {
    const [audioLength, setAudioLength] = useState()
    const audioFile = useRef(null)

    const [base64Url, setBase64Url] = useState(null)

    function handleAudioLoaded(event){
        setAudioLength(event.target.duration)
    }

    function handleChange(event){
        formData.append("newAudioFile", event.target.files[0])

        const url = URL.createObjectURL(event.target.files[0])
        audioFile.current.setAttribute('src', url)
    }

    function handleUploadClick(){
        axios.post(
            '/upload',
            formData)
            .then(response => {
                console.log(response.data)
                setBase64Url(response.data)
            })
            .catch((error) => console.log(error.response))
    }

    return (
    <>
        <div id='upload-container'>
            <input type='file' onChange={handleChange}/>
            <button onClick={handleUploadClick}>Upload</button>
        </div>
        <audio preload="metadata" ref={audioFile} onLoadedMetadata={handleAudioLoaded}></audio>
            <Visuals
                audioFile={audioFile.current}
                audioLength={audioLength}
                base64Url={base64Url}
            />
    </>
    )
}

export default App
