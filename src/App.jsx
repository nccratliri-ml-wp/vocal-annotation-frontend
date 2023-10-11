import {useState, useRef} from 'react'
import Visuals from "./Visuals.jsx"
import Clusternames from "./Clusternames.jsx"
import AudioUpload from "./AudioUpload.jsx"
import CSVReader from "./CSVReader.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import Searchbar from "./Searchbar.jsx"

function App() {
    const audioDOMObject = useRef(null)
    const [response, setResponse] = useState(null)
    const [audioFileName, setAudioFileName] = useState(null)
    const [importedLabels, setImportedLabels] = useState([]);
    const [importedClusternameButtons, setImportedClusternameButtons] = useState([])
    const [activeClustername, setActiveClustername] = useState()
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    function passAudioDOMObjectURLToApp(url){
        audioDOMObject.current.setAttribute('src', url)
    }

    function passResponseToApp(newResponse){
        setResponse( newResponse )
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
            <Searchbar />
            <div id='files-upload-container'>
                <AudioUpload
                    passAudioDOMObjectURLToApp={passAudioDOMObjectURLToApp}
                    passResponseToApp={passResponseToApp}
                    passAudioFileNameToApp={passAudioFileNameToApp}
                    passSpectrogramIsLoadingToApp={passSpectrogramIsLoadingToApp}
                />
                <audio preload="metadata" ref={audioDOMObject}></audio>
                <CSVReader
                    passLabelsToApp={passLabelsToApp}
                    passClusterNameButtonsToApp={passClusterNameButtonsToApp}
                />
            </div>
            <ScalableSpec
                response={response}
                audioFileName={audioFileName}
                importedLabels={importedLabels}
                activeClustername={activeClustername}
                spectrogramIsLoading={spectrogramIsLoading}
                passSpectrogramIsLoadingToApp={passSpectrogramIsLoadingToApp}
            />
            {/*
             <Visuals
                audioFile={audioDOMObject.current}
                audioFileName={audioFileName}
                base64Url={base64Url}
                spectrogramIsLoading={spectrogramIsLoading}
                importedLabels={importedLabels}
                activeClustername={activeClustername}
            />
            */}

            <Clusternames
                passActiveClusternameToApp={passActiveClusternameToApp}
                importedClusternameButtons={importedClusternameButtons}
                audioFileName={audioFileName}
            />

        </>
    )
}

export default App