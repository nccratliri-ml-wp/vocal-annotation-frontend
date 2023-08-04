import {useState, useRef} from 'react'
import './App.css'
import Visuals from "./Visuals.jsx"
import CSVReader from "./CSVReader.jsx";
import axios from 'axios'

const formData = new FormData();

function App() {
    const [audioLength, setAudioLength] = useState()
    const audioFile = useRef(null)

    const [base64Url, setBase64Url] = useState(null)

    const [importedLabels, setImportedLabels] = useState([]);

    function passLabelsToApp(newLabels){
        setImportedLabels( newLabels )
    }

    function handleAudioLoaded(event){
        setAudioLength(event.target.duration)
    }

    function handleChangeAudioFile(event){
        formData.append("newAudioFile", event.target.files[0])

        const url = URL.createObjectURL(event.target.files[0])
        audioFile.current.setAttribute('src', url)
    }

    function handleUploadClickAudoFile(){
        axios.post(
            '/upload',
            formData)
            .then(response => {
                setBase64Url(response.data)
            })
            .catch((error) => console.log(error.response))
    }


    return (
    <>
        <div id='audio-upload-container'>
            <input type='file' onChange={handleChangeAudioFile}/>
            <button onClick={handleUploadClickAudoFile}>Upload Audio File</button>
        </div>
        <CSVReader
            passLabelsToApp={passLabelsToApp}
        />
        <audio preload="metadata" ref={audioFile} onLoadedMetadata={handleAudioLoaded}></audio>
        <Visuals
            audioFile={audioFile.current}
            audioLength={audioLength}
            base64Url={base64Url}
            importedLabels={importedLabels}
        />
    </>
    )
}

export default App
