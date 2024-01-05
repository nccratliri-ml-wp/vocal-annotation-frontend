import {useState, useRef, useEffect} from 'react'
import Clusternames from "./Clusternames.jsx"
import CSVReader from "./CSVReader.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import Searchbar from "./Searchbar.jsx"
import SpecType from "./SpecType.jsx";
import {nanoid} from "nanoid";

function App() {
    const audioDOMObject = useRef(null)
    const [audioFileName, setAudioFileName] = useState(null)
    const [importedLabels, setImportedLabels] = useState([]);
    const [importedClusternameButtons, setImportedClusternameButtons] = useState([])
    const [activeClustername, setActiveClustername] = useState()
    const [specType, setSpecType] = useState('log-mel')
    const [nfft, setNfft] = useState(null)
    const [binsPerOctave, setBinsPerOctave] = useState(null)
    const [parameters, setParameters] = useState({})
    const [trackDurations, setTrackDurations] = useState([])
    const [showTracks, setShowTracks] = useState({
        track_1: true,
        track_2: false,
        track_3: false
    })
    /*
    const [tracks, setTracks] = useState([
        <ScalableSpec
            key={nanoid()}
            importedLabels={importedLabels}
            activeClustername={activeClustername}
            specType={specType}
            nfft={nfft}
            binsPerOctave={binsPerOctave}
            parameters={parameters}
            showOverviewInitialValue={true}
            longestTrackDuration={Math.max(...trackDurations)}
            trackDurations={trackDurations}
            passTrackDurationToApp={passTrackDurationToApp}
            deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
        />
    ])
    */

    function passLabelsToApp(newLabels){
        setImportedLabels( newLabels )
    }

    function passClusterNameButtonsToApp(newClusternameButtons){
        setImportedClusternameButtons( newClusternameButtons )
    }

    function passActiveClusternameToApp(chosenClustername){
        setActiveClustername( chosenClustername )
    }

    function passSpecTypeToApp(chosenSpecType){
        setSpecType( chosenSpecType )
    }

    function passNfftToApp( chosenNfft ){
        setNfft( chosenNfft )
    }

    function passBinsPerOctaveToApp ( binsPerOctave ){
        setBinsPerOctave (binsPerOctave)
    }

    function passParametersToApp (newParametersObject){
        setParameters( newParametersObject )
    }

    function passTrackDurationToApp( newTrackDuration ) {
        setTrackDurations(prevState => [...prevState, newTrackDuration])
    }

    function deletePreviousTrackDurationInApp( previousTrackDuration ) {
        const newTrackDurations = trackDurations.filter( trackDuration => trackDuration !== previousTrackDuration)
        setTrackDurations( newTrackDurations )
    }

    function addTrack(){
        const firstFalseTrack = Object.keys(showTracks).find(
            trackKey => !showTracks[trackKey]
        )

        if (!firstFalseTrack) return

        setShowTracks({
            ...showTracks,
            [firstFalseTrack]: true
        })

        /*
        setTracks(prevState => [...prevState,
            <ScalableSpec
                key={nanoid()}
                importedLabels={importedLabels}
                activeClustername={activeClustername}
                specType={specType}
                nfft={nfft}
                binsPerOctave={binsPerOctave}
                parameters={parameters}
                showOverviewInitialValue={false}
                longestTrackDuration={Math.max(...trackDurations)}
                passTrackDurationToApp={passTrackDurationToApp}
                deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
            />
        ])
         */
    }

    function removeTrackInApp( trackID ){
        setShowTracks({
            ...showTracks,
            [trackID]: false
        })
    }

    return (
        <>
            <div id='files-upload-container'>
                <Searchbar />
                <audio preload="metadata" ref={audioDOMObject}></audio>
                <CSVReader
                    passLabelsToApp={passLabelsToApp}
                    passClusterNameButtonsToApp={passClusterNameButtonsToApp}
                />
                <SpecType
                    specType={specType}
                    passSpecTypeToApp={passSpecTypeToApp}
                    passNfftToApp={passNfftToApp}
                    passBinsPerOctaveToApp={passBinsPerOctaveToApp}
                />
                {/*
                <Parameters
                    parameters={parameters}
                    passParametersToApp={passParametersToApp}
                />
                */}
            </div>
            {showTracks.track_1 &&
                <ScalableSpec
                    id='track_1'
                    importedLabels={importedLabels}
                    activeClustername={activeClustername}
                    specType={specType}
                    nfft={nfft}
                    binsPerOctave={binsPerOctave}
                    parameters={parameters}
                    showOverviewInitialValue={true}
                    longestTrackDuration={Math.max(...trackDurations)}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                />
            }
            {showTracks.track_2 &&
                <ScalableSpec
                    id='track_2'
                    importedLabels={importedLabels}
                    activeClustername={activeClustername}
                    specType={specType}
                    nfft={nfft}
                    binsPerOctave={binsPerOctave}
                    parameters={parameters}
                    showOverviewInitialValue={false}
                    longestTrackDuration={Math.max(...trackDurations)}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                />
            }
            {showTracks.track_3 &&
                <ScalableSpec
                    id='track_3'
                    importedLabels={importedLabels}
                    activeClustername={activeClustername}
                    specType={specType}
                    nfft={nfft}
                    binsPerOctave={binsPerOctave}
                    parameters={parameters}
                    showOverviewInitialValue={false}
                    longestTrackDuration={Math.max(...trackDurations)}
                    passTrackDurationToApp={passTrackDurationToApp}
                    deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                    removeTrackInApp={removeTrackInApp}
                />
            }
            <button
                onClick={addTrack}
            >
                Add Track
            </button>
            <Clusternames
                passActiveClusternameToApp={passActiveClusternameToApp}
                importedClusternameButtons={importedClusternameButtons}
                audioFileName={audioFileName}
            />

        </>
    )
}

export default App