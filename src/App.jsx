import {useState, useRef} from 'react'
import Visuals from "./Visuals.jsx"
import Clusternames from "./Clusternames.jsx"
import AudioUpload from "./AudioUpload.jsx"
import CSVReader from "./CSVReader.jsx"

function App() {
    const audioDOMObject = useRef(null)
    const [specImages, setSpecImages] = useState(null)
    const [audioFileName, setAudioFileName] = useState(null)
    const [importedLabels, setImportedLabels] = useState([]);
    const [importedClusternameButtons, setImportedClusternameButtons] = useState([])
    const [activeClustername, setActiveClustername] = useState()
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    function passAudioDOMObjectURLToApp(url){
        audioDOMObject.current.setAttribute('src', url)
    }

    function passSpecImagesToApp(newDictionary){
        setSpecImages( newDictionary )
    }

    function passAudioFileNameToApp(newAudioFileName){
        setAudioFileName( newAudioFileName )
    }

    function passLabelsToApp(newLabels){
        setImportedLabels( newLabels )
    }

    function passClusterNameButtonsToApp(newClusternameButtons){
        setImportedClusternameButtons( newClusternameButtons )
    }

    function passActiveClusternameToApp(chosenClustername){
        setActiveClustername( chosenClustername )
    }

    function passSpectrogramIsLoadingToApp(boolean){
        setSpectrogramIsLoading( boolean )
    }


    return (
    <>
        <div id='files-upload-container'>
            <AudioUpload
                passAudioDOMObjectURLToApp={passAudioDOMObjectURLToApp}
                passSpecImagesToApp={passSpecImagesToApp}
                passAudioFileNameToApp={passAudioFileNameToApp}
                passSpectrogramIsLoadingToApp={passSpectrogramIsLoadingToApp}
            />
            <audio preload="metadata" ref={audioDOMObject}></audio>
            <CSVReader
                passLabelsToApp={passLabelsToApp}
                passClusterNameButtonsToApp={passClusterNameButtonsToApp}
            />
        </div>
        <Visuals
            audioFile={audioDOMObject.current}
            audioFileName={audioFileName}
            specImages={specImages}
            spectrogramIsLoading={spectrogramIsLoading}
            importedLabels={importedLabels}
            activeClustername={activeClustername}
        />
        <Clusternames
            passActiveClusternameToApp={passActiveClusternameToApp}
            importedClusternameButtons={importedClusternameButtons}
            specImages={specImages}
        />
    </>
    )
}

export default App
