import {useState, useRef} from 'react'

import Visuals from "./Visuals.jsx"
import CSVReader from "./CSVReader.jsx";
import Clusternames from "./Clusternames.jsx";
import AudioUpload from "./AudioUpload.jsx";

function App() {
    const audioDOMObject = useRef(null)
    const [base64Url, setBase64Url] = useState(null)
    const [importedLabels, setImportedLabels] = useState([]);
    const [importedClusternameButtons, setImportedClusternameButtons] = useState([])
    const [activeClustername, setActiveClustername] = useState()

    function passAudioDOMObjectURLToApp(url){
        audioDOMObject.current.setAttribute('src', url)
    }

    function passBase64UrlToApp(newUrl){
        setBase64Url( newUrl )
    }

    function passLabelsToApp(newLabels){
        setImportedLabels( newLabels )
    }

    function passClusterNameButtonsToApp(newClusternameButtons){
        setImportedClusternameButtons(newClusternameButtons)
    }

    function passActiveClusternameToApp(chosenClustername){
        setActiveClustername(chosenClustername)
    }


    return (
    <>
        <AudioUpload
            passAudioDOMObjectURLToApp={passAudioDOMObjectURLToApp}
            passBase64UrlToApp={passBase64UrlToApp}
        />
        <audio preload="metadata" ref={audioDOMObject}></audio>
        <CSVReader
            passLabelsToApp={passLabelsToApp}
            passClusterNameButtonsToApp={passClusterNameButtonsToApp}
        />
        <Visuals
            audioFile={audioDOMObject.current}
            base64Url={base64Url}
            importedLabels={importedLabels}
            activeClustername={activeClustername}
        />
        <Clusternames
            passActiveClusternameToApp={passActiveClusternameToApp}
            importedClusternameButtons={importedClusternameButtons}
            base64Url={base64Url}
        />
    </>
    )
}

export default App
/*
// When a new audio File was uploaded, do this:
    useEffect( () => {
        if (!base64Url){
            return
        }

        setAudioLength(audioFile.duration)

        setZoomLevel(canvasContainerRef.current.clientWidth)
        zoomLevelRef.current = canvasContainerRef.current.clientWidth

        spectrogramContextRef.current = spectrogramCanvasRef.current.getContext('2d')

        populateSpectrogramCanvas()

        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevel)

        drawTimeline(spectrogramCanvasRef.current,
            timelineCanvasRef.current,
            timelineContextRef.current,
            audioLength,
            false)

        drawPlayhead(playHeadRef.current.timeframe)
    }, [base64Url])


    // When a new CSV File was uploaded, do this:
    useEffect( () => {
            if (!base64Url){
                return
            }

            setLabels(importedLabels)
            drawAllLabels()
    }, [importedLabels])

 */