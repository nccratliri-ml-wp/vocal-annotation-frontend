import React, {useState, useRef, useEffect} from 'react'
import Clusternames from "./Clusternames.jsx"
import CSVReader from "./CSVReader.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import Searchbar from "./Searchbar.jsx"
import SpecType from "./SpecType.jsx";

const SCROLL_STEP_RATIO = 0.1

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


    // General
    const [globalAudioDuration, setGlobalAudioDuration] = useState(0);
    const [globalClipDuration, setGlobalClipDuration] = useState(0)
    const [currentStartTime, setCurrentStartTime] = useState(0);
    const [currentEndTime, setCurrentEndTime] = useState(0);
    const [maxScrollTime, setMaxScrollTime] = useState(0);
    const [scrollStep, setScrollStep] = useState(0);



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
        //const newTrackDurations = trackDurations.filter( trackDuration => trackDuration !== previousTrackDuration)
        //setTrackDurations( newTrackDurations )
        const indexToRemove = trackDurations.indexOf(previousTrackDuration)

        if (indexToRemove === -1) return

        const newTrackDurations = [...trackDurations]
        newTrackDurations.splice(indexToRemove, 1)
        setTrackDurations(newTrackDurations)
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
    }

    function removeTrackInApp( trackID ){
        setShowTracks({
            ...showTracks,
            [trackID]: false
        })
    }


    /* ++++++++++++++++++ Controls ++++++++++++++++++ */


    function passClipDurationToApp( newClipDuration ){
        setGlobalClipDuration( newClipDuration )
    }

    function passCurrentStartTimeToApp( newCurrentStartTime ){
        setCurrentStartTime( newCurrentStartTime )
    }

    function passCurrentEndTimeToApp( newCurrentEndTime ){
        setCurrentEndTime( newCurrentEndTime )
    }

    function passMaxScrollTimeToApp( newMaxScrollTime ){
        setMaxScrollTime( newMaxScrollTime )
    }

    function passScrollStepToApp( newScrollStep ){
        setScrollStep( newScrollStep )
    }

    function onZoomIn (){
        const newDuration = Math.max(globalClipDuration / 2, 0.1);
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0);
        setGlobalClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration * SCROLL_STEP_RATIO);
        setCurrentEndTime( currentStartTime + newDuration );
    }

    function onZoomOut (){
        const newDuration = Math.min(globalClipDuration * 2, globalAudioDuration);
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0);
        const newStartTime = Math.min( Math.max(  globalAudioDuration - newDuration, 0), currentStartTime);
        setGlobalClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration * SCROLL_STEP_RATIO);
        setCurrentStartTime( newStartTime );
        setCurrentEndTime( newStartTime + newDuration );
    }

    useEffect( () => {
        const newGlobalDuration = Math.max(...trackDurations) === -Infinity? 0 : Math.max(...trackDurations)
        setGlobalAudioDuration(newGlobalDuration)
    }, [trackDurations])

    return (
        <>
            {'global Clip duration: '+globalClipDuration}
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
            <button
                onClick={onZoomIn}
            >
                +🔍
            </button>
            <button
                onClick={onZoomOut}
            >
                -🔍
            </button>
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
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
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
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
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
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    passScrollStepToApp={passScrollStepToApp}
                    passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                    passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                    passClipDurationToApp={passClipDurationToApp}
                    passCurrentStartTimeToApp={passCurrentStartTimeToApp}
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