import React, {useCallback, useEffect, useRef, useState} from 'react'
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import SettingsIcon from '@mui/icons-material/Settings';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ScalableSpec from "./ScalableSpec.jsx";
import GlobalConfig from "./GlobalConfig.jsx";
import AnnotationLabels from "./AnnotationLabels.jsx";
import {
    ANNOTATED_AREA,
    ANNOTATED_AREA_CLUSTERNAME,
    ANNOTATED_AREA_COLOR,
    ANNOTATED_AREA_INDIVIDUAL,
    Clustername,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    dummyData,
    Individual,
    Species,
    UNKNOWN_CLUSTERNAME,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_SPECIES,
    createSpeciesFromImportedLabels
} from './species.js'
import {globalControlsBtn, globalControlsBtnDisabled, icon, iconBtn, iconBtnDisabled} from "./styles.js"
import {nanoid} from "nanoid";
import ZoomInIcon from "@mui/icons-material/ZoomIn.js";
import ZoomOutIcon from "@mui/icons-material/ZoomOut.js";
import DoneAllIcon from '@mui/icons-material/DoneAll';
import axios from "axios";
import Export from "./Export.jsx";
import ImportCSV from "./ImportCSV.jsx";
import LoadingCircle from './LoadingCircle.jsx';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Global Variables
const SCROLL_STEP_RATIO = 0.1

function App() {
    const [importedLabels, setImportedLabels] = useState(null)

    const [speciesArray, setSpeciesArray] = useState(() => {
        const annotatedAreaIndividual = new Individual(nanoid(), ANNOTATED_AREA_INDIVIDUAL)
        const annotatedAreaClustername = new Clustername(nanoid(), ANNOTATED_AREA_CLUSTERNAME, ANNOTATED_AREA_COLOR)
        annotatedAreaIndividual.isActive = false
        annotatedAreaClustername.isActive = false
        const annotatedAreaLabel = new Species(nanoid(), ANNOTATED_AREA, [annotatedAreaIndividual],  [annotatedAreaClustername])

        const newIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL)
        const newClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
        const newSpecies = new Species(nanoid(),UNKNOWN_SPECIES, [newIndividual], [newClustername] )

        return [newSpecies, annotatedAreaLabel]
    })

    const [deletedItemID, setDeletedItemID] = useState(null)
    
    const [tracks, setTracks] = useState([
        {
            trackID: nanoid(),
            trackIndex: 0,
            channelIndex: null,
            visible: true,
            showOverviewBarAndTimeAxis: true,
            audioID: null,
            filename: null,
            audioDuration: null,
            frequencies: null,
            spectrogram: null,
        }
    ])
    const tracksRef = useRef(tracks);

    // General
    const [globalAudioDuration, setGlobalAudioDuration] = useState(null)
    const [globalClipDuration, setGlobalClipDuration] = useState(null)
    const [currentStartTime, setCurrentStartTime] = useState(0)
    const [currentEndTime, setCurrentEndTime] = useState(0)
    const [maxScrollTime, setMaxScrollTime] = useState(0)
    const [scrollStep, setScrollStep] = useState(0)

    const [globalHopLength, setGlobalHopLength] = useState('')
    const [globalNumSpecColumns, setGlobalNumSpecColumns] = useState('')
    const [globalSamplingRate, setGlobalSamplingRate] = useState('')
    const [defaultConfig, setDefaultConfig] = useState(null)
    const [showGlobalConfigWindow, setShowGlobalConfigWindow] = useState(false)

    const [strictMode, setStrictMode] = useState(false)

    const [activeLabel, setActiveLabel] = useState(null)

    const [allLabels, setAllLabels] = useState([])
    const [exportRequest, setExportRequest] = useState(false)
    const [submitRequest, setSubmitRequest] = useState(false)
    const [annotationInstance, setAnnotationInstance] = useState(null)

    const [filesUploading, setFilesUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [tokenInference, setTokenInference] = useState('')
    const [tokenFinetune, setTokenFinetune] = useState('')

    const [leftArrowKeyPressed, setLeftArrowKeyPressed] = useState(false)
    const [rightArrowKeyPressed, setRightArrowKeyPressed] = useState(false)

    /* ++++++++++++++++++ Pass methods ++++++++++++++++++ */

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

    function passSpeciesArrayToApp ( newSpeciesArray ){
        setSpeciesArray( newSpeciesArray )
    }

    function passGlobalNumSpecColumnsToApp( newNumSpecColumns ){
        setGlobalNumSpecColumns( newNumSpecColumns )
    }

    function passGlobalSamplingRateToApp( newSamplingRate ){
        setGlobalSamplingRate( newSamplingRate )
    }

    function passShowGlobalConfigWindowToApp ( boolean ){
        setShowGlobalConfigWindow( boolean )
    }

    function passDeletedItemIDToApp( newDeletedItemID ){
        setDeletedItemID( newDeletedItemID )
    }

    function passActiveLabelToApp( newActiveLabel ){
        setActiveLabel( newActiveLabel )
    }

    function addLabelsToApp( newLabels ) {
        setAllLabels(previousLabels => [...previousLabels, ...newLabels])
    }

    function deleteAllLabelsInApp() {
        setAllLabels([])
    }

    function passExportRequestToApp( boolean ){
        setExportRequest( boolean )
    }

    function passImportedLabelsToApp( newImportedLabels ){
        setImportedLabels( newImportedLabels )
    }

    function passFilesUploadingToApp( boolean ){
        setFilesUploading( boolean )
    }

    const passTokenInferenceToWhisperSeg = (newToken) => {
        setTokenInference( newToken )
    }

    const passTokenFinetuneToWhisperSeg = (newToken) => {
        setTokenFinetune( newToken )
    }

    /* ++++++++++++++++++ Audio Tracks ++++++++++++++++++ */
    
    function addTrack(){
        const updatedTracks = tracks.map(track => track)
        const newIndex = updatedTracks.length
        updatedTracks.push(
            {
                trackID: nanoid(),
                trackIndex: newIndex,
                channelIndex: null,
                visible: true,
                showOverviewBarAndTimeAxis: false,
                audioID: null,
                filename: null,
                audioDuration: null,
                frequencies: null,
                spectrogram: null
            }
        )

        setTracks(updatedTracks)
    }

    function removeTrackInApp( trackID ){
        let updatedTracks = tracks.filter(track => track.trackID !== trackID)
        updatedTracks = updatedTracks.map( (track, index) => {
            return {
                ...track,
                trackIndex: index
            }
        })
        setTracks(updatedTracks)

        setDefaultConfig(null) // This is not great, but it prevents stale Default config from prevailing after a track is deleted. Ideally this would be replaced by the config of another
    }

    function toggleTrackVisibility( trackID ){
        const updatedTracks = tracks.map( track => {
            if (track.trackID === trackID){
                return {
                    ...track,
                    visible: !track.visible
                }
            }
            return track
        })

        setTracks(updatedTracks)
    }

    function moveTrackUp( clickedTrackID ){
        const clickedTrack = tracks.find(track => track.trackID === clickedTrackID)

        if (clickedTrack.trackIndex < 1) return

        const newIndexClickedTrack = clickedTrack.trackIndex - 1

        // Remove clicked track from tracks Array
        let updatedTracks = tracks.filter(track => track.trackID !== clickedTrackID)

        // Reinsert the clicked track at the new index
        updatedTracks.splice(newIndexClickedTrack, 0, clickedTrack);

        // Update trackIndex for all tracks
        updatedTracks = updatedTracks.map( (track, index) => {
            return {
                ...track,
                trackIndex: index,
                showOverviewBarAndTimeAxis: index === 0
            }
        })

        setTracks(updatedTracks)

    }

    function moveTrackDown( clickedTrackID ){
        const clickedTrack = tracks.find(track => track.trackID === clickedTrackID)

        if (clickedTrack.trackIndex >= tracks.length - 1) return

        const newIndexClickedTrack = clickedTrack.trackIndex + 1

        // Remove clicked track from tracks Array
        let updatedTracks = tracks.filter(track => track.trackID !== clickedTrackID)

        // Reinsert the clicked track at the new index
        updatedTracks.splice(newIndexClickedTrack, 0, clickedTrack);

        // Update trackIndex for all tracks
        updatedTracks = updatedTracks.map( (track, index) => {
            return {
                ...track,
                trackIndex: index,
                showOverviewBarAndTimeAxis: index === 0
            }
        })

        setTracks(updatedTracks)
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

    /*
    function leftScroll() {
        setCurrentStartTime(
            prevStartTime => Math.max(prevStartTime - scrollStep, 0)
        )
        setCurrentEndTime(
            prevEndTime => Math.max(prevEndTime - scrollStep, globalClipDuration)
        )
    }*/

    const leftScroll = useCallback(() => {
        setCurrentStartTime(prevStartTime => Math.max(prevStartTime - scrollStep, 0));
        setCurrentEndTime(prevEndTime => Math.max(prevEndTime - scrollStep, globalClipDuration));
    }, [scrollStep, globalClipDuration]);

    const rightScroll = useCallback(() => {
        setCurrentStartTime(
            prevStartTime => Math.min(prevStartTime + scrollStep, maxScrollTime)
        )
        setCurrentEndTime(
            prevEndTime => Math.min(prevEndTime + scrollStep, globalAudioDuration)
        )
    }, [scrollStep, maxScrollTime, globalAudioDuration])

    function updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime){
        setGlobalHopLength(newHopLength)
        setGlobalClipDuration(newDuration)
        setMaxScrollTime(newMaxScrollTime)
        setCurrentStartTime( newStartTime )
        setCurrentEndTime(newEndTime)
        setScrollStep( newDuration * SCROLL_STEP_RATIO )
    }

    function handleClickSubmitBtn(){
        setSubmitRequest(true)
    }

    async function submitAllAnnotations(){
        if (!allLabels.length) {
            toast.error('There are currently no annotations. Add some and try again.')
            return
        }

        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'post-annotations'

        // Only keep properties that are relevant for the backend
        const modifiedLabels = allLabels.map(labelObj => {
            return {
                onset: labelObj.onset,
                offset: labelObj.offset,
                species: labelObj.species,
                individual: labelObj.individual,
                clustername: labelObj.clustername,
                filename: labelObj.filename,
                annotation_instance: annotationInstance
            }
        })

        const requestParameters = {
            annotations: modifiedLabels
        }

        console.log(requestParameters)

        const headers = {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        }

        try {
            await axios.post(path, requestParameters, { headers } )
            toast.success('Annotations submitted successfully!')
        } catch (error) {
            toast.error('Something went wrong trying to submit the annotations. Check the console for more information.')
            console.log(error)
        }

    }

    /* ++++++++++++++++++ File Upload ++++++++++++++++++ */

    const uploadFileByURL = async (audioPayload) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload-by-url'
        const requestParameters = {
            audio_url: audioPayload.url,
            hop_length: audioPayload.hop_length,
            num_spec_columns: audioPayload.num_spec_columns,
            sampling_rate: audioPayload.sampling_rate,
            spec_cal_method: audioPayload.spec_cal_method,
            n_fft: audioPayload.nfft,
            bins_per_octave: audioPayload.bins_per_octave,
            min_frequency: audioPayload.f_low,
            max_frequency: audioPayload.f_high
        }

        try {
            return await axios.post(path, requestParameters)
        } catch (error){
            setFilesUploading(false)
            console.error("Error uploading file:", error)
            toast.error('Error while uploading. Check the console for more information.')
        }
    }

    const processAudioFilesSequentially = async (audioFilesArray) => {
        console.log('processAudioFilesSequentially')
        const loadingProgressStep = 100 / audioFilesArray.length;

        setFilesUploading(true)
        setUploadProgress(0)

        const allResponses = []
        let cumulativeProgress = 0

        for (let audioPayload of audioFilesArray) {
            const newResponse = await uploadFileByURL(audioPayload)
            allResponses.push({...newResponse, filename: audioPayload.filename})

            cumulativeProgress += loadingProgressStep
            setUploadProgress(cumulativeProgress)
        }

        handleURLUploadResponses(allResponses)
    }

    const handleUploadResponse = (newResponse, filename, clickedTrackID) => {
        const newChannels = newResponse.data.channels
        let channelIndex = 0

        let updatedTracks = tracks.reduce((acc, track) => {
            // Skip tracks before the clicked track (=return them unchanged)
            if (track.trackID !== clickedTrackID) {
                acc.push(track)
                return acc
            }

            // Update the clicked track with the first channel's data
            acc.push({
                ...track,
                channelIndex: channelIndex,
                audioID: newChannels[channelIndex].audio_id,
                filename: filename,
                audioDuration: newChannels[channelIndex].audio_duration,
                frequencies: newChannels[channelIndex].freqs,
                spectrogram: newChannels[channelIndex].spec,
            })
            channelIndex++

            // Create additional tracks for remaining channels
            while (channelIndex < newChannels.length) {
                acc.push({
                    trackID: nanoid(),
                    trackIndex: null,
                    channelIndex: channelIndex,
                    visible: true,
                    showOverviewBarAndTimeAxis: false,
                    audioID: newChannels[channelIndex].audio_id,
                    filename: filename,
                    audioDuration: newChannels[channelIndex].audio_duration,
                    frequencies: newChannels[channelIndex].freqs,
                    spectrogram: newChannels[channelIndex].spec,
                })
                channelIndex++
            }

            return acc
        }, [])

        // Assign tracks the correct index
        updatedTracks = updatedTracks.map( (track, index) => {
            return {
                ...track,
                trackIndex: index,
                showOverviewBarAndTimeAxis: index === 0
            }
        })

        setTracks(updatedTracks)

        // Update Global Values
        const newConfigurations = newResponse.data.configurations
        updateGlobalValues(newConfigurations)
    }

    const handleURLUploadResponses = (allResponses) => {
        let i = 0
        const allNewTracks = []

        for (const response of allResponses){
            const newChannels = response.data.channels
            const config = response.data.configurations
            let channelIndex = 0
            console.log(config)
            for (const channel of newChannels){
                allNewTracks.push({
                    trackID: nanoid(),
                    trackIndex: i,
                    channelIndex: channelIndex,
                    visible: true,
                    showOverviewBarAndTimeAxis: i === 0,
                    audioID: channel.audio_id,
                    filename: response.filename,
                    audioDuration: channel.audio_duration,
                    frequencies: channel.freqs,
                    spectrogram: channel.spec,
                    specCalMethod: config.spec_cal_method,
                    nfft: config.n_fft,
                    binsPerOctave: config.bins_per_octave,
                    minFreq: config.min_frequency,
                    maxFreq: config.max_frequency
                })
                channelIndex++
                i++
            }
        }

        setTracks(allNewTracks)

        // Update Global Values with the values of the first Response
        const newConfigurations = allResponses[0].data.configurations
        updateGlobalValues(newConfigurations)
    }

    const updateGlobalValues = (newConfigurations) => {
        const hopLength = newConfigurations.hop_length
        const numSpecColumns = newConfigurations.num_spec_columns
        const samplingRate = newConfigurations.sampling_rate
        const defaultConfig = {
            hop_length: hopLength,
            num_spec_columns: numSpecColumns,
            sampling_rate: samplingRate
        }

        setGlobalHopLength( hopLength )
        setGlobalNumSpecColumns( numSpecColumns )
        setGlobalSamplingRate( samplingRate )
        setDefaultConfig( defaultConfig )
    }


    /* ++++++++++++++++++ Helper methods ++++++++++++++++++ */

    const extractLabels = (audioFilesArray) => {
        const allLabels = []
        for (let audioFile of audioFilesArray){
            for (const channelIndex in audioFile.labels.channels){
                let labels = audioFile.labels.channels[channelIndex]
                labels = labels.map( label => ( {...label, filename: audioFile.filename, channelIndex: Number(channelIndex)} ) )
                allLabels.push(...labels)
            }
        }

        return allLabels
    }


    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    // When tracks are being changed, recalculate currently longest track and set that as global audio duration
    useEffect( () => {
        const trackDurations = tracks.map(track => track.audioDuration)
        const newGlobalDuration = Math.max(...trackDurations)// === -Infinity ? 0 : Math.max(...trackDurations)
        
        setGlobalAudioDuration(newGlobalDuration)
    }, [tracks])

    // When the site was accessed with a URL data parameter
    useEffect( () => {
        let ignore = false

        const queryParams = new URLSearchParams(location.search)
        const strictMode = queryParams?.get('strict-mode')
        const hashID = queryParams?.get('hash-id')
        const metaData = queryParams?.get('metadata')

        if (strictMode?.toLowerCase() === 'true'){
            setStrictMode(true)
        }

        const getMetaDataFromHashID = async () => {
            const path = `/api/metadata/${hashID}`

            const response = await axios.get(path)
            const audioFilesArray = response.data.response
            //const audioFilesArray = dummyData.response // For testing purposes

            if (!ignore) return

            // Extract labels
            const allLabels = extractLabels(audioFilesArray)

            // Create Species, Individuals and clustername buttons deriving from the imported labels.
            const updatedSpeciesArray = createSpeciesFromImportedLabels(allLabels, speciesArray)
            setSpeciesArray(updatedSpeciesArray)
            setImportedLabels(allLabels)
            setAnnotationInstance(audioFilesArray[0].annotation_instance)

            // Prepare for upload
            processAudioFilesSequentially(audioFilesArray)
        }

        const processMetadataFromBase64String = async () => {
            const decodedMetaData = await JSON.parse(atob(decodeURIComponent(metaData)))
            const audioFilesArray = decodedMetaData.response

            if (!ignore) return

            // Extract labels
            const allLabels = extractLabels(audioFilesArray)

            // Create Species, Individuals and clustername buttons deriving from the imported labels.
            const updatedSpeciesArray = createSpeciesFromImportedLabels(allLabels, speciesArray)
            setSpeciesArray(updatedSpeciesArray)
            setImportedLabels(allLabels)
            setAnnotationInstance(audioFilesArray[0].annotation_instance)

            // Prepare for upload
            processAudioFilesSequentially(audioFilesArray)
        }

        if (hashID) {
            getMetaDataFromHashID()
        }

        if (metaData) {
            processMetadataFromBase64String()
        }

        return () => {
            ignore = true
        }

    }, [location])

    /*
    // When labels are imported from a local CSV file
    useEffect( () => {
        if (!importedLabels) return
        const updatedSpeciesArray = createSpeciesFromImportedLabels(importedLabels, speciesArray)
        setSpeciesArray(updatedSpeciesArray)
    }, [importedLabels])
    */

    // When all the tracks have pushed their labels to allLabels state variable in App.jsx
    useEffect( () => {
        if (!allLabels || !submitRequest) return
        submitAllAnnotations()
        setSubmitRequest(false)
        deleteAllLabelsInApp()
    }, [allLabels])

    // Keep tracksRef.current up to date
    useEffect(() => {
        tracksRef.current = tracks
    }, [tracks])

    // Set Up Before Unload Event Handler upon mount
    useEffect(() => {
        const releaseAudioIDs = async () => {
            const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS + 'release-audio-given-ids';
            const audioIds = tracksRef.current.map(track => track.audioID);

            const requestParameters = { audio_id_list: audioIds };

            try {
                const response = await fetch(path, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestParameters),
                    keepalive: true
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                console.log('Request sent successfully with keepalive');
            } catch (error) {
                console.error('An error occurred:', error);
            }
        }

        const handleBeforeUnload = (event) => {
                const confirmationMessage = 'Are you sure you want to leave? Make sure to save your work, if have not done so already.'

                event.preventDefault()
                event.returnValue = confirmationMessage

                return confirmationMessage;
        }

        const handleUnload = () => {
            releaseAudioIDs()
        }

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);

        // Cleanup the event listeners on component unmount
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        }
    }, [])

    // Set up arrow key event handlers
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'ArrowLeft' && !leftArrowKeyPressed) {
                setLeftArrowKeyPressed(true);
            }
            if (event.key === 'ArrowRight' && !rightArrowKeyPressed) {
                setRightArrowKeyPressed(true);
            }
        }

        function handleKeyUp(event) {
            if (event.key === 'ArrowLeft' && leftArrowKeyPressed) {
                setLeftArrowKeyPressed(false);
                leftScroll();
            }
            if (event.key === 'ArrowRight' && rightArrowKeyPressed) {
                setRightArrowKeyPressed(false);
                rightScroll();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [leftArrowKeyPressed, rightArrowKeyPressed, leftScroll, rightScroll]);

    return (
        <>
            <ToastContainer />
            <AnnotationLabels
                speciesArray={speciesArray}
                passSpeciesArrayToApp={passSpeciesArrayToApp}
                passDeletedItemIDToApp={passDeletedItemIDToApp}
                strictMode={strictMode}
            />
            <div id='controls-container'>
                <div id='zoom-scroll-buttons-container'>
                    <button
                        id='left-scroll-btn'
                        onClick={leftScroll}
                    />
                    <IconButton style={strictMode ? globalControlsBtnDisabled : globalControlsBtn} disabled={strictMode} onClick={onZoomIn}>
                        <ZoomInIcon style={icon}/>
                    </IconButton>
                    <IconButton style={strictMode ? globalControlsBtnDisabled : globalControlsBtn} disabled={strictMode} onClick={onZoomOut}>
                        <ZoomOutIcon style={icon}/>
                    </IconButton>
                    <button
                        id='right-scroll-btn'
                        onClick={rightScroll}
                    />
                </div>
                <div id={'settings-download-submit-container'}>
                    <ImportCSV
                        passImportedLabelsToApp={passImportedLabelsToApp}
                        speciesArray={speciesArray}
                        passSpeciesArrayToApp={passSpeciesArrayToApp}
                    />
                    <Export
                        tracks={tracks}
                        allLabels={allLabels}
                        annotationInstance={annotationInstance}
                        exportRequest={exportRequest}
                        passExportRequestToApp={passExportRequestToApp}
                        deleteAllLabelsInApp={deleteAllLabelsInApp}
                    />
                    <Tooltip title='Submit Annotations'>
                        <IconButton
                            style={{...globalControlsBtn, ...(!strictMode && iconBtnDisabled)}}
                            disabled={!strictMode}
                            //onClick={submitAllAnnotations}
                            onClick={handleClickSubmitBtn}
                        >
                            <DoneAllIcon style={icon} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Open Global Configurations'>
                        <IconButton
                            style={globalControlsBtn}
                            onClick={ () => setShowGlobalConfigWindow(true)}>
                            <SettingsIcon style={icon} />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
            <div
                id='blank-space'
            >
            </div>

            <div
                id='all-tracks'
            >
                {showGlobalConfigWindow &&
                    <GlobalConfig
                        globalAudioDuration={globalAudioDuration}
                        currentStartTime={currentStartTime}
                        updateClipDurationAndTimes={updateClipDurationAndTimes}
                        globalHopLength={globalHopLength}
                        globalNumSpecColumns={globalNumSpecColumns}
                        globalSamplingRate={globalSamplingRate}
                        passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                        passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                        defaultConfig={defaultConfig}
                        passShowGlobalConfigWindowToApp={passShowGlobalConfigWindowToApp}
                        strictMode={strictMode}
                    />
                }

                {
                    tracks.map(track => {
                        return (
                            <ScalableSpec
                                key={track.trackID}
                                trackID={track.trackID}
                                speciesArray={speciesArray}
                                deletedItemID={deletedItemID}
                                showOverviewBarAndTimeAxis={track.showOverviewBarAndTimeAxis}
                                globalAudioDuration={globalAudioDuration}
                                globalClipDuration={globalClipDuration}
                                currentStartTime={currentStartTime}
                                currentEndTime={currentEndTime}
                                maxScrollTime={maxScrollTime}
                                SCROLL_STEP_RATIO={SCROLL_STEP_RATIO}
                                passScrollStepToApp={passScrollStepToApp}
                                passMaxScrollTimeToApp={passMaxScrollTimeToApp}
                                passCurrentEndTimeToApp={passCurrentEndTimeToApp}
                                passClipDurationToApp={passClipDurationToApp}
                                passCurrentStartTimeToApp={passCurrentStartTimeToApp}
                                removeTrackInApp={removeTrackInApp}
                                globalHopLength={globalHopLength}
                                globalNumSpecColumns={globalNumSpecColumns}
                                globalSamplingRate={globalSamplingRate}
                                updateClipDurationAndTimes={updateClipDurationAndTimes}
                                activeLabel={activeLabel}
                                passActiveLabelToApp={passActiveLabelToApp}
                                strictMode={strictMode}
                                importedLabels={importedLabels}
                                handleUploadResponse={handleUploadResponse}
                                trackData={track}
                                passFilesUploadingToApp={passFilesUploadingToApp}
                                addLabelsToApp={addLabelsToApp}
                                exportRequest={exportRequest}
                                submitRequest={submitRequest}
                                toggleTrackVisibility={toggleTrackVisibility}
                                moveTrackUp={moveTrackUp}
                                moveTrackDown={moveTrackDown}
                                lastTrackIndex={tracks[tracks.length - 1].trackIndex}
                                passSpeciesArrayToApp={passSpeciesArrayToApp}
                                tokenInference={tokenInference}
                                tokenFinetune={tokenFinetune}
                                passTokenInferenceToWhisperSeg={passTokenInferenceToWhisperSeg}
                                passTokenFinetuneToWhisperSeg={passTokenFinetuneToWhisperSeg}
                            />
                        )
                    })
                }

                {filesUploading && <LoadingCircle progress={uploadProgress} />}

                <Tooltip title="Add New Track">
                    <IconButton style={strictMode ? iconBtnDisabled : iconBtn} disabled={strictMode} onClick={addTrack}>
                        <AddBoxIcon style={icon}/>
                    </IconButton>
                </Tooltip>
            </div>
        </>
    )
}

export default App