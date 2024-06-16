import React, {useEffect, useState} from 'react'
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
    UNKNOWN_SPECIES
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
    const [csvImportedLabels, setCsvImportedLabels] = useState(null);

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
        {trackID: nanoid(), trackIndex: 0, showOverviewBarAndTimeAxis: true, audioID: null, filename: null, audioDuration: null, frequencies: null, spectrogram: null},
    ])

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

    const [audioPayloads, setAudioPayloads] = useState(null)
    const [strictMode, setStrictMode] = useState(false)

    const [activeLabel, setActiveLabel] = useState(null)

    const [allLabels, setAllLabels] = useState({})

    const [filesUploading, setFilesUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    function passGlobalHopLengthToApp( newHopLength ){
        setGlobalHopLength( newHopLength )
    }

    function passGlobalNumSpecColumnsToApp( newNumSpecColumns ){
        setGlobalNumSpecColumns( newNumSpecColumns )
    }

    function passGlobalSamplingRateToApp( newSamplingRate ){
        setGlobalSamplingRate( newSamplingRate )
    }

    function passDefaultConfigToApp( newDefaultConfig ){
        setDefaultConfig( newDefaultConfig )
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

    function passLabelsToApp( labels, trackIndex ){
        setAllLabels(
            {
                ...allLabels,
                [trackIndex]: labels
            }
        )
    }

    function passCsvImportedLabelsToApp ( newImportedLabels ){
        setCsvImportedLabels( newImportedLabels )
    }

    function passFilesUploadingToApp( boolean ){
        setFilesUploading(boolean)
    }

    /* ++++++++++++++++++ Audio Tracks ++++++++++++++++++ */
    
    function addTrack(){
        const updatedTracks = tracks.map(track => track)
        const newIndex = updatedTracks.length
        updatedTracks.push({trackID: nanoid(), trackIndex: newIndex, showOverviewBarAndTimeAxis: false, audioID: null, filename: null, audioDuration: null, frequencies: null, spectrogram: null})

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

    async function submitAllAnnotations(){
        if (!allLabels) return

        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'post-annotations'

        let allLabelsArray = Object.values(allLabels).flat()

        if (!allLabelsArray.length) {
            alert('There are currently no annotations. Add some and try again.')
            return
        }

        // Remove properties that irrelevant for the backend
        allLabelsArray = allLabelsArray.map(labelObj => {
            return {
                onset: labelObj.onset,
                offset: labelObj.offset,
                species: labelObj.species,
                individual: labelObj.individual,
                clustername: labelObj.clustername,
                filename: labelObj.filename,
                annotation_instance: labelObj.annotation_instance
            }
        })

        const requestParameters = {
            annotations: allLabelsArray
        }

        const headers = {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        }

        try {
            await axios.post(path, requestParameters, { headers } )
            toast.success('Annotations submitted successfully!')
        } catch (error) {
            alert('Something went wrong trying to submit the annotations. Check the console for more information.')
            console.log(error)
        }

    }

    /* ++++++++++++++++++ Helper Methods ++++++++++++++++++ */

    function getImportedLabelsForThisTrack(csvImportedLabels, trackIndex) {
        return csvImportedLabels.filter( label => label.trackIndex === trackIndex)
    }

    function createSpeciesFromImportedLabels (importedLabels){
        let updatedSpeciesArray = [...speciesArray]
        const allExistingSpeciesNames = speciesArray.map(speciesObj => speciesObj.name)

        for (let label of importedLabels){

            for (let speciesObj of updatedSpeciesArray){

                // For Existing species, update Individuals and Clusternames
                if (speciesObj.name === label.species){
                    const allIndividualNames = speciesObj.individuals.map(individual => individual.name)
                    if ( !allIndividualNames.includes(label.individual) ){
                        const newIndividual = new Individual(nanoid(), label.individual)
                        newIndividual.isActive = false
                        speciesObj.individuals = [...speciesObj.individuals, newIndividual]
                    }

                    const allClusternamesNames = speciesObj.clusternames.map(clustername => clustername.name)
                    if ( !allClusternamesNames.includes(label.clustername) ){
                        const newClustername = new Clustername(nanoid(), label.clustername)
                        newClustername.isActive = false
                        speciesObj.clusternames = [...speciesObj.clusternames, newClustername]
                    }
                }
            }

            // If imported species does not exist already, create a new one
            if (!allExistingSpeciesNames.includes(label.species)){

                const newIndividualsArray = []
                // Create Unknown Individual
                const newUnknownIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL, 0)
                newUnknownIndividual.isActive = false
                newIndividualsArray.unshift(newUnknownIndividual)

                // If that label's individual is not Unknown, create that individual for this species
                if (label.individual !== UNKNOWN_INDIVIDUAL){
                    const newIndividual = new Individual(nanoid(), label.individual)
                    newIndividual.isActive = false
                    newIndividualsArray.push(newIndividual)
                }


                const newClusternamesArray = []
                // Create Unknown Clustername
                const newUnknownClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
                newUnknownClustername.isActive = false
                newClusternamesArray.push(newUnknownClustername)

                // If that label's clustername is not Unknown, create that clustername for this species
                if (label.clustername !== UNKNOWN_CLUSTERNAME) {
                    const newClustername = new Clustername(nanoid(), label.clustername)
                    newClustername.isActive = false
                    newClusternamesArray.push(newClustername)
                }

                const newSpecies = new Species(
                    nanoid(),
                    label.species,
                    newIndividualsArray,
                    newClusternamesArray,
                )

                const insertionIndex = updatedSpeciesArray.length - 1
                allExistingSpeciesNames.splice(insertionIndex,0,label.species)
                updatedSpeciesArray.splice(insertionIndex,0,newSpecies)
            }
        }

        setSpeciesArray(updatedSpeciesArray)
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
            alert('Error while uploading. Check the console for more information.')
        }
    }

    const processAudioFilesSequentially = async (audioFilesArray) => {
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
                trackIndex: index
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

            for (const channel of newChannels){
                allNewTracks.push({
                    trackID: nanoid(),
                    trackIndex: i,
                    showOverviewBarAndTimeAxis: i === 0,
                    audioID: channel.audio_id,
                    filename: response.filename,
                    audioDuration: channel.audio_duration,
                    frequencies: channel.freqs,
                    spectrogram: channel.spec,
                })
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
        const hashID = queryParams?.get('hash-id')
        const strictMode = queryParams?.get('strict-mode')

        if (!hashID) return

        if (strictMode?.toLowerCase() === 'true'){
            setStrictMode(true)
        }

        const path = `/api/metadata/${hashID}`

        const getMetaData = async () => {
            const response = await axios.get(path)
            //const audioFilesArray = response.data.response
            const audioFilesArray = dummyData.response

            // Create Species, Individuals and clustername buttons deriving from the imported labels
            const allLabels = []
            for (let audioFile of audioFilesArray){
                for (const trackIndex in audioFile.labels.tracks){
                    const labels = audioFile.labels.tracks[trackIndex]
                    allLabels.push(...labels)
                }
            }
            createSpeciesFromImportedLabels(allLabels)

            // Prepare for upload
            processAudioFilesSequentially(audioFilesArray)
        }

        getMetaData()

        return () => {
            ignore = true
        }

    }, [location])

    // When labels are imported from a local CSV file
    useEffect( () => {
        if (!csvImportedLabels) return
        createSpeciesFromImportedLabels(csvImportedLabels)

    }, [csvImportedLabels])


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
                        passCsvImportedLabelsToApp={passCsvImportedLabelsToApp}
                    />
                    <Export
                        allLabels={allLabels}
                    />
                    <Tooltip title='Submit Annotations'>
                        <IconButton
                            style={{...globalControlsBtn, ...(!strictMode && iconBtnDisabled)}}
                            disabled={!strictMode}
                            onClick={submitAllAnnotations}
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
                                showOverviewInitialValue={track.showOverviewBarAndTimeAxis}
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
                                passGlobalHopLengthToApp={passGlobalHopLengthToApp}
                                passGlobalNumSpecColumnsToApp={passGlobalNumSpecColumnsToApp}
                                passGlobalSamplingRateToApp={passGlobalSamplingRateToApp}
                                updateClipDurationAndTimes={updateClipDurationAndTimes}
                                passDefaultConfigToApp={passDefaultConfigToApp}
                                audioPayload={audioPayloads? audioPayloads[track.trackIndex] : null}
                                //audioPayload={audioPayloads}
                                activeLabel={activeLabel}
                                passActiveLabelToApp={passActiveLabelToApp}
                                strictMode={strictMode}
                                passLabelsToApp={passLabelsToApp}
                                csvImportedLabels={csvImportedLabels && getImportedLabelsForThisTrack(csvImportedLabels, track.trackIndex)}
                                //urlImportedLabels={audioPayloads[track.trackIndex]}
                                handleUploadResponse={handleUploadResponse}
                                trackData={track}
                                passFilesUploadingToApp={passFilesUploadingToApp}
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