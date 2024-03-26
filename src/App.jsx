import React, {useState, useEffect} from 'react'
import Clusternames from "./Clusternames.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import Individuals from "./Indivduals";
import GlobalConfig from "./GlobalConfig.jsx";

const SCROLL_STEP_RATIO = 0.1

class ClusternameButton {
    constructor(id, clustername, isActive, color) {
        this.id = id
        this.clustername = clustername
        this.isActive = isActive
        this.color = color
        this.showColorwheel = false
    }
}

function App() {
    const [importedLabels, setImportedLabels] = useState([]);
    const [clusternameButtons, setClusternameButtons] = useState(
        [
            new ClusternameButton('PROTECTED_AREA', 'Protected Area🔒', false, 'green'),
            new ClusternameButton('DEFAULT_BUTTON', 'Default tag', true, '#47ff14')
        ])
    const [outdatedClustername, setOutdatedClustername] = useState(null)

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
    const [globalAudioDuration, setGlobalAudioDuration] = useState(null)
    const [globalClipDuration, setGlobalClipDuration] = useState(null)
    const [currentStartTime, setCurrentStartTime] = useState(0)
    const [currentEndTime, setCurrentEndTime] = useState(0)
    const [maxScrollTime, setMaxScrollTime] = useState(0)
    const [scrollStep, setScrollStep] = useState(0)

    const [activeLabel, setActiveLabel] = useState(null)

    const [activeIndividual, setActiveIndividual] = useState(1);
    const [numberOfIndividuals, setNumberOfIndividuals] = useState(1)

    const [globalHopLength, setGlobalHopLength] = useState(0)
    const [globalNumSpecColumns, setGlobalNumSpecColumns] = useState(0)
    const [globalSamplingRate, setGlobalSamplingRate] = useState(0)
    const [defaultConfig, setDefaultConfig] = useState(null)

    /* 1. DONE: destructure config.configurations object into globalStates here and local states in ScalableSpec
       1.1 DONE: handle NAN error in Parameters when user deletes a value in the input field
    *  2. DONE: Adjust the code and methods to work as before
        2.1 DONE: Fix Zoom Out
        2.3 DONE: Fix OverviewBar zoom
        2.4 DONE: Fix Multi track (max hop Length). Possible remove longestAudioDuration or max hop length?
    *  3. DONE: Adjust Upload by URL method
    *  4. DONE: Adjust all instances of ScalableSpec
        4.1 DONE: Remove parameters from the dependency array in scalable spec
        4.2 Move configruations to a new window
        4.3 DONE: Remove config state everywhere
        4.4 DONE: Fixed curved Line
        4.5 DONE: Delete labels upon new file upload
    *  5. DONE: Perhaps refactor Paramters? To hold n_fft, bin_per_octave etc. in state variables in ScalabeSpec instead of as a single Parameters state
    * */

    function passGlobalHopLengthToApp( newHopLength ){
        setGlobalHopLength( newHopLength )
    }

    function passGlobalNumSpecColumns( newNumSpecColumns ){
        setGlobalNumSpecColumns( newNumSpecColumns )
    }

    function passGlobalSamplingRate( newSamplingRate ){
        setGlobalSamplingRate( newSamplingRate )
    }

    function passDefaultConfigToApp( newDefaultConfig ){
        setDefaultConfig( newDefaultConfig )
    }

    /* ++++++++++++++++++ Pass methods ++++++++++++++++++ */

    function passClusterNameButtonsToApp( newClusternameButtons ){
        setClusternameButtons( newClusternameButtons )
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

    function passActiveLabelToApp( newActiveLabel ){
        setActiveLabel( newActiveLabel )
    }

    function passActiveIndividualToApp( newActiveIndividual ){
        setActiveIndividual( newActiveIndividual )
    }

    function passNumberOfIndividualsToApp( newNumber ){
        setNumberOfIndividuals( newNumber )
    }
    
    function passOutdatedClusterNamesToApp( clustername ){
        setOutdatedClustername( clustername )
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
        setDefaultConfig(null) // This is not great, but it prevents stale Default config from prevailing after a track is deleted. Ideally this would replaced by the config of another
    }


    /* ++++++++++++++++++ Controls ++++++++++++++++++ */

    function onZoomIn(){
        const newHopLength =  Math.max( Math.floor(globalHopLength / 2), 1)
        const newDuration = newHopLength / globalSamplingRate * globalNumSpecColumns
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = Math.min( newMaxScrollTime, currentStartTime)
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime)
    }

    function onZoomOut(){
        const currentMaxHopLength = Math.floor( (globalAudioDuration * globalSamplingRate) / globalNumSpecColumns )
        const newHopLength = globalHopLength * 2 / globalSamplingRate * globalNumSpecColumns > globalAudioDuration? currentMaxHopLength : globalHopLength * 2
        const newDuration = newHopLength / globalSamplingRate * globalNumSpecColumns
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = Math.min( newMaxScrollTime, currentStartTime)
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime , newEndTime)
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

    function updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime){
        setGlobalHopLength(newHopLength)
        setGlobalClipDuration(newDuration)
        setMaxScrollTime(newMaxScrollTime)
        setCurrentStartTime( newStartTime )
        setCurrentEndTime(newEndTime)
        setScrollStep( newDuration * SCROLL_STEP_RATIO )
    }


    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    useEffect( () => {
        if (trackDurations.length === 0) return

        const newGlobalDuration = Math.max(...trackDurations) === -Infinity ? 0 : Math.max(...trackDurations)
        //const newHopLength = Math.floor( (newGlobalDuration * globalSamplingRate) / globalNumSpecColumns )

        setGlobalAudioDuration(newGlobalDuration)
        //setGlobalHopLength(newHopLength)

    }, [trackDurations])

    return (
        <>
            <Individuals
                activeIndividual={activeIndividual}
                passActiveIndividualToApp={passActiveIndividualToApp}
                passNumberOfIndividualsToApp={passNumberOfIndividualsToApp}
            />
            <Clusternames
                passClusterNameButtonsToApp={passClusterNameButtonsToApp}
                clusternameButtons={clusternameButtons}
                passOutdatedClusterNamesToApp={passOutdatedClusterNamesToApp}
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
            <div
                id='blank-space'
            >
            </div>
            <div
                id='all-tracks'
                onMouseLeave={ () => setActiveLabel(null)}
            >
            <GlobalConfig
                globalAudioDuration={globalAudioDuration}
                currentStartTime={currentStartTime}
                updateClipDurationAndTimes={updateClipDurationAndTimes}
                globalHopLength={globalHopLength}
                globalNumSpecColumns={globalNumSpecColumns}
                globalSamplingRate={globalSamplingRate}
                passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                passGlobalSamplingRate={passGlobalSamplingRate}
                defaultConfig={defaultConfig}
            />
            {showTracks.track_1 &&
                <ScalableSpec
                    id='track_1'
                    trackDurations={trackDurations}
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_2 &&
                <ScalableSpec
                    id='track_2'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_3 &&
                <ScalableSpec
                    id='track_3'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_4 &&
                <ScalableSpec
                    id='track_4'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_5 &&
                <ScalableSpec
                    id='track_5'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_6 &&
                <ScalableSpec
                    id='track_6'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_7 &&
                <ScalableSpec
                    id='track_7'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_8 &&
                <ScalableSpec
                    id='track_8'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_9 &&
                <ScalableSpec
                    id='track_9'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_10 &&
                <ScalableSpec
                    id='track_10'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_11 &&
                <ScalableSpec
                    id='track_11'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_12 &&
                <ScalableSpec
                    id='track_12'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_13 &&
                <ScalableSpec
                    id='track_13'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_14 &&
                <ScalableSpec
                    id='track_14'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_15 &&
                <ScalableSpec
                    id='track_15'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_16 &&
                <ScalableSpec
                    id='track_16'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_17 &&
                <ScalableSpec
                    id='track_17'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_18 &&
                <ScalableSpec
                    id='track_18'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_19 &&
                <ScalableSpec
                    id='track_19'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            {showTracks.track_20 &&
                <ScalableSpec
                    id='track_20'
                    clusternameButtons={clusternameButtons}
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
                    passActiveLabelToApp={passActiveLabelToApp}
                    activeLabel={activeLabel}
                    activeIndividual={activeIndividual}
                    numberOfIndividuals={numberOfIndividuals}
                    outdatedClustername={outdatedClustername}
                    globalHopLength={globalHopLength}
                    globalNumSpecColumns={globalNumSpecColumns}
                    globalSamplingRate={globalSamplingRate}
                    passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                    passGlobalNumSpecColumns={passGlobalNumSpecColumns}
                    passGlobalSamplingRate={passGlobalSamplingRate}
                    updateClipDurationAndTimes={updateClipDurationAndTimes}
                    passDefaultConfigToApp={passDefaultConfigToApp}
                />
            }
            <button
                onClick={addTrack}
            >
                Add Track
            </button>
            </div>
        </>
    )
}

export default App