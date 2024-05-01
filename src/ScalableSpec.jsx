import React, {useEffect, useRef, useState} from 'react';
import axios from 'axios';
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import BackupIcon from '@mui/icons-material/Backup';
import DeleteIcon from '@material-ui/icons/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import TuneIcon from '@mui/icons-material/Tune';
import {nanoid} from "nanoid";
import {Label} from "./label.js"
import {iconBtnStyle, iconStyle} from "./styles.js"
import Export from "./Export.jsx";
import LocalFileUpload from "./LocalFileUpload.jsx";
import Parameters from "./Parameters.jsx"
import LabelWindow from "./LabelWindow.jsx";
import SettingsIcon from "@mui/icons-material/Settings.js";

// Classes

class Playhead{
    constructor(timeframe) {
        this.timeframe = timeframe
    }
}

// Global variables
const DEFAULT_LABEL_COLOR = "#fff"
const HEIGHT_BETWEEN_INDIVIDUAL_LINES = 15
const ZERO_GAP_CORRECTION_MARGIN = 0.0005


function ScalableSpec(
                        {
                            id,
                            trackDurations,
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
                            passTrackDurationToApp,
                            deletePreviousTrackDurationInApp,
                            removeTrackInApp,
                            globalHopLength,
                            globalNumSpecColumns,
                            globalSamplingRate,
                            passGlobalHopLengthToApp,
                            passGlobalNumSpecColumnsToApp,
                            passGlobalSamplingRateToApp,
                            updateClipDurationAndTimes,
                            passDefaultConfigToApp,
                            audioPayload
                        }
                    )
                {

    // General
    const [audioId, setAudioId] = useState(null);

    // Spectrogram
    const specCanvasRef = useRef(null);
    const specImgData = useRef(null)
    const [spectrogram, setSpectrogram] = useState(null);

    // Frequency
    const [frequencies, setFrequencies] = useState(null)
    const frequenciesCanvasRef = useRef(null)

    // Individuals Canvas
    const individualsCanvasRef = useRef(null)
    const numberOfIndividuals = speciesArray.reduce((total, speciesObj) => total + speciesObj.individuals.length, 0)

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

    // Waveform
    const waveformCanvasRef = useRef(null)
    const waveformImgData = useRef(null)
    const [audioArray, setAudioArray] = useState(null)
    const [waveformScale, setWaveformScale] = useState(35)

    // File Upload
    const [response, setResponse] = useState(null)
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    // Local Parameters
    const [showLocalConfigWindow, setShowLocalConfigWindow] = useState(false)
    const [specCalMethod, setSpecCalMethod] = useState('log-mel')
    const [nfft, setNfft] = useState('')
    const [binsPerOctave, setBinsPerOctave] = useState('')
    const [minFreq, setMinFreq] = useState('')
    const [maxFreq, setMaxFreq] = useState('')

    // Label Canvas
    const labelCanvasRef = useRef(null)

    // WhisperSeg
    const [whisperSegIsLoading, setWhisperSegIsLoading] = useState(false)

    // Active Species
    const activeSpecies = speciesArray.find(speciesObj =>
        speciesObj.individuals.some(individual => individual.isActive)
    )

    // Label Window
    const [expandedLabel, setExpandedLabel] = useState(null)

    /* ++++++++++++++++++++ Pass methods ++++++++++++++++++++ */

    const passSpectrogramIsLoadingToScalableSpec = ( boolean ) => {
        setSpectrogramIsLoading( boolean )
    }

    const passShowLocalConfigWindowToScalableSpec = ( boolean ) => {
        setShowLocalConfigWindow( boolean )
    }

    const passSpecCalMethodToScalableSpec = ( newspecCalMethod ) => {
        setSpecCalMethod( newspecCalMethod )
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
        if (!globalClipDuration || !response) return

        if (audioSnippet) {
            audioSnippet.pause()
            audioSnippet.currentTime = currentStartTime
        }

        getSpecAndAudioArray()
    }

    const uploadFileByURL = async (audioPayload) => {
        passSpectrogramIsLoadingToScalableSpec( true )
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

    const handleUploadResponse = (response) => {
        const trackDuration = response.data.channels[0].audio_duration
        const hopLength = response.data.configurations.hop_length
        const numSpecColumns = response.data.configurations.num_spec_columns
        const samplingRate = response.data.configurations.sampling_rate
        const defaultConfig = {
            hop_length: hopLength,
            num_spec_columns: numSpecColumns,
            sampling_rate: samplingRate
        }

        const newResponseData = response.data.channels[0]
        const newSpecCalMethod = response.data.configurations.spec_cal_method
        const newNfft = response.data.configurations.n_fft
        const newBinsPerOctave = response.data.configurations.bins_per_octave
        const newMinFreq = response.data.configurations.min_frequency
        const newMaxFreq = response.data.configurations.max_frequency

        deletePreviousTrackDurationInApp( response.audio_duration ) // Remove outdated track duration of the previous file in the App component
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

        // Deal with click inside an existing label
        const labelToBeExpanded = checkIfClickedOnLabel (mouseX, mouseY)
        if ( labelToBeExpanded ) {
            setExpandedLabel( labelToBeExpanded )
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
            drawLineBetween(newestLabel)
            drawLine(newestLabel, newestLabel.offset)
            return
        }

        // Add onset
        let clickedTimestamp = calculateTimestamp(event)
        clickedTimestamp = magnet(clickedTimestamp)
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
        }

        clickedLabel = undefined
    }

    const removeDragEventListeners = () => {
        //console.log('remove drag event listeners')
        specCanvasRef.current.removeEventListener('mousemove', dragOnset)
        specCanvasRef.current.removeEventListener('mousemove', dragOffset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOnset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOffset)
        labelCanvasRef.current.removeEventListener('mousemove', dragOnset)
        labelCanvasRef.current.removeEventListener('mousemove', dragOffset)
    }

    const handleRightClick = (event) => {
        event.preventDefault()

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        const mouseX = getMouseX(event)
        const mouseY = getMouseY(event)
        const labelToBeDeleted = checkIfClickedOnLabel(mouseX, mouseY)
        deleteLabel(labelToBeDeleted)
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
            const specCTX = specCVS.getContext('2d');
            const waveformCVS = waveformCanvasRef.current
            const waveformCTX = waveformCVS.getContext('2d')
            const labelCVS = labelCanvasRef.current
            const labelCTX = labelCVS.getContext('2d')
            specCTX.clearRect(0, 0, specCVS.width, specCVS.height);
            specCTX.putImageData(specImgData.current, 0, 0);
            waveformCTX.clearRect(0, 0, waveformCVS.width, waveformCVS.height)
            waveformCTX.putImageData(waveformImgData.current, 0, 0)
            labelCTX.clearRect(0, 0, labelCVS.width, labelCVS.height)
            drawAllLabels()
            drawPlayhead(playheadRef.current.timeframe)
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
            if (mouseX >= onsetX && mouseX <= offsetX && mouseY >= topY && mouseY <= bottomY && !lastHoveredLabel.isHighlighted){
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

    const linspace = (start, stop, num=50, endpoint=true) => {
        const step = (stop - start) / (num - (endpoint ? 1 : 0))
        const arr = Array.from({ length: num }, (_, i) => start + step * i)
        if (!endpoint) arr.push(stop)
        return arr
    }

    const getAllIndividualIDs = () => {
        return speciesArray.flatMap(speciesObj => {
            return speciesObj.individuals.map(individual => individual.id)
        })
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
            //drawPlayhead(playheadRef.current.timeframe)
        })
        image.src = `data:image/png;base64,${spectrogram}`;

        // Draw Time Axis, Viewport
        if (showOverviewInitialValue){
            drawTimeAxis()
            drawViewport(currentStartTime, currentEndTime, 'white', 2)
        }
    }

    const drawTimeAxis = () => {
        const canvas = timeAxisRef.current
        const ctx = canvas.getContext('2d')
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
        const ctx = timeAxisRef.current.getContext('2d')
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
        const ctx = cvs.getContext('2d');

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
        const ctx = cvs.getContext('2d')

        const xClustername = ( calculateXPosition(label.onset) + calculateXPosition(label.offset) ) / 2
        const y = calculateYPosition(label)

        const lineColor = label.color

        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillStyle = lineColor
        const text = label.clustername === 'Protected Area🔒' ? 'Protected Area' : label.clustername

        ctx.fillText(text, xClustername, y - 4);
    }

    const drawCurvedOnset = (marker_start_time, color, num_spec_columns=1000, curve_intensity_factor=1) => {
        const cvs = specCanvasRef.current
        const ctx = cvs.getContext('2d')
        ctx.fillStyle = color

        const marker_y_values = linspace(0, cvs.height, cvs.height)
        const curve_intensity = curve_intensity_factor / globalClipDuration

        const start_marker_x_position_pixels = (marker_start_time - currentStartTime) / globalClipDuration * cvs.width
        const start_marker_x_values = linspace(0, 2, cvs.height).map(x => start_marker_x_position_pixels + curve_intensity * -Math.exp(x ** 2))

        let i = 0
        for (let x of start_marker_x_values){
            const y = marker_y_values[i]
            ctx.fillRect(x,y,1.5,2)
            i++
        }

        // Draw horizontal line connecting the bottom end of the curved line with the line in the label canvas
        const x1 = start_marker_x_values[0]
        const x2 = start_marker_x_values[start_marker_x_values.length-1]
        const y = cvs.height - 1

        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.lineWidth = 2
        ctx.strokeStyle = color
        ctx.stroke()
        ctx.setLineDash([])


        // Draw waveform line also with fillRect, so it aligns smoothly with the curved line
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d')
        waveformCTX.fillStyle = color

        const y_values = linspace(0, waveformCVS.height, waveformCVS.height)
        const x = start_marker_x_values[0]

        for (let y of y_values){
            waveformCTX.fillRect(x,y,1.5,2)
        }
    }

    const drawCurvedOffset = (marker_end_time, color, num_spec_columns=1000, curve_intensity_factor=1) => {
        const cvs = specCanvasRef.current
        const ctx = cvs.getContext('2d')
        ctx.fillStyle = color

        const marker_y_values = linspace(0, cvs.height, cvs.height)
        const curve_intensity = curve_intensity_factor / globalClipDuration

        const end_marker_x_position_pixels = (marker_end_time - currentStartTime) / globalClipDuration * cvs.width
        const end_marker_x_values = linspace(0, 2, cvs.height).map(x => end_marker_x_position_pixels + curve_intensity * Math.exp(x ** 2))

        let i = 0
        for (let x of end_marker_x_values){
            const y = marker_y_values[i]
            ctx.fillRect(x,y,1.5,2)
            i++
        }

        // Draw horizontal line connecting the bottom end of the curved line with the line in the label canvas
        const x1 = end_marker_x_values[0]
        const x2 = end_marker_x_values[end_marker_x_values.length-1]
        const y = cvs.height - 1

        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.lineWidth = 2
        ctx.strokeStyle = color
        ctx.stroke()
        ctx.setLineDash([])

        // Draw waveform line also with fillRect, so it aligns smoothly with the curved line
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d')
        waveformCTX.fillStyle = color

        const y_values = linspace(0, waveformCVS.height, waveformCVS.height)
        const x = end_marker_x_values[0]

        for (let y of y_values){
            waveformCTX.fillRect(x,y,1.5,2)
        }
    }

    const drawAllLabels = () => {
        const cvs = labelCanvasRef.current
        const ctx = cvs.getContext('2d')
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
            // Draw label that is being dragged with extended lines
            if (label === clickedLabel){
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
        const ctx = cvs.getContext('2d')
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

            // Draw line separating Species
            const x1 = 0
            const x2 = cvs.width
            const y = (i - 1) * HEIGHT_BETWEEN_INDIVIDUAL_LINES + 2
            ctx.beginPath()
            ctx.moveTo(x1, y)
            ctx.lineTo(x2, y)
            ctx.strokeStyle = ctx.strokeStyle = '#ffffff'
            ctx.stroke()
        }

        const text = '🔒'
        const textWidth = ctx.measureText(text).width
        const x = cvs.width - textWidth - 5
        ctx.fillText(text, x, cvs.height)
    }

    /* ++++++++++++++++++ Label manipulation methods ++++++++++++++++++ */
        const addNewLabel = (onset) => {
        const individual = activeSpecies? activeSpecies.individuals.find(individual => individual.isActive): null
        const clustername = activeSpecies? activeSpecies.clusternames.find(clustername => clustername.isActive): null
        //const individual = clustername === 'Protected Area'? null : activeIndividual

        const allIndividualIDs = getAllIndividualIDs()
        const individualIndex = allIndividualIDs.indexOf(individual.id)

        const newLabel = new Label(
            nanoid(),
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

        if (labelToBeDeleted === expandedLabel){
            setExpandedLabel(null)
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

    const updateOffset  = (event) => {
        clickedLabel.offset = calculateTimestamp(event)
    }

    const dragOnset = (event) => {
        const specCanvas = specCanvasRef.current
        const specCTX = specCanvas.getContext('2d')
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d')

        updateOnset(event)

        specCTX.clearRect(0, 0, specCanvas.width, specCanvas.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        //drawPlayhead(playheadRef.current.timeframe)
    }

    const dragOffset = (event) => {
        const specCanvas = specCanvasRef.current
        const specCTX = specCanvas.getContext('2d')
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d')

        updateOffset(event)

        specCTX.clearRect(0, 0, specCanvas.width, specCanvas.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        //drawPlayhead(playheadRef.current.timeframe)
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


    /* ++++++++++++++++++ Overview Bar Methods ++++++++++++++++++ */

    const handleLMBDownOverview = (event) => {
        const mouseX = getMouseX(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + globalClipDuration)

        // Deal with click on Start Frame
        if (mouseX >= xStartFrame - 2 && mouseX <= xStartFrame + 2){
            overviewRef.current.style.cursor = 'col-resize'
            overviewRef.current.addEventListener('mousemove', dragStartFrame)
            //overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
            return
        }

        // Deal with click on End Frame
        if (mouseX >= xEndFrame - 2 && mouseX <= xEndFrame + 2){
            overviewRef.current.addEventListener('mousemove', dragEndFrame)
            //overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
            return
        }

        // Deal with click inside viewport
        if (mouseX > xStartFrame && mouseX < xEndFrame){
            const xStartTime = calculateViewportFrameX(currentStartTime)
            const xCurrentEndTime = calculateViewportFrameX(currentEndTime)
            widthBetween_xStartTime_mouseX = mouseX - xStartTime
            widthBetween_xEndTime_mouseX = xCurrentEndTime - mouseX
            overviewRef.current.addEventListener('mousemove', dragViewport)
            overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
        }
    }

    const handleMouseUpOverview = (event) => {
        if (event.button !== 0) {
            return
        }

        overviewRef.current.removeEventListener('mousemove', dragStartFrame)
        overviewRef.current.removeEventListener('mousemove', dragEndFrame)
        overviewRef.current.removeEventListener('mousemove', dragViewport)
        overviewRef.current.removeEventListener('mouseleave', handleMouseUpOverview)

        // Set new Viewport (Start & Endframe). This happens when the user drags the overview scroll bar.
        if (widthBetween_xStartTime_mouseX){
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

    const dragStartFrame = (event) => {
        const mouseX = getMouseX(event)
        newViewportStartFrame = calculateViewportTimestamp(mouseX)
        drawViewport(newViewportStartFrame, currentEndTime, 'white', 2)
    }

    const dragEndFrame = (event) => {
        const mouseX = getMouseX(event)
        newViewportEndFrame = calculateViewportTimestamp(mouseX)
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
        const ctx = overviewCanvas.getContext('2d');
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
        );
        passCurrentEndTimeToApp(
            prevEndTime => Math.max(prevEndTime - globalClipDuration, globalClipDuration)
        );
    }

    const rightScrollOverview = () => {
        passCurrentStartTimeToApp(
            prevStartTime => Math.min(prevStartTime + globalClipDuration, maxScrollTime)
        );
        passCurrentEndTimeToApp(
            prevEndTime => Math.min(prevEndTime + globalClipDuration, globalAudioDuration)
        );
    }

    /* ++++++++++++++++++ Audio methods ++++++++++++++++++ */
    const getAudio = async () => {
        setAudioSnippet(null)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-wav'
        try {
            const response = await axios.post(path, {
                audio_id: audioId,
                start_time: currentStartTime,
                clip_duration: globalClipDuration
            });
            handleNewAudio(response.data.wav);
        } catch (error) {
            console.error("Error fetching audio clip:", error);
        }
    };

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

        const canvas = specCanvasRef.current
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(specImgData.current, 0, 0);
        drawAllLabels()
        drawPlayhead(currentStartTime + audioSnippet.currentTime)

        window.requestAnimationFrame(() => loop() )
    }

    const pauseAudio = () => {
        if (!audioSnippet) return
        audioSnippet.pause()
        updatePlayhead(currentStartTime + audioSnippet.currentTime)
    }

    const stopAudio = () => {
        if (!audioSnippet) return

        audioSnippet.pause()
        audioSnippet.currentTime = currentStartTime
        updatePlayhead(currentStartTime)

        const canvas = specCanvasRef.current
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(specImgData.current, 0, 0);
        drawAllLabels()
    }

    const drawPlayhead = (timeframe) => {
        const canvas = specCanvasRef.current
        const ctx = canvas.getContext('2d');
        const x = calculateXPosition(timeframe)

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.lineWidth = 2
        ctx.strokeStyle = "red"
        ctx.stroke()
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
    };

    const drawWaveform = (newAudioArray) => {
        if (!waveformCanvasRef.current) return
        const canvas = waveformCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
        canvas.width = parent.innerWidth - 200

        const centerY = canvas.height / 2
        const ratio = Math.min((response.audio_duration - currentStartTime) / globalClipDuration, 1)
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
        setWaveformScale(prevState => prevState + 10)
     }

     const waveformZoomOut = () => {
         setWaveformScale(prevState => Math.max(prevState - 10, 1))
     }


    /* ++++++++++++++++++ Tracks ++++++++++++++++++ */

    const handleRemoveTrack = () => {
        if (response){
            deletePreviousTrackDurationInApp( response.audio_duration )
        }
        removeTrackInApp(id)
    }

    /* ++++++++++++++++++ Editor Container ++++++++++++++++++ */
    const handleMouseLeave = () => {
        const newestLabel = labels[labels.length -1]
        if (newestLabel && !newestLabel.offset){
            deleteLabel(newestLabel)
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
        const lineDistance = cvs.height / selectedFrequencies.length
        let y = cvs.height
        const x1 = cvs.width - 10
        const x2 = cvs.width
        for (let freq of selectedFrequencies){
            ctx.beginPath()
            ctx.moveTo(x1,y)
            ctx.lineTo(x2, y)
            ctx.stroke()
            ctx.fillText(`${Math.round(freq / 10) * 10}`, 0, y);
            y -= lineDistance
        }

        ctx.fillText('Hz', 0, 10);
    }


    /* ++++++++++++++++++ Whisper ++++++++++++++++++ */
    const callWhisperSeg = async () => {
        setWhisperSegIsLoading(true)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-labels'

        const requestParameters = {
            audio_id: audioId,
            // In the future add labels and protected area when Whisper Seg Endpoint takes human annotated area as a parameter
        }

        const response = await axios.post(path, requestParameters)

        const whisperObjects = response.data.labels

        const whisperLabels = whisperObjects.map( obj => {
            const newLabel = new Label(
                nanoid(),
                obj.onset,
                obj.offset,
                'currently not available',
                'currently not available',
                obj.clustername,
                null,
                null,
                null,
                null,
                DEFAULT_LABEL_COLOR
            )

            return newLabel
        })

        setLabels(prevState => [...prevState, ...whisperLabels] )
        setWhisperSegIsLoading(false)
    }

    const submitAnnotations = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'post-annotations'

        const requestParameters = {
            annotations: [
                {
                    onset: 0,
                    offset: 0,
                    species: 'test_species',
                    individual: 'test_individual',
                    filename: 'test_filename',
                    annotation_instance: 'test_annotation_instance'
                }
            ]
        }

        const headers = {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        }

        const response = await axios.post(path, requestParameters, { headers } )
    }


    /* ++++++++++++++++++ UseEffect Hooks ++++++++++++++++++ */
    // When labels or the Waveform Scale value are manipulated
    useEffect( () => {
        if (!spectrogram) return
        drawEditorCanvases(spectrogram, frequencies,audioArray)

    }, [labels, waveformScale] )

    // When a user adds, deletes, renames or recolors species, individuals or clusternames in the Annotation Labels Component
    useEffect(() => {
        if (!speciesArray) return

        const allIndividualIDs = getAllIndividualIDs()

        // Iterate over the labels array
        const updatedLabels = labels
            .map(label => {
                // Create an updated label with old values
                const updatedLabel = new Label(
                    label.id,
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

        setLabels(updatedLabels)

    }, [speciesArray])

    // When user zoomed or scrolled
    useEffect( () => {
            if (!globalClipDuration || !response) return

            if (audioSnippet) {
                audioSnippet.pause()
                audioSnippet.currentTime = currentStartTime
            }

            getSpecAndAudioArray()

    }, [currentStartTime, globalClipDuration, audioId])


    // When a new audio file is uploaded:
    useEffect( () => {
            if (!response) return

            setAudioId(response.audio_id)

            // Add imported labels to the labels array
            const allIndividualIDs = getAllIndividualIDs()
            if (audioPayload && audioPayload.labels){

                // Iterate over the imported labels array
                const updatedLabels = audioPayload.labels
                    .map(label => {

                        // Create a new Label object with the imported values
                        const updatedLabel = new Label(
                            nanoid(),
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
                setLabels(updatedLabels)
            } else {
                setLabels([])
            }

    }, [response])

    // When a new CSV File was uploaded
    /*
    useEffect( () => {
        if (!importedLabels) return
        setLabels(importedLabels)
    }, [importedLabels])
    */

    // When a new audio snippet is returned from the backend
    useEffect( () => {
        if (!audioSnippet) return
        playAudio()
    }, [audioSnippet] )

    // When globalAudioDuration is updated in the App component
    useEffect( () => {
        if (!globalAudioDuration || !response ) return

        /*
        // This makes the zoom in level to show the largest track fully (better for multiple files locally). Use this for planned free mode.
        const newHopLength = Math.floor( (globalAudioDuration * globalSamplingRate) / globalNumSpecColumns )
        const newDuration = newHopLength / globalSamplingRate * globalNumSpecColumns
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = 0
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes(newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime)
         */

        // This makes the zoom in level to show the newest track fully (necessary for upload by url). Use this for planned strict mode.
        const newDuration = globalHopLength / globalSamplingRate * globalNumSpecColumns
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = 0
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes(globalHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime)

        /*
        Old way:

        passClipDurationToApp(globalAudioDuration)
        passCurrentStartTimeToApp(0)
        passCurrentEndTimeToApp(globalAudioDuration)
        passMaxScrollTimeToApp(0)
        passScrollStepToApp(globalAudioDuration * SCROLL_STEP_RATIO)
        */

        playheadRef.current.timeframe = 0

    }, [response, globalAudioDuration] )

    // When on of the audio payloads in the URL data parameter was assigned to this track
    useEffect( () => {
        if (!audioPayload) return
        uploadFileByURL(audioPayload)

    }, [audioPayload])

    return (
        <div
            className='editor-container'
            onMouseLeave={handleMouseLeave}
        >
            {showOverviewInitialValue && response &&
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
                <div className='side-window' >
                    <div className='track-controls'>
                        <LocalFileUpload
                            specCalMethod={specCalMethod}
                            nfft={nfft}
                            binsPerOctave={binsPerOctave}
                            minFreq={minFreq}
                            maxFreq={maxFreq}
                            passSpectrogramIsLoadingToScalableSpec={passSpectrogramIsLoadingToScalableSpec}
                            handleUploadResponse={handleUploadResponse}
                            handleUploadError={handleUploadError}
                        />
                        <div>
                            <Export
                                audioFileName={'Example Audio File Name'}
                                labels={labels}
                            />
                            <Tooltip title="Submit Annotations">
                                <IconButton onClick={submitAnnotations}>
                                    <BackupIcon style={iconStyle}/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Call WhisperSeg">
                                <IconButton onClick={callWhisperSeg}>
                                    <AutoFixHighIcon style={iconStyle}/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Change Track Parameters">
                                <IconButton onClick={ () => setShowLocalConfigWindow(true)}>
                                    <TuneIcon style={iconStyle}/>
                                </IconButton>
                            </Tooltip>
                            {id !== 'track_1' &&
                                <Tooltip title="Delete Track">
                                    <IconButton onClick={handleRemoveTrack}>
                                        <DeleteIcon style={iconStyle}/>
                                    </IconButton>
                                </Tooltip>
                            }
                        </div>
                        <div className='audio-controls'>
                            <IconButton onClick={getAudio}>
                                <PlayArrowIcon style={iconStyle}/>
                            </IconButton>
                            <IconButton onClick={pauseAudio}>
                                <PauseIcon style={iconStyle}/>
                            </IconButton>
                            <IconButton onClick={stopAudio}>
                                <StopIcon style={iconStyle}/>
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
                        />
                    </div>
                    <div className='waveform-buttons-frequencies-canvas-container'>
                        <div className='waveform-buttons'>
                            <IconButton style={iconBtnStyle} onClick={waveformZoomIn}>
                                <ZoomInIcon style={iconStyle}/>
                            </IconButton>
                            <IconButton style={iconBtnStyle} onClick={waveformZoomOut}>
                                <ZoomOutIcon style={iconStyle}/>
                            </IconButton>
                        </div>
                        <canvas
                            className='frequencies-canvas'
                            ref={frequenciesCanvasRef}
                            width={40}
                            height={175}
                        />
                    </div>
                    <canvas
                        className='individuals-canvas'
                        ref={individualsCanvasRef}
                        width={200}
                        height={numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES + 15}
                    />
                </div>

                <div className='waveform-spec-labels-canvases-container' onMouseLeave={handleMouseUp}>
                    <canvas
                        className='waveform-canvas'
                        ref={waveformCanvasRef}
                        width={parent.innerWidth - 200}
                        height={80}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    <canvas
                        className='spec-canvas'
                        ref={specCanvasRef}
                        width={parent.innerWidth - 200}
                        height={150}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    <canvas
                        className='label-canvas'
                        ref={labelCanvasRef}
                        width={parent.innerWidth - 200}
                        height={numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES + HEIGHT_BETWEEN_INDIVIDUAL_LINES}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    {
                        expandedLabel &&
                            <LabelWindow
                                speciesArray={speciesArray}
                                labels={labels}
                                expandedLabel={expandedLabel}
                                passLabelsToScalableSpec={passLabelsToScalableSpec}
                                passExpandedLabelToScalableSpec={passExpandedLabelToScalableSpec}
                                getAllIndividualIDs={getAllIndividualIDs}
                                calculateXPosition={calculateXPosition}
                                HEIGHT_BETWEEN_INDIVIDUAL_LINES={HEIGHT_BETWEEN_INDIVIDUAL_LINES}
                            />
                    }
                    {spectrogramIsLoading || whisperSegIsLoading? <Box sx={{ width: '100%' }}><LinearProgress /></Box> : ''}
                </div>

            </div>
        </div>
    );
}

export default ScalableSpec;