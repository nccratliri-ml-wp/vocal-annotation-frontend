import React, {useState, useRef, useEffect} from 'react'
import Clusternames from "./Clusternames.jsx"
import CSVReader from "./CSVReader.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import Searchbar from "./Searchbar.jsx"
import SpecType from "./SpecType.jsx";

const SCROLL_STEP_RATIO = 0.1

function App() {
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
        track_3: false,
        track_4: false,
        track_5: false,
        track_6: false,
        track_7: false,
        track_8: false,
        track_9: false,
        track_10: false,
        track_11: false,
        track_12: false,
        track_13: false,
        track_14: false,
        track_15: false,
        track_16: false,
        track_17: false,
        track_18: false,
        track_19: false,
        track_20: false,
    })


    // General
    const [globalAudioDuration, setGlobalAudioDuration] = useState(0);
    const [globalClipDuration, setGlobalClipDuration] = useState(0)
    const [currentStartTime, setCurrentStartTime] = useState(0);
    const [currentEndTime, setCurrentEndTime] = useState(0);
    const [maxScrollTime, setMaxScrollTime] = useState(0);
    const [scrollStep, setScrollStep] = useState(0);
    const [newOverviewSpecNeeded, setNewOverviewSpecNeeded] = useState(true)


    /* ++++++++++++++++++ Pass methods ++++++++++++++++++ */

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

    function passNewOverviewSpecNeededToApp( boolean ){
        setNewOverviewSpecNeeded( boolean )
    }

    /* ++++++++++++++++++ Audio Tracks ++++++++++++++++++ */

    function deletePreviousTrackDurationInApp( previousTrackDuration ) {
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

    function onZoomIn(){
        const newDuration = Math.max(globalClipDuration / 2, 0.1);
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0);
        setGlobalClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration * SCROLL_STEP_RATIO);
        setCurrentEndTime( currentStartTime + newDuration );
    }

    function onZoomOut(){
        const newDuration = Math.min(globalClipDuration * 2, globalAudioDuration);
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0);
        const newStartTime = Math.min( Math.max(  globalAudioDuration - newDuration, 0), currentStartTime);
        setGlobalClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration * SCROLL_STEP_RATIO);
        setCurrentStartTime( newStartTime );
        setCurrentEndTime( newStartTime + newDuration );
    }

    function leftScroll() {
        setCurrentStartTime(
            prevStartTime => Math.max(prevStartTime - scrollStep, 0)
        )
        setCurrentEndTime(
            prevEndTime => Math.max(prevEndTime - scrollStep, globalClipDuration)
        )
    }

    function rightScroll() {
        setCurrentStartTime(
            prevStartTime => Math.min(prevStartTime + scrollStep, maxScrollTime)
        )
        setCurrentEndTime(
            prevEndTime => Math.min(prevEndTime + scrollStep, globalAudioDuration)
        )
    }

    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    useEffect( () => {
        const newGlobalDuration = Math.max(...trackDurations) === -Infinity? 0 : Math.max(...trackDurations)
        setGlobalAudioDuration(newGlobalDuration)
    }, [trackDurations])


    return (
        <>
            <Clusternames
                passActiveClusternameToApp={passActiveClusternameToApp}
                importedClusternameButtons={importedClusternameButtons}
                audioFileName={audioFileName}
            />
            <div className='controls-container'>
                <button
                    id='left-scroll-btn'
                    onClick={leftScroll}
                />
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
                <button
                    id='right-scroll-btn'
                    onClick={rightScroll}
                />
            </div>
            {showTracks.track_1 &&
                <ScalableSpec
                    id='track_1'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={true}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_4 &&
                <ScalableSpec
                    id='track_4'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_5 &&
                <ScalableSpec
                    id='track_5'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_6 &&
                <ScalableSpec
                    id='track_6'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_7 &&
                <ScalableSpec
                    id='track_7'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_8 &&
                <ScalableSpec
                    id='track_8'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_9 &&
                <ScalableSpec
                    id='track_9'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_10 &&
                <ScalableSpec
                    id='track_10'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_11 &&
                <ScalableSpec
                    id='track_11'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_12 &&
                <ScalableSpec
                    id='track_12'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_13 &&
                <ScalableSpec
                    id='track_13'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_14 &&
                <ScalableSpec
                    id='track_14'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_15 &&
                <ScalableSpec
                    id='track_15'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_16 &&
                <ScalableSpec
                    id='track_16'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_17 &&
                <ScalableSpec
                    id='track_17'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_18 &&
                <ScalableSpec
                    id='track_18'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_19 &&
                <ScalableSpec
                    id='track_19'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
            {showTracks.track_20 &&
                <ScalableSpec
                    id='track_20'
                    activeClustername={activeClustername}
                    showOverviewInitialValue={false}
                    globalAudioDuration={globalAudioDuration}
                    globalClipDuration={globalClipDuration}
                    currentStartTime={currentStartTime}
                    currentEndTime={currentEndTime}
                    maxScrollTime={maxScrollTime}
                    scrollStep={scrollStep}
                    SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                    newOverviewSpecNeeded={newOverviewSpecNeeded}
                    passNewOverviewSpecNeededToApp={passNewOverviewSpecNeededToApp}
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
        </>
    )
}

export default App