import {useState, useRef} from 'react'
import Visuals from "./Visuals.jsx"
import Clusternames from "./Clusternames.jsx"
import AudioUpload from "./AudioUpload.jsx"
import CSVReader from "./CSVReader.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import { ReactSearchAutocomplete } from 'react-search-autocomplete'

function App() {
    const audioDOMObject = useRef(null)
    const [base64Url, setBase64Url] = useState(null)
    const [audioFileName, setAudioFileName] = useState(null)
    const [importedLabels, setImportedLabels] = useState([]);
    const [importedClusternameButtons, setImportedClusternameButtons] = useState([])
    const [activeClustername, setActiveClustername] = useState()
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    function passAudioDOMObjectURLToApp(url){
        audioDOMObject.current.setAttribute('src', url)
    }

    function passBase64UrlToApp(newUrl){
        setBase64Url( newUrl )
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

    // Search bar

    const items = [
        {
            id: 0,
            name: "Accipiter castanilius"
        },
        {
            id: 1,
            name: "Accipiter gentilis"
        },
        {
            id: 2,
            name: "Accipiter nisus"
        },
        {
            id: 3,
            name: "Aceros corrugatus"
        },
        {
            id: 4,
            name: "Acherontia atropos"
        },
        {
            id: 5,
            name: "Acheta domesticus"
        },
        {
            id: 6,
            name: "Acheta spec."
        },
        {
            id: 7,
            name: "Accipiter brevipes"
        },
        {
            id: 8,
            name: "Acinonyx jubatus"
        },
        {
            id: 9,
            name: "Acridotheres burmannicus"
        },
    ]


    const handleOnSearch = (string, results) => {
        // onSearch will have as the first callback parameter
        // the string searched and for the second the results.
        //console.log(string, results)
    }

    const handleOnHover = (result) => {
        // the item hovered
        //console.log(result)
    }

    const handleOnSelect = (item) => {
        // the item selected
        //console.log(item.name)
    }

    const handleOnFocus = () => {
        //console.log('Focused')
    }

    const formatResult = (item) => {
        return (
            <>
                <span style={{ display: 'block', textAlign: 'left' }}>{item.name}</span>
            </>
        )
    }


    return (
        <>
            <div id='files-upload-container'>
                <AudioUpload
                    passAudioDOMObjectURLToApp={passAudioDOMObjectURLToApp}
                    passBase64UrlToApp={passBase64UrlToApp}
                    passAudioFileNameToApp={passAudioFileNameToApp}
                    passSpectrogramIsLoadingToApp={passSpectrogramIsLoadingToApp}
                />
                <audio preload="metadata" ref={audioDOMObject}></audio>
                <CSVReader
                    passLabelsToApp={passLabelsToApp}
                    passClusterNameButtonsToApp={passClusterNameButtonsToApp}
                />
            </div>
            <div style={{ width: 500}}>
                <ReactSearchAutocomplete
                    items={items}
                    onSearch={handleOnSearch}
                    onHover={handleOnHover}
                    onSelect={handleOnSelect}
                    onFocus={handleOnFocus}
                    autoFocus
                    formatResult={formatResult}
                    placeholder='Search species...'
                />
            </div>
            <ScalableSpec>
            </ScalableSpec>
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
                base64Url={base64Url}
            />

        </>
    )
}

export default App