import React, {useEffect, useRef, useState} from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import TuneIcon from '@mui/icons-material/Tune';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DensityLargeIcon from '@mui/icons-material/DensityLarge';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {nanoid} from "nanoid";
import {Label} from "./label.js"
import {freqBtn, icon, iconBtn, iconBtnDisabled, iconBtnSmall, iconSmall} from "./styles.js"
import LocalFileUpload from "./LocalFileUpload.jsx";
import Parameters from "./Parameters.jsx"
import LabelWindow from "./LabelWindow.jsx";
import {ANNOTATED_AREA, UNKNOWN_CLUSTERNAME, UNKNOWN_INDIVIDUAL, UNKNOWN_SPECIES} from "./species.js";

// Classes

class Playhead{
    constructor(timeframe) {
        this.timeframe = timeframe
    }
}

// Global variables
const HEIGHT_BETWEEN_INDIVIDUAL_LINES = 15
const ZERO_GAP_CORRECTION_MARGIN = 0.0005
const FREQUENCY_LINES_COLOR = '#47ff14'


function ScalableSpec(
                        {
                            trackID,
                            speciesArray,
                            deletedItemID,
                            showOverviewInitialValue,
                            globalAudioDuration,
                            globalClipDuration,
                            passClipDurationToApp,
                            currentStartTime,
                            currentEndTime,
                            maxScrollTime,
                            SCROLL_STEP_RATIO,
                            passScrollStepToApp,
                            passMaxScrollTimeToApp,
                            passCurrentEndTimeToApp,
                            passCurrentStartTimeToApp,
                            removeTrackInApp,
                            globalHopLength,
                            globalNumSpecColumns,
                            globalSamplingRate,
                            passGlobalHopLengthToApp,
                            passGlobalNumSpecColumnsToApp,
                            passGlobalSamplingRateToApp,
                            updateClipDurationAndTimes,
                            passDefaultConfigToApp,
                            audioPayload,
                            activeLabel,
                            passActiveLabelToApp,
                            strictMode,
                            passLabelsToApp,
                            csvImportedLabels,
                            handleUploadResponse,
                            trackData
                        }
                    )
                {

    // General
    const [audioId, setAudioId] = useState(trackData.audioID)

    // Spectrogram
    const specCanvasRef = useRef(null)
    const specImgData = useRef(null)
    const [spectrogram, setSpectrogram] = useState(trackData.spectrogram)

    // Frequency
    const [frequencies, setFrequencies] = useState(trackData.frequencies)
    const frequenciesCanvasRef = useRef(null)
    const [showFrequencyLines, setShowFrequencyLines] = useState(false)
    const [frequencyLines, setFrequencyLines] = useState({maxFreqY: 0, minFreqY: 121})
    let clickedFrequencyLinesObject = null

    // Label Canvas
    const labelCanvasRef = useRef(null)

    // Individuals Canvas
    const individualsCanvasRef = useRef(null)
    const numberOfIndividuals = speciesArray.reduce((total, speciesObj) => total + speciesObj.individuals.length, 0)
    const [showLabelAndIndividualsCanvas, setShowLabelAndIndividualsCanvas] = useState(true)

    // Time Axis
    const timeAxisRef = useRef(null);

    // Overview Window
    const overviewRef = useRef(null)
    let newViewportStartFrame = null
    let newViewportEndFrame = null
    let widthBetween_xStartTime_mouseX = null
    let widthBetween_xEndTime_mouseX = null

    // Labels
    const [labels, setLabels] = useState([])
    let clickedLabel = undefined
    let lastHoveredLabel = {labelObject: null, isHighlighted: false}

    // Audio
    const playheadRef = useRef(new Playhead(0))
    const [audioSnippet, setAudioSnippet] = useState(null)
    const [playWindowStartTime, setPlayWindowStartTime] = useState(null)

    // Waveform
    const waveformCanvasRef = useRef(null)
    const waveformImgData = useRef(null)
    const [audioArray, setAudioArray] = useState(null)
    const [waveformScale, setWaveformScale] = useState(25)
    const [showWaveform, setShowWaveform] =  useState(true)

    // File Upload
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    // Local Parameters
    const [showLocalConfigWindow, setShowLocalConfigWindow] = useState(false)
    const [specCalMethod, setSpecCalMethod] = useState('log-mel')
    const [nfft, setNfft] = useState('')
    const [binsPerOctave, setBinsPerOctave] = useState('')
    const [minFreq, setMinFreq] = useState('')
    const [maxFreq, setMaxFreq] = useState('')

    // WhisperSeg
    const [whisperSegIsLoading, setWhisperSegIsLoading] = useState(false)

    // Active Species
    const activeSpecies = speciesArray.find(speciesObj =>
        speciesObj.individuals.some(individual => individual.isActive)
    )

    // Label Window
    const [expandedLabel, setExpandedLabel] = useState(null)
    const [globalMouseCoordinates, setGlobalMouseCoordinates] = useState(null)

    // Icons
    const activeIcon = showWaveform ? icon : iconSmall
    const activeIconBtnStyle = showWaveform ? iconBtn : iconBtnSmall

    // Database
    const [annotationInstance, setAnnotationInstance] = useState(null)

    /* ++++++++++++++++++++ Pass methods ++++++++++++++++++++ */

    const passSpectrogramIsLoadingToScalableSpec = ( boolean ) => {
        setSpectrogramIsLoading( boolean )
    }

    const passShowLocalConfigWindowToScalableSpec = ( boolean ) => {
        setShowLocalConfigWindow( boolean )
    }

    const passSpecCalMethodToScalableSpec = ( newSpecCalMethod ) => {
        setSpecCalMethod( newSpecCalMethod )
    }

    const passNfftToScalableSpec = ( newNfft ) => {
        setNfft( newNfft )
    }

    const passBinsPerOctaveToScalableSpec = ( newBinsPerOctave ) => {
        setBinsPerOctave( newBinsPerOctave )
    }

    const passMinFreqToScalableSpec = ( newMinFreq ) => {
        setMinFreq( newMinFreq )
    }

    const passMaxFreqToScalableSpec = ( newMaxFreq ) => {
        setMaxFreq( newMaxFreq )
    }

    const passLabelsToScalableSpec = ( newLabelsArray ) => {
        setLabels( newLabelsArray )
        passLabelsToApp(createGenericLabelObjects(newLabelsArray), trackData.trackIndex)
    }

    const passExpandedLabelToScalableSpec = ( newExpandedLabel ) => {
        setExpandedLabel( newExpandedLabel )
    }

    /* ++++++++++++++++++ Backend API calls ++++++++++++++++++ */

    const getAudioClipSpec = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-spec'

        const requestParameters = {
            audio_id: audioId,
            start_time: currentStartTime,
            hop_length: globalHopLength,
            num_spec_columns: globalNumSpecColumns,
            sampling_rate: globalSamplingRate,
            spec_cal_method: specCalMethod,
            n_fft: Number(nfft),
            bins_per_octave: Number(binsPerOctave),
            min_frequency: Number(minFreq),
            max_frequency: Number(maxFreq)
        }

        const response = await axios.post(path, requestParameters)

        // Update potentially by the backend corrected values in the input fields (e.g. when the user requests nfft < 5)
        const newSpecCalMethod = response.data.configurations.spec_cal_method
        const newNfft = response.data.configurations.n_fft
        const newBinsPerOctave = response.data.configurations.bins_per_octave
        const newMinFreq = response.data.configurations.min_frequency
        const newMaxFreq = response.data.configurations.max_frequency
        setSpecCalMethod(newSpecCalMethod)
        setNfft(newNfft ? newNfft : 512)
        setBinsPerOctave(newBinsPerOctave ? newBinsPerOctave : 0)
        setMinFreq(newMinFreq ? newMinFreq : 0)
        setMaxFreq(newMaxFreq ? newMaxFreq : 16000)

        return response.data
    }

    const getSpecAndAudioArray = async () => {
        try {
            const [data, newAudioArray] = await Promise.all(
                [
                    getAudioClipSpec(),
                    getAudioArray()
                ]
            )

            drawEditorCanvases(data.spec, data.freqs, newAudioArray)
            setSpectrogramIsLoading(false)
            setSpectrogram(data.spec)
            setFrequencies(data.freqs)
            setAudioArray(newAudioArray)
        } catch (error) {
            console.error('Error fetching data:', error)
            alert(error+' \nPlease try again later.')
        }
    }

    const submitLocalParameters = () => {
        if (!globalClipDuration || !trackData) return

        if (audioSnippet) {
            audioSnippet.pause()
            audioSnippet.currentTime = currentStartTime
        }

        setSpectrogramIsLoading(true)
        getSpecAndAudioArray()
    }

    const uploadFileByURL = async (audioPayload) => {
        setSpectrogramIsLoading( true )
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
            const response = await axios.post(path, requestParameters)
            handleUploadResponse(response)
        } catch (error){
            handleUploadError(error)
        }
    }



    /*
    const handleUploadResponse = (newResponse) => {
        const trackDuration = newResponse.data.channels[0].audio_duration
        const hopLength = newResponse.data.configurations.hop_length
        const numSpecColumns = newResponse.data.configurations.num_spec_columns
        const samplingRate = newResponse.data.configurations.sampling_rate
        const defaultConfig = {
            hop_length: hopLength,
            num_spec_columns: numSpecColumns,
            sampling_rate: samplingRate
        }

        const newResponseData = newResponse.data.channels[0]
        const newSpecCalMethod = newResponse.data.configurations.spec_cal_method
        const newNfft = newResponse.data.configurations.n_fft
        const newBinsPerOctave = newResponse.data.configurations.bins_per_octave
        const newMinFreq = newResponse.data.configurations.min_frequency
        const newMaxFreq = newResponse.data.configurations.max_frequency

        // Remove outdated track duration of the previous file in the App component
        if (response){
            deletePreviousTrackDurationInApp( response.audio_duration )
        }
        // Close Label Window
        setExpandedLabel(null)

        passTrackDurationToApp( trackDuration )
        passGlobalHopLengthToApp( hopLength )
        passGlobalNumSpecColumnsToApp( numSpecColumns )
        passGlobalSamplingRateToApp( samplingRate )
        passDefaultConfigToApp( defaultConfig )

        setResponse( newResponseData )
        setSpecCalMethod( newSpecCalMethod )
        setNfft( newNfft ? newNfft : 512)
        setBinsPerOctave( newBinsPerOctave ? newBinsPerOctave : 0)
        setMinFreq( newMinFreq ? newMinFreq : 0)
        setMaxFreq( newMaxFreq ? newMaxFreq : 16000)
    }
     */

    const handleUploadError = (error) => {
        setSpectrogramIsLoading( false )
        console.error("Error uploading file:", error)
        alert('Error while uploading. Check the console for more information.')
    }

    /* ++++++++++++++++++ Mouse Interaction methods ++++++++++++++++++ */

    const handleLMBDown = (event) => {
        // Ignore clicks from other mouse buttons
        if (event.button !== 0) return

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        const mouseX = getMouseX(event)
        const mouseY = getMouseY(event)

        // Deal with click on Onset or Offset to trigger drag methods
        if ( checkIfOccupiedByOnsetOrOffset(mouseX, mouseY) && event.target.className === 'label-canvas'){
            // Deal with click on Onset
            clickedLabel = checkIfClickedOnOnset(mouseX, mouseY)
            if ( clickedLabel ){
                specCanvasRef.current.addEventListener('mousemove', dragOnset)
                waveformCanvasRef.current.addEventListener('mousemove', dragOnset)
                labelCanvasRef.current.addEventListener('mousemove', dragOnset)
                return
            }

            // Deal with click on Offset
            clickedLabel = checkIfClickedOnOffset(mouseX, mouseY)
            if (clickedLabel){
                specCanvasRef.current.addEventListener('mousemove', dragOffset)
                waveformCanvasRef.current.addEventListener('mousemove', dragOffset)
                labelCanvasRef.current.addEventListener('mousemove', dragOffset)
                return
            }
        }

        // Deal with click on Max Frequency Line
        if (checkIfOccupiedByMaxFreqLine(mouseY)){
            clickedFrequencyLinesObject = frequencyLines
            specCanvasRef.current.addEventListener('mousemove', dragMaxFreqLine)
            return
        }

        // Deal with click on Min Frequency Line
        if (checkIfOccupiedByMinFreqLine(mouseY)){
            clickedFrequencyLinesObject = frequencyLines
            specCanvasRef.current.addEventListener('mousemove', dragMinFreqLine)
            return
        }

        // Deal with click inside an existing label
        const labelToBeExpanded = checkIfClickedOnLabel (mouseX, mouseY)
        if ( labelToBeExpanded ) {
            setExpandedLabel( labelToBeExpanded )
            setGlobalMouseCoordinates({x: event.clientX, y: event.clientY})
            return
        }

        // Add offset to existing label if necessary
        const newestLabel = labels[labels.length-1]
        if (labels.length > 0 && newestLabel.offset === undefined){
            let newOffset = calculateTimestamp(event)
            newOffset = magnet(newOffset)
            /*
            if (!checkIfNewOffsetIsValid(newestLabel.onset, newOffset) ){
                alert('Labels of the same individual may not stretch across one another.')
                return
            }*/
            const labelsCopy = labels
            if (newOffset < newestLabel.onset){
                newestLabel.offset = newOffset
                labelsCopy[labels.length-1] = flipOnsetOffset(newestLabel)
            } else {
                labelsCopy[labels.length-1].offset = newOffset
            }
            setLabels(labelsCopy)
            passLabelsToApp(createGenericLabelObjects(labelsCopy), trackData.trackIndex)
            passActiveLabelToApp(
                {
                    onset: labelsCopy[labels.length-1].onset,
                    offset: labelsCopy[labels.length-1].offset,
                    color: '#ffffff',
                    trackId: trackID
                }
            )
            drawLineBetween(newestLabel)
            drawLine(newestLabel, newestLabel.onset)
            drawLine(newestLabel, newestLabel.offset)
            return
        }

        // Add onset
        let clickedTimestamp = calculateTimestamp(event)
        clickedTimestamp = magnet(clickedTimestamp)
        passActiveLabelToApp({onset: clickedTimestamp, offset: undefined, color: '#ffffff', trackId: trackID})
        addNewLabel(clickedTimestamp)
    }

    const handleMouseUp = (event) => {
        if (event.button !== 0) return

        removeDragEventListeners()
        //specCanvasRef.current.removeEventListener('mousemove', dragPlayhead)

        if (clickedLabel){
            // flip onset with offset if necessary
            if (clickedLabel.onset > clickedLabel.offset){
                clickedLabel = flipOnsetOffset(clickedLabel)
            }
            // Create zero gap labels if necessary
            clickedLabel.onset = magnet(clickedLabel.onset)
            clickedLabel.offset = magnet(clickedLabel.offset)

            passLabelsToScalableSpec(labels)
            passActiveLabelToApp({onset: clickedLabel.onset, offset: clickedLabel.offset, color: '#ffffff', trackId: trackID})
        }

        clickedLabel = undefined
        clickedFrequencyLinesObject = null
    }

    const removeDragEventListeners = () => {
        specCanvasRef.current.removeEventListener('mousemove', dragOnset)
        specCanvasRef.current.removeEventListener('mousemove', dragOffset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOnset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOffset)
        labelCanvasRef.current.removeEventListener('mousemove', dragOnset)
        labelCanvasRef.current.removeEventListener('mousemove', dragOffset)
        specCanvasRef.current.removeEventListener('mousemove', dragMaxFreqLine)
        specCanvasRef.current.removeEventListener('mousemove', dragMinFreqLine)
    }

    const handleMouseLeaveCanvases = (event) => {
        handleMouseUp(event)
    }

    const handleRightClick = (event) => {
        event.preventDefault()

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        const mouseX = getMouseX(event)
        const mouseY = getMouseY(event)
        const labelToBeDeleted = checkIfClickedOnLabel(mouseX, mouseY)

        if (!labelToBeDeleted) return

        deleteLabel(labelToBeDeleted)

        if (labelToBeDeleted.onset === activeLabel?.onset && labelToBeDeleted.offset === activeLabel?.offset){
            passActiveLabelToApp({onset: undefined, offset: undefined, color: undefined, trackId: undefined})
        }
    }

    const handleMouseMove = (event) => {
        hoverLine(event)
        hoverLabel(event)
    }

    const hoverLine = (event) => {
        const mouseX = getMouseX(event)
        const mouseY = getMouseY(event)

        if ( checkIfOccupiedByOnsetOrOffset(mouseX, mouseY) && event.target.className === 'label-canvas' /*|| checkIfClickedOnPlayhead(xHovered)*/){
            specCanvasRef.current.style.cursor = 'col-resize'
            waveformCanvasRef.current.style.cursor = 'col-resize'
            labelCanvasRef.current.style.cursor = 'col-resize'
        } else if (showFrequencyLines && ( checkIfOccupiedByMaxFreqLine(mouseY) || checkIfOccupiedByMinFreqLine(mouseY) )){
            specCanvasRef.current.style.cursor = 'row-resize'
        } else {
            specCanvasRef.current.style.cursor = 'default'
            waveformCanvasRef.current.style.cursor = 'default'
            labelCanvasRef.current.style.cursor = 'default'
        }
    }

    // this isn't very neat or resourceful, but it works well enough for now. possible candidate for re-factoring in the future
    const hoverLabel = (event) => {
        if (lastHoveredLabel.labelObject && lastHoveredLabel.isHighlighted){
            const specCVS = specCanvasRef.current;
            const specCTX = specCVS.getContext('2d',{ willReadFrequently: true });
            const waveformCVS = waveformCanvasRef.current
            const waveformCTX = waveformCVS.getContext('2d', { willReadFrequently: true })
            const labelCVS = labelCanvasRef.current
            const labelCTX = labelCVS.getContext('2d', { willReadFrequently: true })
            specCTX.clearRect(0, 0, specCVS.width, specCVS.height);
            specCTX.putImageData(specImgData.current, 0, 0);
            waveformCTX.clearRect(0, 0, waveformCVS.width, waveformCVS.height)
            waveformCTX.putImageData(waveformImgData.current, 0, 0)
            labelCTX.clearRect(0, 0, labelCVS.width, labelCVS.height)
            drawAllLabels()
            drawFrequencyLines()
            //drawPlayhead(playheadRef.current.timeframe)
            lastHoveredLabel.isHighlighted = false
            //console.log('drawing green')
        }

        const mouseX = getMouseX(event)
        const mouseY = getMouseY(event)

        for (let label of labels){
            const onsetX = calculateXPosition(label.onset)
            const offsetX = calculateXPosition(label.offset)
            const bottomY = calculateYPosition(label)
            const topY = calculateYPosition(label) - HEIGHT_BETWEEN_INDIVIDUAL_LINES
            if (mouseX >= onsetX && mouseX <= offsetX && mouseY >= topY && mouseY <= bottomY && !lastHoveredLabel.isHighlighted && event.target.className === 'label-canvas' ){
                drawLineBetween(label)
                drawClustername(label)
                drawLine(label, label.onset)
                drawLine(label, label.offset)
                lastHoveredLabel.labelObject = label
                lastHoveredLabel.isHighlighted = true
                //console.log('drawing yellow')
                break;
            }
        }
    }


    /* ++++++++++++++++++ Helper methods ++++++++++++++++++ */

    const getMouseX = (event) => {
        const rect = event.target.getBoundingClientRect()
        return event.clientX - rect.left
    }

    const getMouseY = (event) => {
        const rect = event.target.getBoundingClientRect()
        return event.clientY - rect.top
    }

    const calculateXPosition = (timestamp) => {
        return ( timestamp * labelCanvasRef.current.width / globalClipDuration ) - ( currentStartTime * labelCanvasRef.current.width / globalClipDuration )
    }

    const calculateYPosition = (label) => {
        /*
        let individualCount = 0

        outerLoop:
            for (let speciesObj of speciesArray) {
                for (let individual of speciesObj.individuals) {
                    individualCount++
                    if (speciesObj.name === label.species && individual.name === label.individual) {
                        break outerLoop
                    }
                }
            }

        return label.clustername === 'Protected Area🔒' ? labelCanvasRef.current.height - 1 : individualCount * HEIGHT_BETWEEN_INDIVIDUAL_LINES;
         */
        return (label.individualIndex + 1) * HEIGHT_BETWEEN_INDIVIDUAL_LINES
    }

    const calculateTimestamp = (event) => {
        const mouseX = getMouseX(event)
        const ratio = (mouseX / specCanvasRef.current.width)
        return globalClipDuration * ratio + currentStartTime
    }

    const checkIfOccupiedByOnsetOrOffset = (mouseX, mouseY) => {
        return ( checkIfClickedOnOnset(mouseX, mouseY) || checkIfClickedOnOffset(mouseX, mouseY) )
    }

    const checkIfClickedOnOnset = (mouseX, mouseY) => {
        for (let label of labels){
            const xOnset = calculateXPosition(label.onset)
            const bottomY = calculateYPosition(label)
            const topY = calculateYPosition(label) - HEIGHT_BETWEEN_INDIVIDUAL_LINES
            if (  xOnset >= mouseX - 5 && xOnset <= mouseX + 5 && mouseY >= topY && mouseY <= bottomY ){
                return label
            }
        }
    }

    const checkIfClickedOnOffset = (mouseX, mouseY) => {
        for (let label of labels){
            const xOffset = calculateXPosition(label.offset)
            const bottomY = calculateYPosition(label)
            const topY = calculateYPosition(label) - HEIGHT_BETWEEN_INDIVIDUAL_LINES
            if ( xOffset >= mouseX - 5 && xOffset <= mouseX + 5 && mouseY >= topY && mouseY <= bottomY ){
                return label
            }
        }
    }

    const checkIfClickedOnLabel = (mouseX, mouseY) => {
        for (let label of labels) {
            const onsetX = calculateXPosition(label.onset)
            const offsetX = calculateXPosition(label.offset)
            const bottomY = calculateYPosition(label)
            const topY = calculateYPosition(label) - HEIGHT_BETWEEN_INDIVIDUAL_LINES
            if (mouseX >= onsetX && mouseX <= offsetX && mouseY >= topY && mouseY <= bottomY) {
                return label
            }
        }
    }

    const checkIfOccupiedByMaxFreqLine = (mouseY) => {
        return mouseY < frequencyLines.maxFreqY + 5 && mouseY > frequencyLines.maxFreqY - 5
    }
        
    const checkIfOccupiedByMinFreqLine = (mouseY) => {
        return mouseY < frequencyLines.minFreqY + 5 && mouseY > frequencyLines.minFreqY - 5
    }

    const checkIfNewOffsetIsValid = (currentOnset, newOffset) =>{
        for (let label of labels){
            if (label.onset > currentOnset && label.onset < newOffset){
                return false
            }
            if (label.offset > currentOnset && label.offset < newOffset){
                return false
            }
            if (label.onset > newOffset && label.onset < currentOnset){
                return false
            }
            if (label.offset > newOffset && label.offset < currentOnset){
                return false
            }
        }
        return true
    }

    const findClosestPositiveToZeroIndex = (arr) => {
        // Initialize a variable to store the index of the closest positive number
        let closestIndex = -1;

        // Iterate through the array
        for (let i = 0; i < arr.length; i++) {
            let num = arr[i]
            // Check if the number is positive
            if (num > 0) {
                // If closestIndex is -1 (no positive number found yet) or the current number is closer to zero
                if (closestIndex === -1 || num < arr[closestIndex]) {
                    closestIndex = i
                }
            }
        }

        return closestIndex
    }

    const getAllIndividualIDs = () => {
        return speciesArray.flatMap(speciesObj => {
            return speciesObj.individuals.map(individual => individual.id)
        })
    }

    const createGenericLabelObjects = (labelsArray) => {
        // Convert custom label objects into generic objects with the specific data that is needed for later export
        let newLabelsArray = labelsArray.map( label => {
                return {
                    onset: label.onset,
                    offset: label.offset,
                    species: label.species,
                    individual: label.individual,
                    clustername: label.clustername,
                    filename: label.filename,
                    trackIndex: label.trackIndex,
                    annotation_instance: annotationInstance
                }
            }
        )

        // Remove the Annotated Area labels because they are only necessary for WhisperSeg
        newLabelsArray = newLabelsArray.filter( label => label.species !== ANNOTATED_AREA )

        // Sort the labels ascending by onset
        newLabelsArray = newLabelsArray.sort( (firstLabel, secondLabel ) => firstLabel.onset - secondLabel.onset )

        return newLabelsArray
    }

    /* ++++++++++++++++++ Draw methods ++++++++++++++++++ */

    const drawEditorCanvases = (spectrogram, frequenciesArray, newAudioArray) => {
        if (!specCanvasRef.current) return

        const specCVS = specCanvasRef.current;
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true, alpha: false });
        const image = new Image();

        const labelCVS = labelCanvasRef.current
        const labelCTX = labelCVS.getContext('2d', { willReadFrequently: true, alpha: true });

        // Draw Spectrogram, Waveform and labels
        image.addEventListener('load', () => {
            specCTX.drawImage(image, 0, 0, specCVS.width, specCVS.height);
            specImgData.current = specCTX.getImageData(0, 0, specCVS.width, specCVS.height);
            drawWaveform(newAudioArray)
            drawFrequenciesAxis(frequenciesArray)
            drawIndividualsCanvas()
            labelCTX.clearRect(0, 0, labelCVS.width, labelCVS.height)
            drawAllLabels()
            drawFrequencyLines()
            //drawPlayhead(playheadRef.current.timeframe)
        })
        image.src = `data:image/png;base64,${spectrogram}`;

        // Draw Time Axis, Viewport
        if (showOverviewInitialValue){
            drawTimeAxis()
            drawViewport(currentStartTime, currentEndTime, 'white', 2)
        }
    }

    const drawActiveLabel = (newAudioArray) => {
        if (!specCanvasRef.current || !activeLabel) return

        const specCVS = specCanvasRef.current;
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true, alpha: false });
        const image = new Image();

        const labelCVS = labelCanvasRef.current
        const labelCTX = labelCVS.getContext('2d', { willReadFrequently: true, alpha: true });

        // Draw Spectrogram, Waveform and labels
        image.addEventListener('load', () => {
            specCTX.drawImage(image, 0, 0, specCVS.width, specCVS.height);
            specImgData.current = specCTX.getImageData(0, 0, specCVS.width, specCVS.height);
            drawWaveform(newAudioArray)
            labelCTX.clearRect(0, 0, labelCVS.width, labelCVS.height)
            drawAllLabels()
            drawFrequencyLines()
            drawLine(activeLabel, activeLabel.onset)
            drawLine(activeLabel, activeLabel.offset)
            //drawPlayhead(playheadRef.current.timeframe)
        })
        image.src = `data:image/png;base64,${spectrogram}`;
    }

    const drawTimeAxis = () => {
        const canvas = timeAxisRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'

        // Drawing horizontal timeline
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(canvas.width, 0)
        ctx.stroke()

        // Drawing first timestamp
        ctx.beginPath()
        ctx.moveTo(1, 0)
        ctx.lineTo(1, canvas.height)
        ctx.stroke()

        // Drawing last timestamp
        ctx.beginPath()
        ctx.moveTo(canvas.width - 1, 0)
        ctx.lineTo(canvas.width - 1, canvas.height)
        ctx.stroke()

        // Drawing timestamps in between
        const convertMethod = globalClipDuration > 3600 ? convertSecondsToHours : convertSecondsToMinutes
        let withText = globalClipDuration < globalAudioDuration * 0.25

        let step = Math.floor(globalAudioDuration / 10 / 10) * 10
        if (step < 1){
            step = 1
        }

        // Draw 1st level
        for (let i=step; i < globalAudioDuration; i+=step){
            const timestampText = convertMethod(i)
            drawTimestamp(i, timestampText, 27, 14,true)
        }

        // Draw 2nd level
        step = step / 10
        let count = 0
        for (let i=step; i < globalAudioDuration; i+=step){
            //i = Math.round(i * 10) / 10
            count++
            if (count % 10 === 0 ) continue // This prevents the 2nd level timestamp from drawing over the already existing 1st level timestamp
            const timestampText = convertMethod(i)
            drawTimestamp(i, timestampText,15, 10,withText)
        }

        //Draw 3rd level
        if (globalClipDuration > globalAudioDuration * 0.025) return
        withText = globalClipDuration < globalAudioDuration * 0.01

        step = step / 10
        count = 0
        for (let i=step; i<globalAudioDuration; i+=step){
            //i = parseFloat(i.toFixed(0))
            i = (i * 10) / 10
            count++
            if (count % 10 === 0 ) continue
            const timestampText = convertMethod(i)
            drawTimestamp(i, timestampText,5, 8,withText)
        }

    }

    const drawTimestamp = (timestamp, timestampText, lineHeight, fontSize, withText) => {
        const canvas = timeAxisRef.current
        const ctx = timeAxisRef.current.getContext('2d', { willReadFrequently: true })
        const x = (timestamp * canvas.width / globalClipDuration) - ( currentStartTime * canvas.width / globalClipDuration )

        // Draw line under Timestamp text
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, lineHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'
        ctx.stroke()

        // Draw timestamp text
        ctx.font = `${fontSize}px Arial`
        ctx.fillStyle = '#9db4c0'

        const textWidth = ctx.measureText(timestampText).width

        if (withText) {
            ctx.fillText(timestampText, x - textWidth / 2, lineHeight+12)
        }
    }

    const convertSecondsToMinutes = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000)

        const timeString = minutes.toString().padStart(2, '0') + ':' +
            Math.floor(remainingSeconds).toString().padStart(2, '0') + '.' +
            milliseconds.toString().padStart(1, '0')

        return timeString
    }

    const convertSecondsToHours = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        let remainingSeconds = seconds % 3600
        const minutes = Math.floor(remainingSeconds / 60)
        remainingSeconds %= 60
        const secondsStr = remainingSeconds.toFixed(0).padStart(2, '0')

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsStr}`

        return timeString
    }

    const drawLine = (label, timestamp) => {
        const waveformCTX = waveformCanvasRef.current.getContext('2d')
        const specCTX = specCanvasRef.current.getContext('2d')
        const labelCTX = labelCanvasRef.current.getContext('2d')

        const x = calculateXPosition(timestamp)
        const y = calculateYPosition(label)

        const lineColor = label.color

        if (specCalMethod === 'constant-q'){
            if (timestamp === label.onset){
                drawCurvedOnset(timestamp, lineColor)
            }
            if (timestamp === label.offset){
                drawCurvedOffset(timestamp, lineColor)
            }
        } else {
            waveformCTX.beginPath()
            waveformCTX.setLineDash([1, 1])
            waveformCTX.moveTo(x, 0)
            waveformCTX.lineTo(x, waveformCanvasRef.current.height)
            waveformCTX.lineWidth = 2
            waveformCTX.strokeStyle = lineColor
            waveformCTX.stroke()
            waveformCTX.setLineDash([])

            specCTX.beginPath()
            specCTX.setLineDash([1, 1])
            specCTX.moveTo(x, 0)
            specCTX.lineTo(x, specCanvasRef.current.height)
            specCTX.lineWidth = 2
            specCTX.strokeStyle = lineColor
            specCTX.stroke()
            specCTX.setLineDash([])
        }

        labelCTX.beginPath()
        labelCTX.setLineDash([1, 1])
        labelCTX.moveTo(x, 0)
        labelCTX.lineTo(x, y)
        labelCTX.lineWidth = 2
        labelCTX.strokeStyle = lineColor
        labelCTX.stroke()
        labelCTX.setLineDash([])
    }

    const drawLineBetween = (label) => {
        const cvs = labelCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true });

        const xOnset = calculateXPosition(label.onset)
        const xOffset = calculateXPosition(label.offset)
        const y = calculateYPosition(label)

        const lineColor = label.color

        ctx.lineWidth = 2
        ctx.strokeStyle = lineColor

        // Draw horizontal line
        ctx.beginPath()
        ctx.moveTo(xOnset, y)
        ctx.lineTo(xOffset, y)
        ctx.stroke()

        // Draw short Onset line
        ctx.beginPath()
        ctx.moveTo(xOnset, y - 3 )
        ctx.lineTo(xOnset, y + 1)
        ctx.stroke()

        // Draw short Offset line
        ctx.beginPath()
        ctx.moveTo(xOffset, y - 3 )
        ctx.lineTo(xOffset, y + 1)
        ctx.stroke()
    }

    const drawClustername = (label) => {
        const cvs = labelCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true })

        const xClustername = ( calculateXPosition(label.onset) + calculateXPosition(label.offset) ) / 2
        const y = calculateYPosition(label)

        const lineColor = label.color

        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillStyle = lineColor
        const text = label.clustername === 'Protected Area🔒' ? 'Protected Area' : label.clustername

        ctx.fillText(text, xClustername, y - 4);
    }

    const drawCurvedOnset = (curve_time, color) => {
        const cvs = specCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true })
        ctx.lineWidth = 2
        ctx.strokeStyle = color

        const n_bins = cvs.height

        //const curve_top_pos = (curve_time - currentStartTime) * globalSamplingRate / globalHopLength
        const curve_top_pos = calculateXPosition(curve_time)
        const curve_width = (0.5 * binsPerOctave / minFreq) * globalSamplingRate / globalHopLength
        const offset_para = curve_width * Math.pow(2, -n_bins / binsPerOctave)

        let xs = []
        for (let i = 0; i < cvs.width; i += 0.1){
            xs.push(i)
        }
        xs = xs.filter(x => x >= curve_top_pos + offset_para - curve_width && x <= curve_top_pos)

        let ys = xs.map(x => cvs.height - -binsPerOctave * Math.log2((curve_top_pos + offset_para - x) / curve_width))

        let i = 0
        let previousX = null
        let previousY = null
        for (let x of xs){
            const x1 = previousX ? previousX : x
            const x2 = x
            const y1 = previousY ? previousY : ys[i]
            const y2 = ys[i]
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
            previousX = x
            previousY = ys[i]
            i++
        }

        // Draw horizontal line connecting the bottom end of the curved line with the line in the label canvas
        let x1 = xs[0]
        let x2 = xs[xs.length-1]
        let y = cvs.height - 1

        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.lineWidth = 2
        ctx.strokeStyle = color
        ctx.stroke()
        ctx.setLineDash([])

        // Draw line inside the waveform
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d', { willReadFrequently: true })

        const x = curve_top_pos
        const y1 = 0
        const y2 = waveformCVS.height

        waveformCTX.beginPath()
        waveformCTX.moveTo(x, y1)
        waveformCTX.lineTo(x, y2)
        waveformCTX.lineWidth = 2
        waveformCTX.strokeStyle = color
        waveformCTX.stroke()
    }

    const drawCurvedOffset = (curve_time, color) => {
        const cvs = specCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true })
        ctx.lineWidth = 2
        ctx.strokeStyle = color

        const n_bins = cvs.height

        const curve_top_pos = calculateXPosition(curve_time)
        const curve_width = (0.5 * binsPerOctave / minFreq) * globalSamplingRate / globalHopLength
        const offset_para = curve_width * Math.pow(2, -n_bins / binsPerOctave)

        let xs = []
        for (let i = 0; i < cvs.width; i += 0.1){
            xs.push(i)
        }
        xs = xs.filter(x => x <= curve_top_pos - offset_para + curve_width && x >= curve_top_pos)

        let ys = xs.map(x => cvs.height - -binsPerOctave * Math.log2((x - (curve_top_pos - offset_para)) / curve_width))

        let i = 0
        let previousX = null
        let previousY = null
        for (let x of xs){
            const x1 = previousX ? previousX : x
            const x2 = x
            const y1 = previousY ? previousY : ys[i]
            const y2 = ys[i]
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
            previousX = x
            previousY = ys[i]
            i++
        }

        // Draw horizontal line connecting the bottom end of the curved line with the line in the label canvas
        let x1 = xs[0]
        let x2 = xs[xs.length-1]
        let y = cvs.height - 1
        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.lineWidth = 2
        ctx.strokeStyle = color
        ctx.stroke()
        ctx.setLineDash([])

        // Draw horizontal line connecting the top end of the curved line with the line in the waveform canvas
        x1 = xs[findClosestPositiveToZeroIndex(ys)]
        x2 = curve_top_pos
        y = 1
        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.lineWidth = 2
        ctx.strokeStyle = color
        ctx.stroke()
        ctx.setLineDash([])

        // Draw line inside the waveform
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d', { willReadFrequently: true })

        const x = curve_top_pos
        const y1 = 0
        const y2 = waveformCVS.height

        waveformCTX.beginPath()
        waveformCTX.moveTo(x, y1)
        waveformCTX.lineTo(x, y2)
        waveformCTX.lineWidth = 2
        waveformCTX.strokeStyle = color
        waveformCTX.stroke()
    }

    const drawAllLabels = () => {
        const cvs = labelCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true })
        ctx.clearRect(0, 0, cvs.width, cvs.height)

        // Draw dotted visual support lines
        for (let i = 1; i <= numberOfIndividuals; i++){
            const x1 = 0
            const x2 = cvs.width
            const y = i * HEIGHT_BETWEEN_INDIVIDUAL_LINES

            ctx.beginPath()
            ctx.setLineDash([1, 3])
            ctx.moveTo(x1, y)
            ctx.lineTo(x2, y)
            ctx.lineWidth = 1
            ctx.strokeStyle = ctx.strokeStyle = '#ffffff'
            ctx.stroke()
            ctx.setLineDash([])
        }

        for (let label of labels) {
            // If a user sets an onset without offset, the onset line will be drawn until he sets an offset, so he doesn't forget about it:
            if (!label.offset){
                drawLine(label, label.onset)
            }
            // Draw label that is being dragged and expanded label with extended lines
            if (label === clickedLabel || label.id === expandedLabel?.id){
                drawLine(label, label.onset)
                drawLine(label, label.offset)
                drawLineBetween(label)
                drawClustername(label)
            // Draw all other labels like this
            } else {
                drawLineBetween(label)
            }
        }
    }

    const drawIndividualsCanvas = () => {
        const cvs = individualsCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true })
        ctx.clearRect(0, 0, cvs.width, cvs.height)

        ctx.strokeStyle = '#ffffff'
        ctx.fillStyle = '#ffffff'
        ctx.lineWidth = 1.5

        let i = 1
        for (let speciesObj of speciesArray){
            // Draw Individual names
            for (let individual of speciesObj.individuals){
                ctx.font = `${10}px sans-serif`
                const textWidth = ctx.measureText(individual.name).width
                const x = cvs.width - textWidth - 5
                const y = i * HEIGHT_BETWEEN_INDIVIDUAL_LINES
                ctx.fillText(individual.name, x, y)
                i++
            }
            // Draw Species name
            const xSpeciesName = 0
            const ySpeciesName = (i - speciesObj.individuals.length) * HEIGHT_BETWEEN_INDIVIDUAL_LINES
            ctx.font = `${12}px sans-serif`
            ctx.fillText(speciesObj.name, xSpeciesName, ySpeciesName)

            // Draw line separating Species, except for the last one (Annotated Area)
            if (speciesObj.name === ANNOTATED_AREA) continue
            const x1 = 0
            const x2 = cvs.width
            const y = (i - 1) * HEIGHT_BETWEEN_INDIVIDUAL_LINES + 2
            ctx.beginPath()
            ctx.moveTo(x1, y)
            ctx.lineTo(x2, y)
            ctx.strokeStyle = ctx.strokeStyle = '#ffffff'
            ctx.stroke()
        }

    }

    /* ++++++++++++++++++ Label manipulation methods ++++++++++++++++++ */
        const addNewLabel = (onset) => {
        const individual = activeSpecies? activeSpecies.individuals.find(individual => individual.isActive): null
        const clustername = activeSpecies? activeSpecies.clusternames.find(clustername => clustername.isActive): null

        const allIndividualIDs = getAllIndividualIDs()
        const individualIndex = allIndividualIDs.indexOf(individual.id)

        const newLabel = new Label(
            nanoid(),
            trackData.trackIndex,
            trackData.filename,
            onset,
            undefined,
            activeSpecies.name,
            individual.name,
            clustername.name,
            activeSpecies.id,
            individual.id,
            clustername.id,
            individualIndex,
            null,
            clustername.color)

        setLabels( current => [...current, newLabel] )
    }

    const deleteLabel = (labelToBeDeleted) => {
        const filteredLabels = labels.filter(label => label !== labelToBeDeleted)
        setLabels(filteredLabels)
        passLabelsToApp(createGenericLabelObjects(filteredLabels), trackData.trackIndex)

        if (labelToBeDeleted === expandedLabel){
            setExpandedLabel(null)
            setGlobalMouseCoordinates(null)
        }
    }

    const flipOnsetOffset = (label) => {
        const newOnset = label.offset
        const newOffset = label.onset

        label.onset = newOnset
        label.offset = newOffset

        return label
    }

    const updateOnset = (event) => {
        clickedLabel.onset = calculateTimestamp(event)
    }

    const updateOffset = (event) => {
        clickedLabel.offset = calculateTimestamp(event)
    }

    const dragOnset = (event) => {
        const specCanvas = specCanvasRef.current
        const specCTX = specCanvas.getContext('2d', { willReadFrequently: true })
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d', { willReadFrequently: true })

        updateOnset(event)

        specCTX.clearRect(0, 0, specCanvas.width, specCanvas.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        drawFrequencyLines()
        //drawPlayhead(playheadRef.current.timeframe)
    }

    const dragOffset = (event) => {
        const specCanvas = specCanvasRef.current
        const specCTX = specCanvas.getContext('2d', { willReadFrequently: true })
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d', { willReadFrequently: true })

        updateOffset(event)

        specCTX.clearRect(0, 0, specCanvas.width, specCanvas.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        drawFrequencyLines()
        //drawPlayhead(playheadRef.current.timeframe)
    }

    const dragMaxFreqLine = (event) => {
        const specCVS = specCanvasRef.current
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true })
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d', { willReadFrequently: true })

        const newMaxFreqY = getMouseY(event)
        if (newMaxFreqY >= clickedFrequencyLinesObject.minFreqY - 5 ) return

        clickedFrequencyLinesObject.maxFreqY = newMaxFreqY

        specCTX.clearRect(0, 0, specCVS.width, specCVS.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        drawFrequencyLines()
    }

    const dragMinFreqLine = (event) => {
        const specCVS = specCanvasRef.current
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true })
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d', { willReadFrequently: true })

        const newMinFreqY = getMouseY(event)
        if (newMinFreqY <= clickedFrequencyLinesObject.maxFreqY + 5 ) return

        clickedFrequencyLinesObject.minFreqY = newMinFreqY

        specCTX.clearRect(0, 0, specCVS.width, specCVS.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        drawFrequencyLines()
    }

    const magnet = (timestamp) => {
        for (let label of labels){
            if (timestamp < label.onset + ZERO_GAP_CORRECTION_MARGIN && timestamp > label.onset - ZERO_GAP_CORRECTION_MARGIN){
                return label.onset
            }
            if (timestamp < label.offset + ZERO_GAP_CORRECTION_MARGIN && timestamp > label.offset - ZERO_GAP_CORRECTION_MARGIN){
                return label.offset
            }
        }
        return timestamp
    }

    const assignSpeciesInformationToImportedLabels = (genericLabelObjectsArray) => {
        const allIndividualIDs = getAllIndividualIDs()

        // Iterate over the imported labels array
        return genericLabelObjectsArray.map( label => {

            // Create a new Label object with the imported values
            const updatedLabel = new Label(
                nanoid(),
                trackData.trackIndex,
                trackData.filename,
                label.onset,
                label.offset,
                label.species,
                label.individual,
                label.clustername,
                null,
                null,
                null,
                null,
                null,
                null
            )

            // Iterate over speciesArray and assign the new label it's correct IDs and color from existing
            for (const speciesObj of speciesArray) {
                if (updatedLabel.species === speciesObj.name) {
                    updatedLabel.speciesID = speciesObj.id
                    for (const individual of speciesObj.individuals) {
                        if (updatedLabel.individual === individual.name) {
                            updatedLabel.individualID = individual.id
                            updatedLabel.individualIndex = allIndividualIDs.indexOf(individual.id)
                        }
                    }
                    for (const clustername of speciesObj.clusternames) {
                        if (updatedLabel.clustername === clustername.name) {
                            updatedLabel.clusternameID = clustername.id
                            updatedLabel.color = clustername.color
                        }
                    }
                }
            }

            return updatedLabel
        })
    }


    /* ++++++++++++++++++ Overview Bar Methods ++++++++++++++++++ */

    const handleLMBDownOverview = (event) => {
        // Ignore clicks from other mouse buttons
        if (event.button !== 0) return

        const mouseX = getMouseX(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + globalClipDuration)

        // Deal with click on Start Frame
        if (!strictMode && mouseX >= xStartFrame - 2 && mouseX <= xStartFrame + 2){
            overviewRef.current.style.cursor = 'col-resize'
            overviewRef.current.addEventListener('mousemove', dragStartFrame)
            overviewRef.current.addEventListener('mouseleave', stopDragViewport)
            return
        }

        // Deal with click on End Frame
        if (!strictMode && mouseX >= xEndFrame - 2 && mouseX <= xEndFrame + 2){
            overviewRef.current.addEventListener('mousemove', dragEndFrame)
            overviewRef.current.addEventListener('mouseleave', stopDragViewport)
            return
        }

        // Deal with click inside viewport
        if (mouseX > xStartFrame && mouseX < xEndFrame){
            const xStartTime = calculateViewportFrameX(currentStartTime)
            const xCurrentEndTime = calculateViewportFrameX(currentEndTime)
            widthBetween_xStartTime_mouseX = mouseX - xStartTime
            widthBetween_xEndTime_mouseX = xCurrentEndTime - mouseX
            overviewRef.current.addEventListener('mousemove', dragViewport)
            overviewRef.current.addEventListener('mouseleave', stopDragViewport)
        }
    }

    const stopDragViewport = () => {
        overviewRef.current.removeEventListener('mousemove', dragStartFrame)
        overviewRef.current.removeEventListener('mousemove', dragEndFrame)
        overviewRef.current.removeEventListener('mousemove', dragViewport)
        overviewRef.current.removeEventListener('mouseleave', stopDragViewport)

        // Set new Viewport (Start & Endframe). This happens when the user drags the overview scroll bar
        if (widthBetween_xStartTime_mouseX && (newViewportStartFrame || newViewportStartFrame)){
            const newDuration = newViewportEndFrame - newViewportStartFrame
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentStartTimeToApp( newViewportStartFrame )
            passCurrentEndTimeToApp( newViewportEndFrame )
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO)
            // Set new Start Frame only
        } else if (newViewportStartFrame){
            const newDuration = currentEndTime - newViewportStartFrame
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            const newHopLength = Math.floor( (newDuration * globalSamplingRate) / globalNumSpecColumns )
            updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newViewportStartFrame, currentEndTime)
            // Set new End frame only
        } else if (newViewportEndFrame){
            const newDuration = newViewportEndFrame - currentStartTime
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            const newHopLength = Math.floor( (newDuration * globalSamplingRate) / globalNumSpecColumns )
            updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, currentStartTime, newViewportEndFrame)
        }

        newViewportStartFrame = null
        newViewportEndFrame = null
        widthBetween_xStartTime_mouseX = null
        widthBetween_xEndTime_mouseX = null
    }

    const handleMouseUpOverview = (event) => {
        if (event.button !== 0) return
        stopDragViewport()
    }

    const dragStartFrame = (event) => {
        const mouseX = getMouseX(event)
        newViewportStartFrame = calculateViewportTimestamp(mouseX)

        // Prevent the user from setting the viewport too small or the start Frame to go beyond the end Frame
        if (newViewportStartFrame > currentEndTime - 0.05){
            newViewportStartFrame = currentEndTime - 0.05
        }

        drawViewport(newViewportStartFrame, currentEndTime, 'white', 2)
    }

    const dragEndFrame = (event) => {
        const mouseX = getMouseX(event)
        newViewportEndFrame = calculateViewportTimestamp(mouseX)

        // Prevent the user from setting the viewport too small or the end Frame to go before the start Frame
        if (newViewportEndFrame < currentStartTime + 0.05){
            newViewportEndFrame = currentStartTime + 0.05
        }

        drawViewport(currentStartTime, newViewportEndFrame, 'white', 2)
    }

    const dragViewport = (event) => {
        const mouseX = getMouseX(event)
        const viewportWidth = widthBetween_xStartTime_mouseX + widthBetween_xEndTime_mouseX
        newViewportStartFrame = calculateViewportTimestamp(mouseX - widthBetween_xStartTime_mouseX)
        newViewportEndFrame = calculateViewportTimestamp(mouseX + widthBetween_xEndTime_mouseX)
        // Prevent Viewport Start Frame from going below 0
        if (newViewportStartFrame < 0){
            newViewportStartFrame = 0
            newViewportEndFrame = calculateViewportTimestamp( viewportWidth )
            return
        }
        // Prevent Viewport End Frame from going above the Audio Duration
        if (newViewportEndFrame > globalAudioDuration){
            newViewportStartFrame = calculateViewportTimestamp(overviewRef.current.width - viewportWidth )
            newViewportEndFrame = globalAudioDuration
            return
        }
        drawViewport(newViewportStartFrame, newViewportEndFrame, 'white', 4)
    }

    const calculateViewportTimestamp = (mouseX) => {
        return globalAudioDuration * (mouseX / overviewRef.current.width)
    }

    const calculateViewportFrameX = (timestamp) => {
        return timestamp * overviewRef.current.width / globalAudioDuration
    }

    const updateViewportScrollButtons = (startFrame, endFrame) => {
        const leftScrollBtn = document.getElementById('left-scroll-overview-btn')
        const rightScrollBtn = document.getElementById('right-scroll-overview-btn')
        const xLeftBtn = calculateViewportFrameX(startFrame) + 185
        const xRightBtn = calculateViewportFrameX(endFrame) + 205
        leftScrollBtn.style.left = `${xLeftBtn}px`
        rightScrollBtn.style.left = `${xRightBtn}px`
    }

    const drawViewport = (startFrame, endFrame, hexColorCode, lineWidth) => {
        const overviewCanvas = overviewRef.current
        const ctx = overviewCanvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, overviewCanvas.width, overviewCanvas.height);

        // Draw horizontal line representing the audio track
        ctx.lineWidth = 2
        ctx.strokeStyle = '#b6b1ff'
        ctx.beginPath()
        ctx.moveTo(0, 5)
        ctx.lineTo(overviewCanvas.width, 5)
        ctx.stroke()

        const x1 = calculateViewportFrameX(startFrame)
        const x2 = calculateViewportFrameX(endFrame)
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = hexColorCode

        // Draw start frame
        ctx.beginPath()
        ctx.moveTo(x1, 0)
        ctx.lineTo(x1, overviewCanvas.height)
        ctx.stroke()

        // Draw end frame
        ctx.beginPath()
        ctx.moveTo(x2, 0)
        ctx.lineTo(x2, overviewCanvas.height)
        ctx.stroke()

        // Draw Top line
        ctx.beginPath()
        ctx.moveTo(x1, 0)
        ctx.lineTo(x2, 0)
        ctx.stroke()

        // Draw Bottom line
        ctx.beginPath()
        ctx.moveTo(x1, overviewCanvas.height)
        ctx.lineTo(x2, overviewCanvas.height)
        ctx.stroke()

        // Draw Viewport Timestamps
        ctx.font = `10px Arial`;
        ctx.fillStyle = hexColorCode
        const timestampText = (Math.round(startFrame * 100) / 100).toString()
        ctx.fillText(timestampText, x1 + 5, overviewCanvas.height-5)

        // Update Scroll Button positions
        updateViewportScrollButtons(startFrame, endFrame)
    }

    const handleMouseMoveOverview = (event) => {
        hoverViewportFrame(event)
    }

    const hoverViewportFrame = (event) => {
        if (strictMode) return

        const xHovered = getMouseX(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + globalClipDuration)

        // Deal with click on Start Frame
        if ( (xHovered >= xStartFrame - 2 && xHovered <= xStartFrame + 2) || (xHovered >= xEndFrame - 2 && xHovered <= xEndFrame + 2) ){
            overviewRef.current.style.cursor = 'col-resize'
        } else {
            overviewRef.current.style.cursor = 'default'
        }
    }

    const leftScrollOverview = () => {
        passCurrentStartTimeToApp(
            prevStartTime => Math.max(prevStartTime - globalClipDuration, 0)
        )
        passCurrentEndTimeToApp(
            prevEndTime => Math.max(prevEndTime - globalClipDuration, globalClipDuration)
        )
    }

    const rightScrollOverview = () => {
        passCurrentStartTimeToApp(
            prevStartTime => Math.min(prevStartTime + globalClipDuration, maxScrollTime)
        )
        passCurrentEndTimeToApp(
            prevEndTime => Math.min(prevEndTime + globalClipDuration, globalAudioDuration)
        )
    }

    /* ++++++++++++++++++ Audio methods ++++++++++++++++++ */
    const getAudio = async (newStartTime, newEndTime) => {
        // Prevent user from clicking the play button twice in a row and playing the audio twice at the same time
        if (audioSnippet && !audioSnippet.paused) return

        // If the requested play start time hasn't changed and the current audio time is unequal to the start time, resume playback and return
        if (newStartTime === playWindowStartTime && audioSnippet && audioSnippet.currentTime !== newStartTime){
            playAudio()
            return
        }

        // Else, start process to get a new audio snippet
        setAudioSnippet(null)
        setPlayWindowStartTime(newStartTime)

        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-wav'
        try {
            const response = await axios.post(path, {
                audio_id: audioId,
                start_time: newStartTime,
                clip_duration: newEndTime
            })
            handleNewAudio(response.data.wav);
        } catch (error) {
            console.error("Error fetching audio clip:", error);
        }
    }

    const handleNewAudio = (newAudioBase64String) => {
        const audio = new Audio(`data:audio/ogg;base64,${newAudioBase64String}`);
        setAudioSnippet(audio)
    }

    const playAudio = () => {
        audioSnippet.play()
        loop()
    }

    function loop(){
        if (audioSnippet.paused) return

        clearAndRedrawCanvases()
        drawPlayhead(playWindowStartTime + audioSnippet.currentTime)

        window.requestAnimationFrame(() => loop() )
    }

    const pauseAudio = () => {
        if (!audioSnippet) return
        audioSnippet.pause()
        updatePlayhead(playWindowStartTime + audioSnippet.currentTime)
    }

    const stopAudio = () => {
        if (!audioSnippet) return

        audioSnippet.pause()
        audioSnippet.currentTime = playWindowStartTime
        updatePlayhead(playWindowStartTime)

        clearAndRedrawCanvases()
    }

    const clearAndRedrawCanvases = () => {
        const specCVS = specCanvasRef.current
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true });
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d', { willReadFrequently: true });
        specCTX.clearRect(0, 0, specCVS.width, specCVS.height);
        specCTX.putImageData(specImgData.current, 0, 0);
        waveformCTX.clearRect(0, 0, waveformCVS.width, waveformCVS.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)
        drawAllLabels()
        drawFrequencyLines()
    }

    const drawPlayhead = (timeframe) => {
        const specCVS = specCanvasRef.current
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true });
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d', { willReadFrequently: true });

        const x = calculateXPosition(timeframe)

        specCTX.beginPath()
        specCTX.moveTo(x, 0)
        specCTX.lineTo(x, specCVS.height)
        specCTX.lineWidth = 2
        specCTX.strokeStyle = "red"
        specCTX.stroke()

        waveformCTX.beginPath()
        waveformCTX.moveTo(x, 0)
        waveformCTX.lineTo(x, waveformCVS.height)
        waveformCTX.lineWidth = 2
        waveformCTX.strokeStyle = "red"
        waveformCTX.stroke()
    }

    const updatePlayhead = (newTimeframe) => {
        playheadRef.current.timeframe = newTimeframe
    }


    /* ++++++++++++++++++ Waveform ++++++++++++++++++ */
    const getAudioArray = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-for-visualization'
        const requestParameters = {
            audio_id: audioId,
            start_time: currentStartTime,
            clip_duration: globalClipDuration,
            target_length: 100000
        }

        const response = await axios.post(path, requestParameters);

        return response.data.wav_array
    }

    const drawWaveform = (newAudioArray) => {
        if (!waveformCanvasRef.current || !newAudioArray) return

        const canvas = waveformCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
        canvas.width = parent.innerWidth - 200

        const centerY = canvas.height / 2
        const ratio = Math.min((trackData.audioDuration - currentStartTime) / globalClipDuration, 1)
        ctx.strokeStyle = '#ddd8ff'

        for (let i=0; i < newAudioArray.length; i++) {
            const datapoint = newAudioArray[i]
            const y = centerY + waveformScale * datapoint

            ctx.beginPath()
            ctx.moveTo(i * canvas.width * ratio / newAudioArray.length, y)
            ctx.lineTo((i + 1) * canvas.width * ratio / newAudioArray.length, centerY + waveformScale * newAudioArray[i + 1])
            ctx.stroke()
        }

        // Draw flat line representing silence
        ctx.beginPath()
        ctx.moveTo(canvas.width * ratio ,centerY)
        ctx.lineTo(canvas.width, centerY)
        ctx.stroke()

        waveformImgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

     const waveformZoomIn = () => {
        setWaveformScale(prevState => prevState * 1.3)
     }

     const waveformZoomOut = () => {
         setWaveformScale(prevState => Math.max(prevState * 0.7, 1))
     }

    const toggleShowWaveform = () => {
        if (!spectrogram) return
        setShowWaveform(!showWaveform)
    }


    /* ++++++++++++++++++ Tracks ++++++++++++++++++ */

    const handleRemoveTrack = () => {
        if (!confirm('Removing this track will delete any annotations you have made in it.')) return

        removeTrackInApp(trackID)
    }

    /* ++++++++++++++++++ Editor Container ++++++++++++++++++ */
    const handleMouseLeave = () => {
        const newestLabel = labels[labels.length -1]
        if (newestLabel && !newestLabel.offset){
            deleteLabel(newestLabel)
            passActiveLabelToApp({onset: undefined, offset: undefined, color: undefined, trackId: undefined})
        }
    }

    /* ++++++++++++++++++ Frequencies Axis ++++++++++++++++++ */
    const drawFrequenciesAxis = (frequenciesArray) => {
        if (!frequenciesCanvasRef.current) return

        const cvs = frequenciesCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true, alpha: true })
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        ctx.strokeStyle = '#ffffff'
        ctx.fillStyle = '#ffffff'
        ctx.lineWidth = 1.5

        // Calculate the index distance to select 5 frequencies between the first and last value
        const indexDistance = Math.floor((frequenciesArray.length - 2) / 6)

        // Initialize the indices array with the indices of the selected frequencies
        let indices = [0] // Include the first frequency
        for (let i = 1; i <= 5; i++) {
            indices.push(i * indexDistance)
        }
        indices.push(frequenciesArray.length - 1) // Include the last frequency

        // Get the frequencies at the selected indices
        const selectedFrequencies = indices.map(index => frequenciesArray[index])

        // Draw the frequencies
        const correctionValue = showWaveform ? 0 : 20
        const lineDistance = (cvs.height + correctionValue) / selectedFrequencies.length
        let y = cvs.height
        const x1 = cvs.width - 10
        const x2 = cvs.width
        let i = 0
        for (let freq of selectedFrequencies){
            let textY = y
            let freqText = `${Math.round(freq / 10) * 10}`
            if (!showWaveform){
                if (i === 0){
                    freqText += ' Hz'
                }
                if (i > 0 && i < 6){
                    textY += 4
                }
                if (i === 6){
                    textY += 8
                }
            }
            ctx.beginPath()
            ctx.moveTo(x1,y)
            ctx.lineTo(x2, y)
            ctx.stroke()
            ctx.fillText(freqText, 0, textY);
            y -= lineDistance
            i++
        }

        if (showWaveform){
            ctx.fillText('Hz', 0, 10);
        }

    }

    const handleClickFrequencyLinesBtn = () => {
        setShowFrequencyLines(prevState => !prevState)
    }

    const getFrequencyAtMousePosition = (mouseY, canvasHeight, arrayLength ) => {
        let index = Math.floor(((canvasHeight - mouseY) / canvasHeight) * arrayLength)
        index = index >= arrayLength ? arrayLength - 1 : index
        return Math.round(frequencies[index])
    }

    const drawFrequencyLines = () => {
        if (!showFrequencyLines) return

        const cvs = specCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true, alpha: true })

        ctx.strokeStyle = FREQUENCY_LINES_COLOR
        ctx.fillStyle = FREQUENCY_LINES_COLOR
        ctx.lineWidth = 2
        const triangleHeight = 7

        // Draw Max Frequency
        let x1 = 0
        let x2 = cvs.width
        let y = frequencyLines.maxFreqY
        const currentMaxFreq = `${getFrequencyAtMousePosition(y, cvs.height, frequencies.length)} Hz`
        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
        ctx.fillText(currentMaxFreq, 0, frequencyLines.maxFreqY + 10)

        // Draw Top Triangle
        x1 = 5
        x2 = x1 + triangleHeight
        let x3 = x2 + triangleHeight
        let y1 = frequencyLines.maxFreqY
        let y2 = frequencyLines.maxFreqY - triangleHeight
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x3, y1)
        ctx.fill()

        // Draw Min Frequency
        x1 = 0
        x2 = cvs.width
        y = frequencyLines.minFreqY - 1
        const currentMinFreq = `${getFrequencyAtMousePosition(y, cvs.height, frequencies.length)} Hz`
        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
        ctx.fillText(currentMinFreq, 0, frequencyLines.minFreqY - 4)

        // Draw Bottom Triangle
        x1 = 5
        x2 = x1 + triangleHeight
        x3 = x2 + triangleHeight
        y1 = frequencyLines.minFreqY
        y2 = frequencyLines.minFreqY + triangleHeight
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x3, y1)
        ctx.fill()
    }


    /* ++++++++++++++++++ Whisper ++++++++++++++++++ */
    const callWhisperSeg = async () => {
        setWhisperSegIsLoading(true)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-labels'

        // Extract annotated areas from the labels array
        const annotatedAreas = labels.reduce( (acc, label) => {
            if (label.species === ANNOTATED_AREA) {
                acc.push({
                    annotatedAreaStarTime: label.onset,
                    annotatedAreaEndTime: label.offset
                })
                return acc
            }
            return acc
        }, [])


        // Remove the Annotated Area labels from labels
        let newLabelsArray = labels.filter( label => label.species !== ANNOTATED_AREA )

        // Convert custom label objects into generic objects with the specific data that is needed for Whisper
        newLabelsArray = newLabelsArray.map( label => {
                return {
                    onset: label.onset,
                    offset: label.offset,
                    species: label.species,
                    individual: label.individual,
                    clustername: label.clustername,
                    speciesID: label.speciesID,
                    individualID: label.individualID,
                    clusternameID: label.clusternameID,
                    filename: label.filename,
                    trackIndex: label.trackIndex,
                }
            }
        )

        console.log(newLabelsArray)

        const requestParameters = {
            audio_id: audioId,
            annotated_areas: annotatedAreas,
            human_labels: newLabelsArray
        }

        console.log(requestParameters)

        const response = await axios.post(path, requestParameters)

        const whisperObjects = response.data.labels

        // Currently assign all labels returned by Whisper as Unknonw Species, Individual and Clustername, until Whisper support is implemented
        const unknownSpecies = speciesArray.find( species => species.name === UNKNOWN_SPECIES)
        const unknownIndividual = unknownSpecies.individuals.find( individual => individual.name === UNKNOWN_INDIVIDUAL)
        const unknownClustername = unknownSpecies.clusternames.find( clustername => clustername.name === UNKNOWN_CLUSTERNAME)

        const whisperLabels = whisperObjects.map( obj => {
            return new Label(
                nanoid(),
                trackData.trackIndex,
                trackData.filename,
                obj.onset,
                obj.offset,
                unknownSpecies.name,
                unknownIndividual.name,
                unknownClustername.name,
                unknownSpecies.id,
                unknownIndividual.id,
                unknownClustername.id,
                0,
                'Whisper',
                unknownClustername.color
            )
        })

        const combinedLabelsArray = labels.concat(whisperLabels)
        setLabels(combinedLabelsArray)
        passLabelsToApp(createGenericLabelObjects(combinedLabelsArray), trackData.trackIndex)
        setWhisperSegIsLoading(false)
    }


    /* ++++++++++++++++++ UseEffect Hooks ++++++++++++++++++ */

    // When labels or the Waveform Scale value are manipulated
    useEffect( () => {
        if (!spectrogram || !audioArray) return
        drawEditorCanvases(spectrogram, frequencies,audioArray)
    }, [labels, waveformScale, showWaveform, expandedLabel, showFrequencyLines] )

    // When a user adds a new label, thus creating a new active label in the other tracks
    useEffect( () => {
        if (!spectrogram ||
            trackID === activeLabel?.trackId ||
            activeSpecies.name === ANNOTATED_AREA) return

        drawActiveLabel(audioArray)
    }, [activeLabel] )

    // When a user adds, deletes, renames or recolors species, individuals or clusternames in the Annotation Labels Component
    useEffect(() => {
        if (!speciesArray) return

        const allIndividualIDs = getAllIndividualIDs()

        // Iterate over the labels array
        let updatedLabels = labels
            .map(label => {
                // Create an updated label with old values
                const updatedLabel = new Label(
                    label.id,
                    trackData.trackIndex,
                    trackData.filename,
                    label.onset,
                    label.offset,
                    label.species,
                    label.individual,
                    label.clustername,
                    label.speciesID,
                    label.individualID,
                    label.clusternameID,
                    label.individualIndex,
                    label.annotator,
                    label.color
                )

                // Iterate over speciesArray and update the potentially new names, colors and individualIndexes to updatedLabel
                for (const speciesObj of speciesArray) {
                    if (updatedLabel.speciesID === speciesObj.id) {
                        updatedLabel.species = speciesObj.name
                    }
                    for (const individual of speciesObj.individuals) {
                        if (updatedLabel.individualID === individual.id) {
                            updatedLabel.individual = individual.name
                            updatedLabel.individualIndex = allIndividualIDs.indexOf(individual.id)
                        }
                    }
                    for (const clustername of speciesObj.clusternames) {
                        if (updatedLabel.clusternameID === clustername.id) {
                            updatedLabel.clustername = clustername.name
                            updatedLabel.color = clustername.color
                        }
                    }
                }

                return updatedLabel
            })
            // Remove labels that have a species, Individual or clustername that have been deleted in Annotation Label Component
            .filter(label =>
                label.speciesID !== deletedItemID &&
                label.individualID !== deletedItemID &&
                label.clusternameID !== deletedItemID
            )

        // If imported CSV labels exist, add them now
        if (csvImportedLabels){
            const newCsvImportedLabels = assignSpeciesInformationToImportedLabels(csvImportedLabels)
            updatedLabels = updatedLabels.concat(newCsvImportedLabels)
        }

        setLabels(updatedLabels)
        passLabelsToApp(createGenericLabelObjects(updatedLabels), trackData.trackIndex)

    }, [speciesArray])

    // When user zoomed or scrolled
    useEffect( () => {
            if (!globalClipDuration || !trackData.audioID) return

            if (audioSnippet) {
                audioSnippet.pause()
                audioSnippet.currentTime = currentStartTime
            }

            getSpecAndAudioArray()

    }, [currentStartTime, globalClipDuration, audioId])


    // When a new audio file was uploaded
    useEffect( () => {
            if (!trackData.audioID) return

            // Update track specific values
            setAudioId(trackData.audioID)
            setSpectrogramIsLoading(true)

            // Close Label Window
            setExpandedLabel(null)

            const importedLabelsSource = audioPayload && audioPayload.labels ? audioPayload.labels : csvImportedLabels

            // Add imported labels to the labels array
            if (importedLabelsSource){
                const updatedLabels = assignSpeciesInformationToImportedLabels(importedLabelsSource)
                setLabels(updatedLabels)
                passLabelsToApp(createGenericLabelObjects(updatedLabels), trackData.trackIndex)

            // If there's no audio payload labels nor CSV imported labels delete all existing labels on this track
            } else {
                setLabels([])
                passLabelsToApp([], trackData.trackIndex)
            }

    }, [trackData.audioID])

                    /*
    // When a new CSV File was uploaded
    useEffect( () => {
        if (!csvImportedLabels) return

        const updatedLabels = assignSpeciesInformationToImportedLabels(csvImportedLabels)
        setLabels(updatedLabels)
        passLabelsToApp(createGenericLabelObjects(updatedLabels), trackData.trackIndex)

    }, [csvImportedLabels])
*/

    // When a new audio snippet is returned from the backend
    useEffect( () => {
        if (!audioSnippet) return
        playAudio()
    }, [audioSnippet] )

    // When globalAudioDuration is updated in the App component
    useEffect( () => {
        if (!globalAudioDuration || !trackData.audioID ) return

        playheadRef.current.timeframe = 0

        // This makes the zoom in level to show the newest track fully (necessary for upload by url)
        if (strictMode){
            const newDuration = globalHopLength / globalSamplingRate * globalNumSpecColumns
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            const newStartTime = 0
            const newEndTime = newStartTime + newDuration
            updateClipDurationAndTimes(globalHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime)
            return
        }

        // This makes the zoom in level to show the largest track fully (better for multiple files locally)
        const newHopLength = Math.floor( (globalAudioDuration * globalSamplingRate) / globalNumSpecColumns )
        const newDuration = newHopLength / globalSamplingRate * globalNumSpecColumns
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = 0
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime)

    }, [trackData.audioID, globalAudioDuration] )

    // When on of the audio payloads in the URL data parameter was assigned to this track
    useEffect( () => {
        if (!audioPayload) return
        uploadFileByURL(audioPayload)

        setAnnotationInstance(audioPayload.annotation_instance)
        //setFilename(audioPayload.filename)

    }, [audioPayload])


    return (
        <div
            className='editor-container'
            onMouseLeave={handleMouseLeave}
        >
            {showOverviewInitialValue && trackData &&
                <div className='overview-time-axis-container'>
                    <canvas
                        className='overview-canvas'
                        ref={overviewRef}
                        width={parent.innerWidth - 200}
                        height={40}
                        onMouseDown={handleLMBDownOverview}
                        onMouseUp={handleMouseUpOverview}
                        onContextMenu={(event) => event.preventDefault()}
                        onMouseMove={handleMouseMoveOverview}
                    />
                    <button
                        id='left-scroll-overview-btn'
                        onClick={leftScrollOverview}
                    />
                    <button
                        id='right-scroll-overview-btn'
                        onClick={rightScrollOverview}
                    />
                    <canvas
                        className='time-axis-canvas'
                        ref={timeAxisRef}
                        width={parent.innerWidth - 200}
                        height={40}
                        onContextMenu={(event) => event.preventDefault()}
                    />
                </div>
            }
            <div className='track-container'>
                <div className={showWaveform ? 'side-window' : 'side-window-small'}>
                    <div className={showWaveform ? 'track-controls' : 'track-controls-small'}>
                        <LocalFileUpload
                            filename={trackData.filename}
                            trackID={trackID}
                            specCalMethod={specCalMethod}
                            nfft={nfft}
                            binsPerOctave={binsPerOctave}
                            minFreq={minFreq}
                            maxFreq={maxFreq}
                            passSpectrogramIsLoadingToScalableSpec={passSpectrogramIsLoadingToScalableSpec}
                            handleUploadResponse={handleUploadResponse}
                            handleUploadError={handleUploadError}
                            strictMode={strictMode}
                        />
                        <div>
                            <Tooltip title="Change Track Parameters">
                                <IconButton style={activeIconBtnStyle}
                                            onClick={() => setShowLocalConfigWindow(true)}>
                                    <TuneIcon style={activeIcon}/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Call WhisperSeg">
                                <IconButton
                                    style={{...activeIconBtnStyle, ...(strictMode || !audioId && iconBtnDisabled)}}
                                    disabled={strictMode || !audioId}
                                    onClick={callWhisperSeg}
                                >
                                    <AutoFixHighIcon style={activeIcon}/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Frequency Range">
                                <IconButton
                                    style={activeIconBtnStyle}
                                    onClick={handleClickFrequencyLinesBtn}
                                >
                                    <DensityLargeIcon style={{...activeIcon, ...(showFrequencyLines && {color: FREQUENCY_LINES_COLOR})}}/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={showWaveform ? 'Hide Waveform' : 'Show Waveform'}>
                                <IconButton style={activeIconBtnStyle}
                                            onClick={toggleShowWaveform}>
                                    <GraphicEqIcon style={activeIcon}/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={`${showLabelAndIndividualsCanvas ? 'Hide' : 'Show'} Annotations Panel`}>
                                <IconButton
                                    style={activeIconBtnStyle}
                                    onClick={() => setShowLabelAndIndividualsCanvas(prevState => !prevState)}
                                >
                                    {showLabelAndIndividualsCanvas ? <ExpandLessIcon style={activeIcon}/> : <ExpandMoreIcon style={activeIcon}/>}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Track">
                                <IconButton
                                    style={{...activeIconBtnStyle, ...(strictMode || showOverviewInitialValue && iconBtnDisabled)}}
                                    disabled={strictMode || showOverviewInitialValue}
                                    onClick={handleRemoveTrack}
                                >
                                    <DeleteIcon style={activeIcon}/>
                                </IconButton>
                            </Tooltip>
                        </div>
                        <div className='audio-controls'>
                            <IconButton style={iconBtn}
                                        onClick={() => getAudio(currentStartTime, globalClipDuration)}>
                                <PlayArrowIcon style={activeIcon}/>
                            </IconButton>
                            <IconButton style={iconBtn} onClick={pauseAudio}>
                                <PauseIcon style={activeIcon}/>
                            </IconButton>
                            <IconButton style={iconBtn} onClick={stopAudio}>
                                <StopIcon style={activeIcon}/>
                            </IconButton>
                        </div>
                        <Parameters
                            showLocalConfigWindow={showLocalConfigWindow}
                            specCalMethod={specCalMethod}
                            nfft={nfft}
                            binsPerOctave={binsPerOctave}
                            minFreq={minFreq}
                            maxFreq={maxFreq}
                            passShowLocalConfigWindowToScalableSpec={passShowLocalConfigWindowToScalableSpec}
                            passSpecCalMethodToScalableSpec={passSpecCalMethodToScalableSpec}
                            passNfftToScalableSpec={passNfftToScalableSpec}
                            passBinsPerOctaveToScalableSpec={passBinsPerOctaveToScalableSpec}
                            passMinFreqToScalableSpec={passMinFreqToScalableSpec}
                            passMaxFreqToScalableSpec={passMaxFreqToScalableSpec}
                            submitLocalParameters={submitLocalParameters}
                            strictMode={strictMode}
                        />
                    </div>
                    <div className='waveform-buttons-frequencies-canvas-container'>
                        <div className={showWaveform ? 'waveform-buttons' : 'hidden'}>
                            <IconButton style={freqBtn} onClick={waveformZoomIn}>
                                <ZoomInIcon style={icon}/>
                            </IconButton>
                            <IconButton style={freqBtn} onClick={waveformZoomOut}>
                                <ZoomOutIcon style={icon}/>
                            </IconButton>
                        </div>
                        <canvas
                            className={showWaveform ? 'frequencies-canvas' : 'frequencies-canvas-small'}
                            ref={frequenciesCanvasRef}
                            width={40}
                            height={showWaveform ? 140 : 120}
                        />
                    </div>
                    <canvas
                        className={showLabelAndIndividualsCanvas ? 'individuals-canvas' : 'hidden'}
                        ref={individualsCanvasRef}
                        width={200}
                        height={numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES}
                    />
                </div>

                <div className='waveform-spec-labels-canvases-container'
                     onMouseLeave={handleMouseLeaveCanvases}>
                    <canvas
                        className={showWaveform ? 'waveform-canvas' : 'hidden'}
                        ref={waveformCanvasRef}
                        width={parent.innerWidth - 200}
                        height={60}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    <canvas
                        className='spec-canvas'
                        ref={specCanvasRef}
                        width={parent.innerWidth - 200}
                        height={120}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    <canvas
                        className={showLabelAndIndividualsCanvas ? 'label-canvas' : 'hidden'}
                        ref={labelCanvasRef}
                        width={parent.innerWidth - 200}
                        height={numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    {
                        expandedLabel &&
                        createPortal(
                            <LabelWindow
                                speciesArray={speciesArray}
                                labels={labels}
                                expandedLabel={expandedLabel}
                                passLabelsToScalableSpec={passLabelsToScalableSpec}
                                passExpandedLabelToScalableSpec={passExpandedLabelToScalableSpec}
                                getAllIndividualIDs={getAllIndividualIDs}
                                globalMouseCoordinates={globalMouseCoordinates}
                                getAudio={getAudio}
                            />,
                            document.body
                        )
                    }
                    {spectrogramIsLoading || whisperSegIsLoading ?
                        <Box sx={{width: '100%'}}><LinearProgress/></Box> : ''}
                </div>

            </div>
        </div>
    )
}

export default ScalableSpec;