// React
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {createPortal} from 'react-dom';

// External dependencies
import axios from 'axios';
import {nanoid} from "nanoid";
import {toast} from "react-toastify";
import emitter from './eventEmitter';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import IconButton from '@mui/material/IconButton';
import TuneIcon from '@mui/icons-material/Tune';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DensityLargeIcon from '@mui/icons-material/DensityLarge';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import {Button} from '@mui/material';
import LineStyleIcon from '@mui/icons-material/LineStyle';
import ContrastIcon from '@mui/icons-material/Contrast';
import LightModeIcon from '@mui/icons-material/LightMode';
import PaletteIcon from '@mui/icons-material/Palette';

 
// Internal dependencies
import Parameters from "./Parameters.jsx"
import WhisperSeg from "./WhisperSeg.jsx"
import LabelWindow from "./LabelWindow.jsx";
import LocalFileUpload from "./LocalFileUpload.jsx";
import { useOpenWindowsContext } from './OpenWindowsContext.jsx'; // Adjust path as necessary
import {Label} from "./label.js"
import {ANNOTATED_AREA, UNKNOWN_SPECIES} from "./species.js";
import {freqBtn, icon, iconBtn, iconBtnDisabled, iconBtnSmall, iconSmall, toggleVisibilityBtn} from "./buttonStyles.js"


// Classes Definitions
class Playhead{
    constructor(timeframe) {
        this.timeframe = timeframe
    }
}

// Global variables
const HEIGHT_BETWEEN_INDIVIDUAL_LINES = 15
const ZERO_GAP_CORRECTION_MARGIN = 0.0005
const FREQUENCY_LINES_COLOR = '#47ff14'
const ACTIVE_LABEL_COLOR = '#ffffff'
const TIME_AXIS_COLOR = '#9db4c0'
const WAVEFORM_COLOR = '#ddd8ff'
const VIEWPORT_COLOR = 'white'

const OVERVIEW_CVS_HEIGHT = 40
const TIMEAXIS_CVS_HEIGHT = 40
const TRACK_SIDEBAR_WIDTH = 220
const FREQ_CVS_WIDTH = 40

function Track(
                        {
                            trackID,
                            speciesArray,
                            deletedItemID,
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
                            updateClipDurationAndTimes,
                            strictMode,
                            importedLabels,
                            handleUploadResponse,
                            trackData,
                            showOverviewBarAndTimeAxis,
                            passFilesUploadingToApp,
                            addLabelsToApp,
                            exportRequest,
                            submitRequest,
                            toggleTrackVisibility,
                            moveTrackUp,
                            moveTrackDown,
                            lastTrackIndex,
                            passSpeciesArrayToApp,
                            tokenInference,
                            tokenFinetune,
                            passTokenInferenceToWhisperSeg,
                            passTokenFinetuneToWhisperSeg,
                            specCanvasHeight,
                            showAllWaveforms,
                            showAllLabels,
                            globalSpecBrightness,
                            globalSpecContrast,
                            globalColorMap,
                            annotationTimestamps,
                            getCurrentUTCTime,
                            getDeviceInfo,
                            hashID
                        }
                    )
                {

    // General
    const [audioId, setAudioId] = useState(trackData.audioID)
    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - TRACK_SIDEBAR_WIDTH)
    const resizeTimeoutRef = useRef(null)

    // Spectrogram
    const specCanvasRef = useRef(null)
    const specOverlayCanvasRef = useRef(null)
    const specImgData = useRef(null)
    const [spectrogram, setSpectrogram] = useState(trackData.spectrogram)

    // Frequency
    const frequenciesCanvasRef = useRef(null)
    const [frequencies, setFrequencies] = useState(trackData.frequencies)
    const [showFrequencyLines, setShowFrequencyLines] = useState(false)

    const [frequencyLines, setFrequencyLines] = useState({maxFreqY: -10, minFreqY: specCanvasHeight+10})
    const [frequencyRanges, setfrequencyRanges] = useState( null )

    let draggedFrequencyLinesObject = null

    // Labels and Individuals Canvases
    const [showLabelAndIndividualsCanvas, setShowLabelAndIndividualsCanvas] = useState(true)

    // Label Canvas
    const labelCanvasRef = useRef(null)
    const labelOverlayCanvasRef = useRef(null)

    // Individuals Canvas
    const individualsCanvasRef = useRef(null)
    const numberOfIndividuals = speciesArray.reduce((total, speciesObj) => total + speciesObj.individuals.length, 0)

    // Time Axis and Overview Container
    const overviewTimeAxisContainerRef = useRef(null)

    // Time Axis
    const timeAxisRef = useRef(null)

    // Overview Window
    const overviewRef = useRef(null)
    let newViewportStartFrame = null
    let newViewportEndFrame = null
    let widthBetween_xStartTime_mouseX = null
    let widthBetween_xEndTime_mouseX = null

    // Labels
    const [labels, setLabels] = useState([])
    const [activeLabel, setActiveLabel] = useState(null)
    let draggedActiveLabel = null
    let clickedLabel = undefined
    let lastHoveredLabel = {labelObject: null, isHighlighted: false}

    // Audio
    const playheadRef = useRef(new Playhead(0))
    const [audioSnippet, setAudioSnippet] = useState(null)
    const [playWindowTimes, setPlayWindowTimes] = useState(null)

    // Waveform
    const waveformCanvasRef = useRef(null)
    const waveformOverlayCanvasRef = useRef(null)
    const waveformImgData = useRef(null)
    const [audioArray, setAudioArray] = useState(null)
    const [waveformScale, setWaveformScale] = useState(3)
    const [displayWaveform, setDisplayWaveform] = useState(true)
    // Deprecated: NO LONGER USE showWaveform in the future, leave it untouched!
    const [showWaveform, setShowWaveform] = useState(true)

    //drag ref
    const dragListenerRef = useRef(null);

    // File Upload
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    // Local Parameters
    const [showLocalConfigWindow, setShowLocalConfigWindow] = useState(false)
    const [specCalMethod, setSpecCalMethod] = useState(trackData.specCalMethod ? trackData.specCalMethod : 'log-mel')
    const [nfft, setNfft] = useState(trackData.nfft ? trackData.nfft : '')
    const [binsPerOctave, setBinsPerOctave] = useState(trackData.binsPerOctave ? trackData.binsPerOctave: '')
    const [minFreq, setMinFreq] = useState(trackData.minFreq ? trackData.minFreq : '')
    const [maxFreq, setMaxFreq] = useState(trackData.maxFreq ? trackData.maxFreq : '')

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

    // Scroll Context
    const { setAnyWindowsOpen } = useOpenWindowsContext();

    // Frequency Lines
    const allowUpdateMinFreqGivenLineY = useRef( false );
    const allowUpdateMaxFreqGivenLineY = useRef( false );

    const [numFreqLinesToAnnotate, setNumFreqLinesToAnnotate] = useState(0)

    // Layout (Track Height)
    const [specHeight, setSpecHeight] = useState('300px');
    // Experimental debug
    // State to control the height of B and C
    const [isHidden, setIsHidden] = useState(false);

    // Calculate heights based on isHidden state
    const WAVEFORM_CVS_HEIGHT = displayWaveform ? 60 : 0; // height of B and C
    const specYAxisWidth = 45;
    const controlPanelWidth = TRACK_SIDEBAR_WIDTH - specYAxisWidth;

    // Spectrogram
    const [ specBrightness, setSpecBrightness ] = useState(1.0);
    const [ specContrast, setSpecContrast ] = useState(1.0);
    const [sliderSpecBrightnessValue, setSliderSpecBrightnessValue] = useState(1);
    const [sliderSpecContrastValue, setSliderSpecContrastValue] = useState(1);
    const [colorMap, setColorMap] = useState('inferno');

    /* ++++++++++++++++++++ Pass methods ++++++++++++++++++++ */

    const passSpectrogramIsLoadingToTrack = ( boolean ) => {
        setSpectrogramIsLoading( boolean )
    }

    const passShowLocalConfigWindowToTrack = ( boolean ) => {
        setShowLocalConfigWindow( boolean )
    }

    const passSpecCalMethodToTrack = ( newSpecCalMethod ) => {
        setSpecCalMethod( newSpecCalMethod )
    }

    const passNfftToTrack = ( newNfft ) => {
        setNfft( newNfft )
    }

    const passBinsPerOctaveToTrack = ( newBinsPerOctave ) => {
        setBinsPerOctave( newBinsPerOctave )
    }

    const passMinFreqToTrack = ( newMinFreq ) => {
        setMinFreq( newMinFreq )
    }

    const passMaxFreqToTrack = ( newMaxFreq ) => {
        setMaxFreq( newMaxFreq )
    }

    const passLabelsToTrack = ( newLabelsArray ) => {
        setLabels( newLabelsArray )
    }

    const passExpandedLabelToTrack = ( newExpandedLabel ) => {
        setExpandedLabel( newExpandedLabel )
    }

    const passWhisperSegIsLoadingToTrack = ( boolean ) => {
        setWhisperSegIsLoading( boolean )
    }


    /* ++++++++++++++++++ Handle brightness/contrast slider dragging ++++++++++++++++++ */
    // Update the slider value as user drags
    const handleSliderSpecBrightnessChange = (event) => {
        setSliderSpecBrightnessValue(parseFloat(event.target.value));
    };
    const handleSliderSpecBrightnessMouseUp = () => {
        setSpecBrightness(sliderSpecBrightnessValue);
    };

    const handleSliderSpecContrastChange = (event) => {
        setSliderSpecContrastValue(parseFloat(event.target.value))
    };

    const handleSliderSpecContrastMouseUp = () => {
        setSpecContrast( sliderSpecContrastValue )
    };


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
            max_frequency: Number(maxFreq),
            brightness: specBrightness,
            contrast: specContrast,
            color_map: colorMap,
        }

        try {
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

        } catch (error) {
            toast.error('Something went wrong trying compute the spectrogram. Check the console for more information.')
            console.log(error)
        }
    }

    const getSpecAndAudioArray = async () => {
        try {
            const [data, newAudioArray] = await Promise.all(
                [
                    getAudioClipSpec(),
                    getAudioArray()
                ]
            )

            setSpectrogram(data.spec)
            drawAllCanvases(data.spec, data.freqs, newAudioArray)
            setSpectrogramIsLoading(false)
            passFilesUploadingToApp(false)
            setFrequencies(data.freqs.map( (freq) => Math.round(freq) ))
            setAudioArray(newAudioArray)
        } catch (error) {
            toast.error('An error occurred trying to generate the spectrogram. Check the console for more information')
            console.error('Error fetching data:', error)
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

    const handleUploadError = (error) => {
        setSpectrogramIsLoading( false )
        toast.error('Error while uploading. Check the console for more information.', {autoClose: false})
        console.error("Error uploading file:", error)

    }

    /* ++++++++++++++++++ Mouse Interaction methods ++++++++++++++++++ */

    const handleLMBDown = (event) => {

        // Don't proceed if no spectrogram is present in the track
        if (!spectrogram) return

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        allowUpdateMaxFreqGivenLineY.current = false
        allowUpdateMinFreqGivenLineY.current = false

        // Ignore clicks from other mouse buttons
        if (event.button !== 0) return   

        const mouseX = getMouseX(event)
        const mouseY = getMouseY(event)

        // Deal with click on Onset or Offset to trigger drag methods
        if ( checkIfOccupiedByOnsetOrOffset(mouseX, mouseY) && event.target.className === 'label-canvas'){

            // Deal with click on Onset
            clickedLabel = checkIfClickedOnOnset(mouseX, mouseY)
            if ( clickedLabel ){
                annotationTimestamps.current = [...annotationTimestamps.current, {
                    "hash_id":hashID,
                    "timestamp":getCurrentUTCTime().toISOString(),
                    "action":"update onset",
                    "deviceInfo":getDeviceInfo()
                } ];

                // specCanvasRef.current.addEventListener('mousemove', dragOnset)
                // waveformCanvasRef.current.addEventListener('mousemove', dragOnset)
                // labelCanvasRef.current.addEventListener('mousemove', dragOnset)

                dragListenerRef.current = dragOnset;
                specCanvasRef.current.addEventListener('mousemove', dragListenerRef.current)
                waveformCanvasRef.current.addEventListener('mousemove', dragListenerRef.current)
                labelCanvasRef.current.addEventListener('mousemove', dragListenerRef.current)
                return
            }

            // Deal with click on Offset
            clickedLabel = checkIfClickedOnOffset(mouseX, mouseY)
            if (clickedLabel){
                annotationTimestamps.current = [...annotationTimestamps.current, {
                    "hash_id":hashID,
                    "timestamp":getCurrentUTCTime().toISOString(),
                    "action":"update offset",
                    "deviceInfo":getDeviceInfo()
                } ];

                specCanvasRef.current.addEventListener('mousemove', dragOffset)
                waveformCanvasRef.current.addEventListener('mousemove', dragOffset)
                labelCanvasRef.current.addEventListener('mousemove', dragOffset)
                return
            }
        }

        // Deal with click on Active Label onset
        if (checkIfClickedOnActiveLabelOnset(mouseX)) {
            annotationTimestamps.current = [...annotationTimestamps.current, {
                "hash_id":hashID,
                "timestamp":getCurrentUTCTime().toISOString(),
                "action":"update onset",
                "deviceInfo":getDeviceInfo()
            } ];

            draggedActiveLabel = JSON.parse(JSON.stringify(activeLabel))
            specCanvasRef.current.addEventListener('mousemove', dragActiveLabelOnset)
            waveformCanvasRef.current.addEventListener('mousemove', dragActiveLabelOnset)
            return
        }

        // Deal with click on Active Label offset
        if (checkIfClickedOnActiveLabelOffset(mouseX)) {
            annotationTimestamps.current = [...annotationTimestamps.current, {
                "hash_id":hashID,
                "timestamp":getCurrentUTCTime().toISOString(),
                "action":"update offset",
                "deviceInfo":getDeviceInfo()
            } ];

            draggedActiveLabel = JSON.parse(JSON.stringify(activeLabel))
            specCanvasRef.current.addEventListener('mousemove', dragActiveLabelOffset)
            waveformCanvasRef.current.addEventListener('mousemove', dragActiveLabelOffset)
            return
        }

        // Deal with click on Max Frequency Line
        if (checkIfOccupiedByMaxFreqLine(mouseY) && event.target.className === 'spec-canvas'){
            annotationTimestamps.current = [...annotationTimestamps.current, {
                "hash_id":hashID,
                "timestamp":getCurrentUTCTime().toISOString(),
                "action":"update frequency",
                "deviceInfo":getDeviceInfo()
            } ];

            draggedFrequencyLinesObject = frequencyLines
            specCanvasRef.current.addEventListener('mousemove', dragMaxFreqLine)
            allowUpdateMaxFreqGivenLineY.current = true // User is going to drag the frequency line
            return
        }
    
        // Deal with click on Min Frequency Line
        if (checkIfOccupiedByMinFreqLine(mouseY) && event.target.className === 'spec-canvas'){
            annotationTimestamps.current = [...annotationTimestamps.current, {
                "hash_id":hashID,
                "timestamp":getCurrentUTCTime().toISOString(),
                "action":"update frequency",
                "deviceInfo":getDeviceInfo()
            } ];

            draggedFrequencyLinesObject = frequencyLines
            specCanvasRef.current.addEventListener('mousemove', dragMinFreqLine)
            allowUpdateMinFreqGivenLineY.current = true
            return
        }

        // Deal with click inside an existing label
        const labelToBeExpanded = checkIfClickedOnLabel(event, mouseX, mouseY)
        if ( labelToBeExpanded ) {
            setExpandedLabel( labelToBeExpanded )
            emitter.emit('dataChange', {
                onset: labelToBeExpanded.onset,
                offset: labelToBeExpanded.offset,
                id: labelToBeExpanded.id,
                trackID: trackID,
                color: ACTIVE_LABEL_COLOR,
            })

            setGlobalMouseCoordinates({x: event.clientX, y: event.clientY})
            return
        }


        // Add offset to existing label if necessary
        const newestLabel = labels[labels.length-1]
        if (labels.length > 0 && newestLabel.offset === undefined){
            annotationTimestamps.current = [...annotationTimestamps.current, {
                "hash_id":hashID,
                "timestamp":getCurrentUTCTime().toISOString(),
                "action":"add offset",
                "deviceInfo":getDeviceInfo()
            } ];

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
            emitter.emit('dataChange', {
                onset: labelsCopy[labels.length-1].onset,
                offset: labelsCopy[labels.length-1].offset,
                id: labelsCopy[labels.length-1].id,
                trackID: trackID,
                color: ACTIVE_LABEL_COLOR,
            })

            // drawLineBetween(newestLabel)
            // drawClustername(newestLabel)
            // drawLine(newestLabel, newestLabel.onset)
            // drawLine(newestLabel, newestLabel.offset)
            return
        }

        // In this case, we are in the state of adding frequency lines
        if (numFreqLinesToAnnotate > 0 ){
            if( event.target.className === 'spec-canvas' ){
                annotationTimestamps.current = [...annotationTimestamps.current, {
                    "hash_id":hashID,
                    "timestamp":getCurrentUTCTime().toISOString(),
                    "action":"add frequency",
                    "deviceInfo":getDeviceInfo()
                } ];

                if (numFreqLinesToAnnotate == 2){
                    setFrequencyLines( {...frequencyLines, minFreqY:mouseY } )
                    allowUpdateMinFreqGivenLineY.current = true
                }else{
                    const newMinFreqY = Math.max( frequencyLines.minFreqY, mouseY )
                    const newMaxFreqY = Math.min( frequencyLines.minFreqY, mouseY )
                    setFrequencyLines( { minFreqY:newMinFreqY, maxFreqY:newMaxFreqY } )
                    allowUpdateMinFreqGivenLineY.current = true
                    allowUpdateMaxFreqGivenLineY.current = true
                }
                setNumFreqLinesToAnnotate( numFreqLinesToAnnotate - 1 )
            }
            return 
        }
        // after excluding all the other possiblities, the only case is to add new onset
        // at this moment, close the previously opened Label Window, since we are swicthing to a new label
        setExpandedLabel(null);

        // Add onset
        annotationTimestamps.current = [...annotationTimestamps.current, {
            "hash_id":hashID,
            "timestamp":getCurrentUTCTime().toISOString(),
            "action":"add onset",
            "deviceInfo":getDeviceInfo()
        } ];
        
        let clickedTimestamp = calculateTimestamp(event)
        clickedTimestamp = magnet(clickedTimestamp)
        addNewLabel(clickedTimestamp)

    }

    const handleMouseUp = (event) => {
        if (event.button !== 0) return
        removeDragEventListeners()

        // Only do this when mouse up event stems from dragging a label (equivalent to clickedLabel being true)
        if (clickedLabel){
            // Flip onset with offset if necessary
            if (clickedLabel.onset > clickedLabel.offset){
                clickedLabel = flipOnsetOffset(clickedLabel)
            }
            // Create zero gap labels if necessary
            clickedLabel.onset = magnet(clickedLabel.onset)
            clickedLabel.offset = magnet(clickedLabel.offset)

            passLabelsToTrack(labels)
            if (clickedLabel.id === expandedLabel?.id){
                setExpandedLabel(clickedLabel)
            }
            emitter.emit('dataChange', {
                onset: clickedLabel.onset,
                offset: clickedLabel.offset,
                id: clickedLabel.id,
                trackID: trackID,
                color: ACTIVE_LABEL_COLOR,
            })
            
        }

        // Only do this when mouse up event stems from dragging the active label (equivalent to draggedActiveLabel being true)
        // ADD: this is used to drag the label of one channel from another channel
        if (draggedActiveLabel){

            // Flip onset with offset if necessary
            if (draggedActiveLabel.onset > draggedActiveLabel.offset){
                draggedActiveLabel = flipOnsetOffset(draggedActiveLabel)
            }
            // Create zero gap labels if necessary
            draggedActiveLabel.onset = magnet(draggedActiveLabel.onset)
            draggedActiveLabel.offset = magnet(draggedActiveLabel.offset)

            emitter.emit('dataChange', {
                ...activeLabel,
                onset: draggedActiveLabel.onset,
                offset: draggedActiveLabel.offset,
            })

        }

        // Only do this when mouse up event stems from dragging the frequency lines
        if (draggedFrequencyLinesObject){
            setFrequencyLines({...draggedFrequencyLinesObject})
        }

        clickedLabel = undefined
        draggedActiveLabel = null
        draggedFrequencyLinesObject = null
        

    }

    const removeDragEventListeners = () => {
        specCanvasRef.current.removeEventListener('mousemove', dragListenerRef.current )//dragOnset)
        specCanvasRef.current.removeEventListener('mousemove', dragOffset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragListenerRef.current )//dragOnset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOffset)
        labelCanvasRef.current.removeEventListener('mousemove', dragListenerRef.current )//dragOnset)
        labelCanvasRef.current.removeEventListener('mousemove', dragOffset)
        specCanvasRef.current.removeEventListener('mousemove', dragMaxFreqLine)
        specCanvasRef.current.removeEventListener('mousemove', dragMinFreqLine)
        specCanvasRef.current.removeEventListener('mousemove', dragActiveLabelOnset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragActiveLabelOnset)
        specCanvasRef.current.removeEventListener('mousemove', dragActiveLabelOffset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragActiveLabelOffset)
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
        const labelToBeDeleted = checkIfClickedOnLabel(event, mouseX, mouseY)

        if (!labelToBeDeleted) return

        annotationTimestamps.current = [...annotationTimestamps.current, {
            "hash_id":hashID,
            "timestamp":getCurrentUTCTime().toISOString(),
            "action":"remove annotation",
            "deviceInfo":getDeviceInfo()
        } ];
        
        deleteLabel(labelToBeDeleted)

        // Remove active label from other tracks, if the deleted label was the active one
        if (labelToBeDeleted.id === activeLabel?.id){
            emitter.emit('dataChange', {
                onset: undefined,
                offset: undefined,
                id: undefined,
                trackID: undefined,
                color: undefined,
            })
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
        } else if ( checkIfOccupiedByMaxFreqLine(mouseY) || checkIfOccupiedByMinFreqLine(mouseY) ){
            specCanvasRef.current.style.cursor = 'row-resize'
        } else if ( checkIfOccupiedByActiveLabel(mouseX) ) {
            specCanvasRef.current.style.cursor = 'col-resize'
            waveformCanvasRef.current.style.cursor = 'col-resize'
        }
        else {
            specCanvasRef.current.style.cursor = 'default'
            waveformCanvasRef.current.style.cursor = 'default'
            labelCanvasRef.current.style.cursor = 'default'
        }
    }

    const hoverLabel = (event) => {
        if (lastHoveredLabel.labelObject && lastHoveredLabel.isHighlighted) {
            clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
            lastHoveredLabel.isHighlighted = false
        }

        const mouseX = getMouseX(event)
        const mouseY = getMouseY(event)

        for (let label of labels){
            const onsetX = calculateXPosition(label.onset)
            const offsetX = calculateXPosition(label.offset)
            const bottomY = calculateYPosition(label)
            const topY = calculateYPosition(label) - HEIGHT_BETWEEN_INDIVIDUAL_LINES
            if (mouseX >= onsetX && mouseX <= offsetX && mouseY >= topY && mouseY <= bottomY && !lastHoveredLabel.isHighlighted && event.target.className === 'label-canvas' ){
                drawClustername(label)
                lastHoveredLabel.labelObject = label
                lastHoveredLabel.isHighlighted = true
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
        return (label?.individualIndex + 1) * HEIGHT_BETWEEN_INDIVIDUAL_LINES
    }

    const calculateTimestamp = (event) => {
        const mouseX = getMouseX(event)
        const ratio = (mouseX / specCanvasRef.current.width)
        return globalClipDuration * ratio + currentStartTime
    }

    const checkIfOccupiedByOnsetOrOffset = (mouseX, mouseY) => {
        return checkIfClickedOnOnset(mouseX, mouseY) || checkIfClickedOnOffset(mouseX, mouseY)
    }

    const checkIfOccupiedByActiveLabel = (mouseX) => {
        // Active label is only drawn on the other tracks, so we ignore the active label that originated from this track
        if (!activeLabel || activeLabel.trackID === trackID) return

        return checkIfClickedOnActiveLabelOnset(mouseX) || checkIfClickedOnActiveLabelOffset(mouseX)
    }

    const checkIfClickedOnActiveLabelOnset = (mouseX) => {
        // Active label is only drawn on the other tracks, so we ignore the active label that originated from this track
        if (!activeLabel || activeLabel.trackID === trackID) return

        const activeLabelOnsetX = calculateXPosition(activeLabel.onset)
        return activeLabelOnsetX >= mouseX - 5 && activeLabelOnsetX <= mouseX + 5
    }

    const checkIfClickedOnActiveLabelOffset = (mouseX) => {
        // Active label is only drawn on the other tracks, so we ignore the active label that originated from this track
        if (!activeLabel || activeLabel.trackID === trackID) return

        const activeLabelOffsetX = calculateXPosition(activeLabel.offset)
        return activeLabelOffsetX >= mouseX - 5 && activeLabelOffsetX <= mouseX + 5
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

    const checkIfClickedOnLabel = (event, mouseX, mouseY) => {
        if (event.target.className !== 'label-canvas') return

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
        if (!showFrequencyLines) return false
        return mouseY < frequencyLines.maxFreqY + 5 && mouseY > frequencyLines.maxFreqY - 5
    }
        
    const checkIfOccupiedByMinFreqLine = (mouseY) => {
        if (!showFrequencyLines) return false
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
        let closestIndex = -1

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

    const getAllIndividualIDs = (currentSpeciesArray) => {
        return currentSpeciesArray.flatMap(speciesObj => {
            return speciesObj.individuals.map(individual => individual.id)
        })
    }

    const updateCanvasWidth = () => {
        if (!specCanvasRef.current) return
        setCanvasWidth(window.innerWidth - TRACK_SIDEBAR_WIDTH)
    }

    const handleWindowResize = () => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current)
        }
        resizeTimeoutRef.current = setTimeout(() => {
            updateCanvasWidth()
        }, 200)
    }

    /* ++++++++++++++++++ Draw methods ++++++++++++++++++ */

    const drawAllCanvases = (spectrogram, frequenciesArray, newAudioArray) => {

        // Draw Time Axis, Viewport
        if (showOverviewBarAndTimeAxis){
            drawTimeAxis()
            drawViewport(currentStartTime, currentEndTime, VIEWPORT_COLOR, 2)
        }

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
            drawFrequencyLines(frequenciesArray)
            drawPlayhead(playheadRef.current.timeframe)
        })
        image.src = `data:image/png;base64,${spectrogram}`;
    }

    const drawTimeAxis = () => {
        const cvs = timeAxisRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true })
        ctx.clearRect(0, 0, cvs.width, cvs.height)

        ctx.lineWidth = 2
        ctx.strokeStyle = TIME_AXIS_COLOR
        ctx.font = `${10}px Arial`
        ctx.fillStyle = TIME_AXIS_COLOR
        const firstAndLastTimeStampY = 18

        // Set time formats depending on the total audio duration
        let timeConvertMethod
        let millisecondFormatMethod
        if (globalAudioDuration > 3600){
            timeConvertMethod = secondsTo_HH_MM_SS
            millisecondFormatMethod = secondsTo_HH_MM_SS_MMM
        } else {
            timeConvertMethod = secondsTo_MM_SS_M
            millisecondFormatMethod = secondsTo_MM_SS_MMM
        }

        // Drawing horizontal line
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(cvs.width, 0)
        ctx.stroke()

        // Drawing first timestamp
        ctx.beginPath()
        ctx.moveTo(1, 0)
        ctx.lineTo(1, cvs.height)
        ctx.stroke()
        const firstTimeStampText = timeConvertMethod(currentStartTime)
        ctx.fillText(firstTimeStampText, 5, firstAndLastTimeStampY)

        // Drawing last timestamp
        ctx.beginPath()
        ctx.moveTo(cvs.width - 1, 0)
        ctx.lineTo(cvs.width - 1, cvs.height)
        ctx.stroke()
        const lastTimestampText = timeConvertMethod(currentEndTime)
        const textWidth = ctx.measureText(lastTimestampText).width
        //ctx.fillText(lastTimestampText, cvs.width - textWidth - 5 ,firstAndLastTimeStampY)


        // Calculate how many timestamps we can fit in the current viewport without them overlapping
        const minWidthBetweenTimestamps = 70
        let timestampIncrement = 1
        let numberOfTimestampsThatHaveSpaceInsideCanvas = cvs.width / minWidthBetweenTimestamps

        while (globalClipDuration > numberOfTimestampsThatHaveSpaceInsideCanvas * timestampIncrement){
            timestampIncrement = timestampIncrement * 2
        }

        // Draw First level (HH:MM:SS.m for audio longer than one hour, MM:SS.m for audio shorter than that)
        const lineHeight = 20
        const textY = lineHeight + 12
        ctx.font = `${12}px Arial`
        for (let timestamp = currentStartTime; timestamp <= currentEndTime; timestamp += timestampIncrement){
            // Always skip drawing the first timestamp because we already drew it
            if (timestamp === currentStartTime) continue

            const x = (timestamp * cvs.width / globalClipDuration) - ( currentStartTime * cvs.width / globalClipDuration )
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, lineHeight)
            ctx.stroke()
            const text = timeConvertMethod(timestamp)
            const textWidth = ctx.measureText(text).width
            ctx.fillText(text, x - textWidth / 2, textY)
        }

        // Draw second level (Milliseconds)
        if (globalClipDuration < 10 ){

            let i = 0
            const lineHeight = 10
            const textY = lineHeight + 12
            for (let millisecond = currentStartTime; millisecond <= currentEndTime; millisecond += timestampIncrement*0.1){
                // Don't draw lines on 0 and 10, because we already have seconds timestamps there
                if (i % 10 !== 0){
                    // Draw Millisecond lines
                    const x = (millisecond * cvs.width / globalClipDuration) - ( currentStartTime * cvs.width / globalClipDuration )
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, lineHeight)
                    ctx.stroke()

                    const text = millisecondFormatMethod(millisecond)
                    const textWidth = ctx.measureText(text).width

                    // Draw every millisecond number if clip duration is less than 1 second
                    if (globalClipDuration < 1){
                        ctx.fillText(text, x - textWidth / 2, textY)
                        // Draw every fifth millisecond number if clip duration is less than 2 seconds
                    } else if (globalClipDuration < 2){
                        if (i % 5 === 0 && i % 10 !== 0){
                            ctx.fillText(text, x - textWidth / 2, textY)
                        }
                    }
                }
                i++
            }
        }

        // Draw third level (Deciseconds)
        if (globalClipDuration < 1){

            let i = 0
            const lineHeight = 5
            for (let decisecond = currentStartTime; decisecond <= currentEndTime; decisecond += timestampIncrement*0.01){
                // Don't draw lines on 0 and 10, because we already have millisecond timestamps there
                if (i % 10 !== 0) {
                    const x = (decisecond * cvs.width / globalClipDuration) - (currentStartTime * cvs.width / globalClipDuration)
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, lineHeight)
                    ctx.stroke()
                }
                i++
            }
        }
    }

    const secondsTo_MM_SS_M = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000)

        return `${minutes.toString().padStart(2, '0')}:${Math.floor(remainingSeconds).toString().padStart(2, '0')}.${milliseconds.toString().padStart(1, '0')}`
    }

    const secondsTo_HH_MM_SS = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        let remainingSeconds = seconds % 3600
        const minutes = Math.floor(remainingSeconds / 60)
        remainingSeconds %= 60
        const secondsStr = remainingSeconds.toFixed(0).padStart(2, '0')

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsStr}`
    }

    const secondsTo_HH_MM_SS_MMM = (seconds) => {
        // Get the hours, minutes, and seconds
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);
        let secs = Math.floor(seconds % 60);
        let milliseconds = Math.floor((seconds % 1) * 1000);

        // Format the time components to be two digits (e.g., 01, 09) and three digits for milliseconds
        let formattedHours = String(hours).padStart(2, '0');
        let formattedMinutes = String(minutes).padStart(2, '0');
        let formattedSeconds = String(secs).padStart(2, '0');
        let formattedMilliseconds = String(milliseconds).padStart(3, '0');

        // Combine them into the desired format
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
    }

    const secondsTo_MM_SS_MMM = (seconds) => {
        // Get the minutes, seconds, and milliseconds
        let minutes = Math.floor(seconds / 60);
        let secs = Math.floor(seconds % 60);
        let milliseconds = Math.floor((seconds % 1) * 1000);

        // Format the time components to be two digits (e.g., 01, 09) and three digits for milliseconds
        let formattedMinutes = String(minutes).padStart(2, '0');
        let formattedSeconds = String(secs).padStart(2, '0');
        let formattedMilliseconds = String(milliseconds).padStart(3, '0');

        // Combine them into the desired format
        return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
    }

    const drawCurvedOnsetNew = (specCVS, waveformCVS, curve_time, color) => {
        const cvs = specCVS
        const ctx = cvs.getContext('2d', { willReadFrequently: true })
        ctx.lineWidth = 2
        ctx.strokeStyle = color

        const n_bins = cvs.height

        const curve_top_pos = calculateXPosition(curve_time)
        const curve_width = (0.5 * binsPerOctave / minFreq) * globalSamplingRate / globalHopLength
        const offset_para = curve_width * Math.pow(2, -n_bins / binsPerOctave)

        let xs = []
        for (let i = 0; i < cvs.width; i += 0.01){
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

    const drawCurvedOffsetNew = (specCVS, waveformCVS, curve_time, color) => {
        const cvs = specCVS
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

    const drawTimestampLine = ( specCVS, waveformCVS, labelCVS, label, timestamp, lineColor ) => {
        const waveformCTX = waveformCVS.getContext('2d')
        const specCTX = specCVS.getContext('2d')
        const labelCTX = labelCVS.getContext('2d')

        const x = calculateXPosition(timestamp)
        const y = calculateYPosition(label)

        if (specCalMethod === 'constant-q'){
            if (timestamp === label.onset){
                drawCurvedOnsetNew(specCVS, waveformCVS, timestamp, lineColor)
            }
            if (timestamp === label.offset){
                drawCurvedOffsetNew(specCVS, waveformCVS, timestamp, lineColor)
            }
        } else {
            waveformCTX.beginPath()
            waveformCTX.setLineDash([1, 1])
            waveformCTX.moveTo(x, 0)
            waveformCTX.lineTo(x, waveformCVS.height)
            waveformCTX.lineWidth = 2
            waveformCTX.strokeStyle = lineColor
            waveformCTX.stroke()
            waveformCTX.setLineDash([])

            specCTX.beginPath()
            specCTX.setLineDash([1, 1])
            specCTX.moveTo(x, 0)
            specCTX.lineTo(x, specCVS.height)
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
        let y = calculateYPosition(label)

        
        // Position annotate area labels one pixel higher, so they don't get cut in half at the canvas edge
        if (label.species === ANNOTATED_AREA){
            y--
        }

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


        // Draw diamond marker at the middle
        if (label.minFreq !== ''){
            const diamondSize = 5; // Size of the diamond marker
            ctx.beginPath();
            // ctx.moveTo((xOffset + xOnset)/2, y - diamondSize);   // Top of diamond
            // ctx.lineTo((xOffset + xOnset)/2 + diamondSize, y);   // Right of diamond
            ctx.moveTo((xOffset + xOnset)/2 + diamondSize, y);   // Right of diamond
            ctx.lineTo((xOffset + xOnset)/2, y + diamondSize);   // Bottom of diamond
            ctx.lineTo((xOffset + xOnset)/2 - diamondSize, y);   // Left of diamond
            ctx.closePath();
            ctx.stroke();  // Stroke the diamond marker, or you can use ctx.fill() to fill it
        }

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

        const curve_top_pos = calculateXPosition(curve_time)
        const curve_width = (0.5 * binsPerOctave / minFreq) * globalSamplingRate / globalHopLength
        const offset_para = curve_width * Math.pow(2, -n_bins / binsPerOctave)

        let xs = []
        for (let i = 0; i < cvs.width; i += 0.01){
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
            let y = i * HEIGHT_BETWEEN_INDIVIDUAL_LINES
            // Position last line one pixel higher, so they don't get cut in half at the canvas edge
            if (i === numberOfIndividuals){
                y--
            }

            ctx.beginPath()
            ctx.setLineDash([1, 3])
            ctx.moveTo(x1, y)
            ctx.lineTo(x2, y)
            ctx.lineWidth = 1
            ctx.strokeStyle = ctx.strokeStyle = '#ffffff'
            ctx.stroke()
            ctx.setLineDash([])
        }

        // Always draw active label except for the track where it originates from (to prevent the active label from overdrawing the original label)
        // Don't draw it if active label is being dragged, to avoid drawing the outdated active label
        
        // UPDATE: do not draw active label at this canvas
        if (activeLabel && activeLabel?.trackID !== trackID && !draggedActiveLabel) {
            drawActiveLabel(activeLabel)
        }

        if (!labels.length) return

        for (let label of labels) {
            // If label is outside the viewport, don't draw it to save computing resource
            if ( (label.onset < currentStartTime && label.offset < currentStartTime) || (label.onset > currentEndTime && label.offset > currentEndTime)){
                continue
            }

            // If a user sets an onset without offset, the onset line will be drawn until he sets an offset, so he doesn't forget about it:
            if (!label.offset){
                drawLine(label, label.onset)
            }

            // If label is currently dragged (clickedLabel is true) draw the dragged label in full
            if (clickedLabel) {
                if (label.id === clickedLabel?.id){
                    drawFullLabel(label)
                }
            }

            // If no label is currently dragged (clickedLabel is false) draw the active label in full
            if (!clickedLabel && activeLabel) {
                if (label.id === activeLabel.id){
                    drawFullLabel(label)
                }
            }

            // Draw expanded labels always in full
            if (label.id === expandedLabel?.id) {
                drawFullLabel(label)
            }

            // Draw all other labels like this
            else {
                drawLineBetween(label)
            }
        }
    }

    const drawFullLabel = (label) => {
        drawLine(label, label.onset)
        drawLine(label, label.offset)
        drawLineBetween(label)
        drawClustername(label)
    }

    const drawActiveLabel = (newActiveLabel) => {
        drawLine(newActiveLabel, newActiveLabel.onset)
        drawLine(newActiveLabel, newActiveLabel.offset)
    }

    const drawIndividualsCanvas = () => {
        const cvs = individualsCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true })
        ctx.clearRect(0, 0, cvs.width, cvs.height )        

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
            const speciesName = speciesObj.name === UNKNOWN_SPECIES ? 'Unknown Species' : speciesObj.name
            ctx.fillText(speciesName, xSpeciesName, ySpeciesName)

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

    const clearAndRedrawSpecAndWaveformCanvases = (currentPlayheadTime) => {
        if (!specCanvasRef.current || !waveformCanvasRef.current || !specImgData.current || !waveformImgData.current) return

        const specCVS = specCanvasRef.current
        const specCTX = specCVS.getContext('2d',{ willReadFrequently: true })
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d', { willReadFrequently: true })
        specCTX.clearRect(0, 0, specCVS.width, specCVS.height)
        specCTX.putImageData(specImgData.current, 0, 0)
        waveformCTX.clearRect(0, 0, waveformCVS.width, waveformCVS.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        drawFrequencyLines(frequencies)
        drawPlayhead(currentPlayheadTime)
    }

    /* ++++++++++++++++++ Label manipulation methods ++++++++++++++++++ */
    const addNewLabel = (onset) => {
        if (!activeSpecies){
            toast.error('Add at least one species before annotating.')
            return
        }

        const individual = activeSpecies? activeSpecies.individuals.find(individual => individual.isActive): null
        const clustername = activeSpecies? activeSpecies.clusternames.find(clustername => clustername.isActive): null

        const allIndividualIDs = getAllIndividualIDs(speciesArray)
        const individualIndex = allIndividualIDs.indexOf(individual.id)

        const newMinFreq = ''; 
        const newMaxFreq = ''; 

        const newLabel = new Label(
            nanoid(),
            trackID,
            trackData.filename,
            onset,
            undefined,
            newMinFreq,
            newMaxFreq,
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

        emitter.emit('dataChange', {
            onset: newLabel.onset,
            offset: newLabel.offset,
            id: newLabel.id,
            trackID: trackID,
            color: ACTIVE_LABEL_COLOR,
        })
    }

    const deleteLabel = (labelToBeDeleted) => {
        const filteredLabels = labels.filter(label => label !== labelToBeDeleted)
        setLabels(filteredLabels)

        if (labelToBeDeleted?.id === expandedLabel?.id){
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

    const dragOnset =  (event) => {
        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
        clickedLabel.onset = calculateTimestamp(event)              
    }


    const dragOffset = (event) => {
        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
        clickedLabel.offset = calculateTimestamp(event)
    }

    const dragActiveLabelOnset = (event) => {
        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
        draggedActiveLabel.onset = calculateTimestamp(event)
        drawLine(draggedActiveLabel, draggedActiveLabel.onset)
        drawLine(draggedActiveLabel, draggedActiveLabel.offset)
    }

    const dragActiveLabelOffset = (event) => {
        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
        draggedActiveLabel.offset = calculateTimestamp(event)
        drawLine(draggedActiveLabel, draggedActiveLabel.onset)
        drawLine(draggedActiveLabel, draggedActiveLabel.offset)
    }

    const dragMaxFreqLine = (event) => {
        // prevent the y value from being negative
        let newMaxFreqY = Math.max(0, getMouseY(event))
        if (newMaxFreqY >= draggedFrequencyLinesObject.minFreqY - 5 ) return

        if (newMaxFreqY <= 2){
            newMaxFreqY = 0
        }
        draggedFrequencyLinesObject.maxFreqY = newMaxFreqY
        
        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
    }

    const dragMinFreqLine = (event) => {
        let newMinFreqY = getMouseY(event)
        if (newMinFreqY <= draggedFrequencyLinesObject.maxFreqY + 5 ) return
        
        // Adjust the minFreq line manually to allow it to be dragged to the very bottom of the canvas
        if (newMinFreqY >= specCanvasRef.current.height - 2) {
            newMinFreqY = specCanvasRef.current.height
        }
        draggedFrequencyLinesObject.minFreqY = newMinFreqY

        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
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

    const updateLabelsWithSpeciesArrayData = () => {
        const allIndividualIDs = getAllIndividualIDs(speciesArray)

        // Iterate over the labels array
        return labels.map(label => {
            // Create an updated label with old values
            const updatedLabel = new Label(
                label.id,
                trackID,
                trackData.filename,
                label.onset,
                label.offset,
                label.minFreq,
                label.maxFreq,
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
    }

    const assignSpeciesInformationToImportedLabels = (currentSpeciesArray, genericLabelObjectsArray) => {
        const allIndividualIDs = getAllIndividualIDs(currentSpeciesArray)

        // Iterate over the imported labels array
        return genericLabelObjectsArray.map( label => {

            // WhisperSeg currently doesn't support Frequency Annotation, so if the imported label has no frequency, assign empty string
            // const newMinFreq = (label.minFreq || label.minFreq===0 )? label.minFreq : ''
            // const newMaxFreq = (label.maxFreq || label.maxFreq===0 )? label.maxFreq : ''
            const newMinFreq = ( (label.minFreq || label.minFreq===0) && label.minFreq !== -1 )? label.minFreq : ''
            const newMaxFreq = ( (label.maxFreq || label.maxFreq===0) && label.maxFreq !== -1 )? label.maxFreq : ''

            // Create a new Label object with the imported values
            const updatedLabel = new Label(
                nanoid(),
                trackID,
                trackData.filename,
                label.onset,
                label.offset,
                newMinFreq,
                newMaxFreq,
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
            for (const speciesObj of currentSpeciesArray) {
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
            overviewTimeAxisContainerRef.current.addEventListener('mousemove', dragStartFrame)
            overviewTimeAxisContainerRef.current.addEventListener('mouseleave', stopDragViewport)
            return
        }

        // Deal with click on End Frame
        if (!strictMode && mouseX >= xEndFrame - 2 && mouseX <= xEndFrame + 2){
            overviewTimeAxisContainerRef.current.addEventListener('mousemove', dragEndFrame)
            overviewTimeAxisContainerRef.current.addEventListener('mouseleave', stopDragViewport)
            return
        }

        // Deal with click inside viewport
        if (mouseX > xStartFrame && mouseX < xEndFrame){
            const xStartTime = calculateViewportFrameX(currentStartTime)
            const xCurrentEndTime = calculateViewportFrameX(currentEndTime)
            widthBetween_xStartTime_mouseX = mouseX - xStartTime
            widthBetween_xEndTime_mouseX = xCurrentEndTime - mouseX
            overviewTimeAxisContainerRef.current.addEventListener('mousemove', dragViewport)
            overviewTimeAxisContainerRef.current.addEventListener('mouseleave', stopDragViewport)
        }
    }

    const stopDragViewport = () => {
        overviewTimeAxisContainerRef.current.removeEventListener('mousemove', dragStartFrame)
        overviewTimeAxisContainerRef.current.removeEventListener('mousemove', dragEndFrame)
        overviewTimeAxisContainerRef.current.removeEventListener('mousemove', dragViewport)
        overviewTimeAxisContainerRef.current.removeEventListener('mouseleave', stopDragViewport)

        // Set new Viewport (Start & Endframe). This happens when the user drags the overview scroll bar
        if (widthBetween_xStartTime_mouseX && (newViewportStartFrame || newViewportEndFrame)){
            const newDuration = newViewportEndFrame - newViewportStartFrame
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentStartTimeToApp( newViewportStartFrame )
            passCurrentEndTimeToApp( newViewportEndFrame )
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO)
            // Set new Start Frame only
        } else if (newViewportStartFrame || newViewportStartFrame === 0){
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
        const mouseX = getMouseXInOverviewTimeAxisContainer(event)
        newViewportStartFrame = calculateViewportTimestamp(mouseX)

        // Prevent the user from setting the viewport too small or the start Frame to go beyond the end Frame
        if (newViewportStartFrame > currentEndTime - 0.05){
            newViewportStartFrame = currentEndTime - 0.05
        }

        drawViewport(newViewportStartFrame, currentEndTime, VIEWPORT_COLOR, 2)
    }

    const dragEndFrame = (event) => {
        const mouseX = getMouseXInOverviewTimeAxisContainer(event)
        newViewportEndFrame = calculateViewportTimestamp(mouseX)

        // Prevent the user from setting the viewport too small or the end Frame to go before the start Frame
        if (newViewportEndFrame < currentStartTime + 0.05){
            newViewportEndFrame = currentStartTime + 0.05
        }

        drawViewport(currentStartTime, newViewportEndFrame, VIEWPORT_COLOR, 2)
    }

    const dragViewport = (event) => {
        const mouseX = getMouseXInOverviewTimeAxisContainer(event)
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
        drawViewport(newViewportStartFrame, newViewportEndFrame, VIEWPORT_COLOR, 4)
    }

    const getMouseXInOverviewTimeAxisContainer = (event) => {
        const container = overviewTimeAxisContainerRef.current;
        const rect = container.getBoundingClientRect();
        return event.clientX - rect.left
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
        const viewportWidth = x2 - x1
        const startFrameText = (Math.round(startFrame * 100) / 100).toString()
        const endFrameText = (Math.round(endFrame * 100) / 100).toString()
        const startFrameTextWidth = ctx.measureText(startFrameText).width
        const endFrameTextWidth = ctx.measureText(endFrameText).width
        const xPadding = 5

        // Place startFrame and endFrame timestamps on the outside of the viewport if the space is too small
        const isWideEnough = viewportWidth > startFrameTextWidth + endFrameTextWidth + xPadding * 3

        const startFrameX = isWideEnough ? x1 + xPadding : x1 - startFrameTextWidth - xPadding
        const endFrameX = isWideEnough ? x2 - endFrameTextWidth - xPadding : x2 + xPadding
        const yPadding = isWideEnough ? 5 : 2

        ctx.fillText(startFrameText, startFrameX, overviewCanvas.height - yPadding)
        ctx.fillText(endFrameText, endFrameX, overviewCanvas.height - yPadding)

        // Update Scroll Button positions
        updateViewportScrollButtons(startFrame, endFrame)
    }

    const hoverViewportFrame = (event) => {
        if (strictMode) return

        const xHovered = getMouseX(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + globalClipDuration)

        // Deal with hover on Start Frame
        if ( (xHovered >= xStartFrame - 2 && xHovered <= xStartFrame + 2) || (xHovered >= xEndFrame - 2 && xHovered <= xEndFrame + 2) ){
            overviewRef.current.style.cursor = 'col-resize'
        } else {
            overviewRef.current.style.cursor = 'default'
        }
    }

    const leftScrollOverview = () => {
        passCurrentStartTimeToApp(
            prevStartTime => Math.max(prevStartTime - globalClipDuration * 0.9, 0)
        )
        passCurrentEndTimeToApp(
            prevEndTime => Math.max(prevEndTime - globalClipDuration * 0.9, globalClipDuration)
        )
    }

    const rightScrollOverview = () => {
        passCurrentStartTimeToApp(
            prevStartTime => Math.min(prevStartTime + globalClipDuration * 0.9, maxScrollTime)
        )
        passCurrentEndTimeToApp(
            prevEndTime => Math.min(prevEndTime + globalClipDuration * 0.9, globalAudioDuration)
        )
    }

    /* ++++++++++++++++++ Audio methods ++++++++++++++++++ */
    const getAudio = async (newStartTime, newClipDuration) => {
        // Don't try to retrieve audio if there's no file uploaded, it will cause an error
        if (!spectrogram) return

        // Prevent user from clicking the play button twice in a row and playing the audio twice at the same time
        if (audioSnippet && !audioSnippet.paused) return

        // If the user plays the same audio clip multiple times without changing start or end time, just play the
        // existing audio clip and don't request new audio clip from the backend each time
        if (newStartTime === playWindowTimes?.startTime && newClipDuration === playWindowTimes?.clipDuration){
            playAudio()
            return
        }

        // Else, start process to get a new audio snippet from the backend
        setAudioSnippet(null)
        setPlayWindowTimes( {startTime: newStartTime, clipDuration: newClipDuration} )

        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-wav'
        try {
            const response = await axios.post(path, {
                audio_id: audioId,
                start_time: newStartTime,
                clip_duration: newClipDuration
            })
            handleNewAudio(response.data.wav)
        } catch (error) {
            toast.error('Something went wrong trying to play back the audio. Check the console for more information.')
            console.error("Error fetching audio clip:", error)
        }
    }

    const handleNewAudio = (newAudioBase64String) => {
        const audio = new Audio(`data:audio/ogg;base64,${newAudioBase64String}`)
        setAudioSnippet(audio)
    }

    const playAudio = () => {
        audioSnippet.play()
        loop()
    }

    function loop(){
        if (audioSnippet.paused){
            pauseAudio()
            return
        }

        clearAndRedrawSpecAndWaveformCanvases(playWindowTimes?.startTime + audioSnippet.currentTime)
        window.requestAnimationFrame(() => loop() )
    }

    const pauseAudio = () => {
        if (!audioSnippet) return
        audioSnippet.pause()
        updatePlayhead(playWindowTimes?.startTime + audioSnippet.currentTime)
    }

    const stopAudio = () => {
        if (!audioSnippet) return

        audioSnippet.pause()
        audioSnippet.currentTime = playWindowTimes?.startTime
        updatePlayhead(0)

        clearAndRedrawSpecAndWaveformCanvases(null)
    }

    const updatePlayhead = (newTimeframe) => {
        playheadRef.current.timeframe = newTimeframe
    }

    const drawPlayhead = (timeframe) => {
        if (!timeframe) return

        const specCVS = specCanvasRef.current
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true });
        const waveformCVS = waveformCanvasRef.current
        const waveformCTX = waveformCVS.getContext('2d', { willReadFrequently: true });

        const x = calculateXPosition(timeframe)
        const playHeadColor = '#ff0000'

        specCTX.lineWidth = 2
        specCTX.strokeStyle = playHeadColor
        waveformCTX.lineWidth = 2
        waveformCTX.strokeStyle = playHeadColor
        waveformCTX.fillStyle = playHeadColor

        specCTX.beginPath()
        specCTX.moveTo(x, 0)
        specCTX.lineTo(x, specCVS.height)
        specCTX.stroke()

        waveformCTX.beginPath()
        waveformCTX.moveTo(x, 0)
        waveformCTX.lineTo(x, waveformCVS.height)
        waveformCTX.moveTo(x, 1)
        waveformCTX.lineTo(x+3, 6)
        waveformCTX.lineTo(x, 12)
        waveformCTX.lineTo(x-3, 6)
        waveformCTX.lineTo(x, 1)
        waveformCTX.fill();
        waveformCTX.stroke()
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

        try {
            const response = await axios.post(path, requestParameters);
            return response.data.wav_array
        } catch(error) {
            toast.error('Something went wrong trying to get the audio waveform. Check the console for more information.')
            console.error("Error fetching audio array for waveform:", error)
        }
    }

    const drawWaveform = (newAudioArray) => {
        if (!waveformCanvasRef.current || !newAudioArray || !displayWaveform) return

        const canvas = waveformCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
        canvas.width = parent.innerWidth - TRACK_SIDEBAR_WIDTH

        const centerY = canvas.height / 2
        const ratio = Math.min((trackData.audioDuration - currentStartTime) / globalClipDuration, 1)
        ctx.strokeStyle = WAVEFORM_COLOR

        for (let i = 0; i < newAudioArray.length - 1; i++) {  // Subtract 1 from length to avoid accessing out-of-bounds index
            const datapoint = newAudioArray[i]
            const nextDatapoint = newAudioArray[i + 1] // Store next datapoint to avoid re-indexing

            const y = centerY - waveformScale * datapoint // Subtract from centerY to flip the waveform
            const nextY = centerY - waveformScale * nextDatapoint // Similarly, subtract for the next point

            ctx.beginPath()
            ctx.moveTo(i * canvas.width * ratio / newAudioArray.length, y)
            ctx.lineTo((i + 1) * canvas.width * ratio / newAudioArray.length, nextY)
            ctx.stroke()
        }

        // Draw flat line representing silence
        ctx.beginPath()
        ctx.moveTo(canvas.width * ratio, centerY)
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

    const toggleDisplayWaveform = () => {
        if (!spectrogram) return
        setDisplayWaveform(!displayWaveform)
    }


    /* ++++++++++++++++++ Tracks ++++++++++++++++++ */

    const handleRemoveTrack = () => {
        if (!confirm('Removing this track will delete any annotations you have made in it.')) return

        stopAudio()
        removeTrackInApp(trackID)
    }

    /* ++++++++++++++++++ Track Container ++++++++++++++++++ */
    const handleMouseLeaveTrackContainer = () => {
        const newestLabel = labels[labels.length -1]
        if (newestLabel && !newestLabel.offset){
            deleteLabel(newestLabel)
            emitter.emit('dataChange', {
                onset: undefined,
                offset: undefined,
                id: undefined,
                trackID: undefined,
                color: undefined,
            })
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

        // Get correct frequencies
        const specCanvasHeight = specCanvasRef.current.height
        const distanceBetweenLines = specCanvasHeight / 6

        const linePositions = []
        for (let i = specCanvasHeight; i >= 0; i-= distanceBetweenLines){
            linePositions.push(i)
        }

        const selectedFrequencies = linePositions.map( y => getFrequencyAtYPosition(y, specCanvasHeight, frequenciesArray))

        // Draw the frequencies
        let y = cvs.height
        const x1 = cvs.width - 10
        const x2 = cvs.width
        let i = 0
        for (let freq of selectedFrequencies){
            let textY = y
            let freqText = `${(freq / 10) * 10}`
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
            y -= distanceBetweenLines
            i++
        }

        if (showWaveform){
            ctx.fillText('Hz', 0, 10);
        }

    }

    const handleClickFrequencyLinesBtn = () => {
        // setShowFrequencyLines(true)
        // // setFrequencyLines({...frequencyLines})
        // setFrequencyLines({maxFreqY: 0, minFreqY: specCanvasHeight})
        // allowUpdateMinFreqGivenLineY.current = true
        // allowUpdateMaxFreqGivenLineY.current = true

        setShowFrequencyLines(true)
        setFrequencyLines({maxFreqY: -10, minFreqY: specCanvasHeight + 10})
        allowUpdateMinFreqGivenLineY.current = false
        allowUpdateMaxFreqGivenLineY.current = false
        setNumFreqLinesToAnnotate(2)

        
    }

    const handleClickRemoveAnnotatedFreqBtn = ()=>{
        setNumFreqLinesToAnnotate(0)
        passExpandedLabelToTrack( {...expandedLabel, minFreq:'', maxFreq:''} )
        allowUpdateMinFreqGivenLineY.current = false
        allowUpdateMaxFreqGivenLineY.current = false
    }

    const getFrequencyAtYPosition = (y, canvasHeight, frequenciesArray) => {
        // Use array.length - 1 to match the inverse function
        let index = Math.round(((canvasHeight - y) / canvasHeight) * (frequenciesArray.length - 1));
        index = Math.min(index, frequenciesArray.length - 1);
        index = Math.max(0, index);
        return frequenciesArray[index];
    };
    
    const getYPositionAtFrequency = (frequency, canvasHeight, frequenciesArray) => {
        if ( frequency === '' ) return -20
        if ( frequency < frequenciesArray[0] - 1 ) return canvasHeight + 10  // -1 to make sure frequency is really small enough
        if ( frequency > frequenciesArray[frequenciesArray.length - 1] + 1 ) return -10 // +1 to make sure frequency is really large enough

        let closestIndex = frequenciesArray.reduce((closestIdx, currentFreq, currentIdx) => {
            return Math.abs(currentFreq - frequency) < Math.abs(frequenciesArray[closestIdx] - frequency)
                ? currentIdx
                : closestIdx;
        }, 0);
    
        let y = Math.round((1 - closestIndex / (frequenciesArray.length - 1)) * canvasHeight);
        return Math.max(0, Math.min(canvasHeight, y));
    };
    

    const drawFrequencyLines = (frequenciesArray) => {
        if (!showFrequencyLines) return

        const cvs = specCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true, alpha: true })

        ctx.strokeStyle = FREQUENCY_LINES_COLOR
        ctx.fillStyle = FREQUENCY_LINES_COLOR
        // ctx.lineWidth = 1
        const triangleHeight = 7

        // Determine if there is enough space between the frequency lines to display the frequencies as the correct position
        const enoughSpaceBetweenLines = frequencyLines.minFreqY - frequencyLines.maxFreqY > 22

        // Draw Max Frequency
        let x1 = 0
        let x2 = cvs.width
        let y = frequencyLines.maxFreqY
        let textY = enoughSpaceBetweenLines ? y + 10 : y - 10
        const currentMaxFreq = `${getFrequencyAtYPosition(y, cvs.height, frequenciesArray)} Hz`

        ctx.lineWidth = y > 0 ? 1 : 2

        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
        ctx.fillText(currentMaxFreq, 0, textY)

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
        y = frequencyLines.minFreqY
        textY = enoughSpaceBetweenLines ? y - 4 : y + 17
        const currentMinFreq = `${getFrequencyAtYPosition(y, cvs.height, frequenciesArray)} Hz`

        ctx.lineWidth = y < cvs.height ? 1 : 2

        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
        ctx.fillText(currentMinFreq, 0, textY)

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

    /* ++++++++++++++++++ UseEffect Hooks ++++++++++++++++++ */

    // When labels or the Waveform Scale value are manipulated
    useEffect( () => {
        if (!spectrogram || !audioArray) return
        drawAllCanvases(spectrogram, frequencies, audioArray)
    }, [labels, waveformScale, showWaveform, showFrequencyLines, trackData.visible, showOverviewBarAndTimeAxis, 
        canvasWidth, specCanvasHeight, 
        spectrogram] )  // debugging: add spectrogram into useEffect

    // When a user adds a new label, thus creating a new active label in the other tracks
    useEffect( () => {
        if (!spectrogram) return
        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)

        // Update the original label with the new onset or offset from the dragged active label
        if (trackID === activeLabel?.trackID || activeSpecies.name === ANNOTATED_AREA) {
            const updatedLabels = labels.map(label => {

                if (label.id === activeLabel.id) {
                    return new Label(
                        label.id,
                        label.trackID,
                        label.filename,
                        activeLabel.onset,
                        activeLabel.offset,
                        label.minFreq,
                        label.maxFreq,
                        label.species,
                        label.individual,
                        label.clustername,
                        label.speciesID,
                        label.individualID,
                        label.clusternameID,
                        label.individualIndex,
                        label.annotator,
                        label.color,
                    )

                } else {
                    return label
                }
            })
            setLabels(updatedLabels)
        }
    }, [activeLabel] )

    // When user zoomed or scrolled, or when the spectrogram's brightness and contrast is modified
    useEffect( () => {
            if (!globalClipDuration || !trackData.audioID) return

            if (audioSnippet) {
                audioSnippet.pause()
                audioSnippet.currentTime = currentStartTime
            }

            getSpecAndAudioArray()

    }, [currentStartTime, globalClipDuration, audioId, specBrightness, specContrast, colorMap])

    // When a user adds, deletes, renames or recolors species, individuals or clusternames in the SpeciesMenu Component
    useEffect(() => {
        if (!speciesArray) return

        const updatedLabels = updateLabelsWithSpeciesArrayData()

        setLabels(updatedLabels)

    }, [speciesArray])

    // When a CSV File is uploaded (or labels are passed through the URL parameter)
    useEffect( () => {
        if (!importedLabels) return

        let newImportedLabels = importedLabels.filter( label => label.channelIndex === trackData.channelIndex && label.filename === trackData.filename)
        newImportedLabels = assignSpeciesInformationToImportedLabels(speciesArray, newImportedLabels)

        setLabels((prevLabels) => [...prevLabels, ...newImportedLabels])

    }, [importedLabels])

    // When a new audio file was uploaded
    useEffect( () => {
            if (!trackData.audioID) return

            // Update track specific values
            setAudioId(trackData.audioID)
            setSpectrogramIsLoading(true)

            // Close Label Window
            setExpandedLabel(null)

            // In strict mode, if imported labels exist don't delete the labels of this track
            if (strictMode && importedLabels) return

            // In free mode delete all existing labels of this track
            setLabels([])

    }, [trackData.audioID])

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

    // When the user clicks the Export button in Export.jsx or Submit button in App.jsx
    useEffect( () => {
        if (!exportRequest && !submitRequest) return
        // sort the labels in ascending order of the onset before passing them to the App
        const sortedLabels = [...labels].sort( (a,b)=> a.onset - b.onset )
        addLabelsToApp(sortedLabels)
    }, [exportRequest, submitRequest])

    // Set up Resize event handler to update Canvas Dimensions when user resizes the browser window
    useEffect(() => {
        window.addEventListener('resize', handleWindowResize)

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('resize', handleWindowResize)
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current)
            }
        }
    }, [])

    // Set up emitter event handler to pass new active label between sibling Track.jsx components
    useEffect(() => {
        const handler = (newActiveLabel) => {
            setActiveLabel(newActiveLabel)
        }
        emitter.on('dataChange', handler)

        // Clean up the event listener on unmount
        return () => {
            emitter.off('dataChange', handler)
        }
    }, [])

    // Set up visibility change handler, to refresh canvases when user switches to another tab
    // I found this is only necessary when using Chrome on macOS
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                drawAllCanvases(spectrogram, frequencies, audioArray)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [spectrogram, frequencies, audioArray, labels, activeLabel, frequencyLines, showFrequencyLines])

    // When input window is open, disable scrolling, so users can use the arrow keys inside the input fields
    useEffect(() => {
        if (showLocalConfigWindow || expandedLabel) {
            setAnyWindowsOpen(true);
        } else {
            setAnyWindowsOpen(false);
        }
    }, [showLocalConfigWindow, expandedLabel]);

    useEffect(() => {
        if (specCanvasRef!==null && frequencyLines!==null && frequencies!==null){
            if (frequencyLines.minFreqY > specCanvasRef.current.height && frequencyLines.maxFreqY < 0 ) return
            if (!expandedLabel) return

            // only update frequency range when the frequency lines are dragged or when initialize the frequency after clicking the Annotate Frequency button
            const currentMinFreq = expandedLabel.minFreq
            const currentMaxFreq = expandedLabel.maxFreq

            const newFrequencyRanges = {
                minFreq: !allowUpdateMinFreqGivenLineY.current ? currentMinFreq : getFrequencyAtYPosition(frequencyLines.minFreqY, specCanvasRef.current.height, frequencies) ,
                maxFreq: !allowUpdateMaxFreqGivenLineY.current ? currentMaxFreq : getFrequencyAtYPosition(frequencyLines.maxFreqY, specCanvasRef.current.height, frequencies)
            }
            setfrequencyRanges(newFrequencyRanges)
            }
    }, [frequencyLines]);

    useEffect(()=>{
        if (expandedLabel == null||frequencyRanges == null) return
        setExpandedLabel( {...expandedLabel, ...frequencyRanges } )
    },[ frequencyRanges ]);

    useEffect(() => {

        if (!expandedLabel){
            setNumFreqLinesToAnnotate(0)
        }

        if (!expandedLabel){
            setShowFrequencyLines(false);
            allowUpdateMinFreqGivenLineY.current = false
            allowUpdateMaxFreqGivenLineY.current = false
        }else{
            setShowFrequencyLines(true);
            // note: do not add the else logic here no purpose, one cannot trigger allowUpdateMinFreqGivenLineY based on the value of minFreq automatically.
            if (expandedLabel.minFreq===""){
                allowUpdateMinFreqGivenLineY.current = false
            }
            if (expandedLabel.maxFreq===''){
                allowUpdateMaxFreqGivenLineY.current = false
            }
        }

        // update the frequencyLines based on the updated expandedLabel
        if (specCanvasRef!==null && frequencyLines!==null && frequencies!==null && expandedLabel!==null){
            const newMinFreqY = getYPositionAtFrequency(expandedLabel.minFreq, specCanvasRef.current.height, frequencies)
            const newMaxFreqY = getYPositionAtFrequency(expandedLabel.maxFreq, specCanvasRef.current.height, frequencies)
            // This is needed for updating the frequency lines when clicking a annotated segment
            if ( newMinFreqY!==frequencyLines.minFreqY || newMaxFreqY!==frequencyLines.maxFreqY ){
                setFrequencyLines( { minFreqY:newMinFreqY, maxFreqY:newMaxFreqY } )
            }
        }

        // remove the uncompleted label in labels if exists.
        if ( labels!==null && expandedLabel!==null ){
            let updatedLabel = new Label(
                expandedLabel.id,
                expandedLabel.trackID,
                expandedLabel.filename,
                expandedLabel.onset,
                expandedLabel.offset,
                expandedLabel.minFreq,
                expandedLabel.maxFreq,
                expandedLabel.species,
                expandedLabel.individual,
                expandedLabel.clustername,
                expandedLabel.speciesID,
                expandedLabel.individualID,
                expandedLabel.clusternameID,
                expandedLabel.individualIndex,
                expandedLabel.annotator,
                expandedLabel.color
            )
            const updatedLabels = labels.filter( label => label.id !== expandedLabel.id && label.offset )
            updatedLabels.push(updatedLabel)
            passLabelsToTrack(updatedLabels)
        }
     },[ expandedLabel ])

    useEffect(()=>{
        if (!globalClipDuration || !trackData.audioID) return
        clearAndRedrawSpecAndWaveformCanvases(playheadRef.current.timeframe)
        
        const specCVS = specCanvasRef.current;
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true, alpha: false });
        specCTX.clearRect(0, 0, specCVS.width, specCVS.height);

        drawFrequenciesAxis(frequencies);

    },[ specCanvasHeight ]);

    useEffect(()=>{
        setDisplayWaveform( showAllWaveforms );
    },[ showAllWaveforms ]);

    useEffect(()=>{
        if (!audioArray || !displayWaveform) return
        const canvas = waveformCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawWaveform( audioArray )
        drawAllLabels()
    },[ audioArray, displayWaveform ]);

    useEffect(()=>{
        setShowLabelAndIndividualsCanvas( showAllLabels );
    },[ showAllLabels ]);

    useEffect(()=>{
        if (!showLabelAndIndividualsCanvas || !labelCanvasRef.current ) return
        if (!globalClipDuration || !trackData.audioID) return
        const labelCVS = labelCanvasRef.current
        const labelCTX = labelCVS.getContext('2d', { willReadFrequently: true, alpha: true });
        labelCTX.clearRect(0, 0, labelCVS.width, labelCVS.height)
        drawIndividualsCanvas()
        drawAllLabels()
    },[ showLabelAndIndividualsCanvas ]);

    useEffect(()=>{
        setSpecBrightness( globalSpecBrightness )
        setSliderSpecBrightnessValue( globalSpecBrightness )
    },[ globalSpecBrightness ]);

    useEffect(()=>{
        setSpecContrast( globalSpecContrast )
        setSliderSpecContrastValue( globalSpecContrast )
    },[ globalSpecContrast ]);

    useEffect(()=>{
        setColorMap( globalColorMap )
    },[ globalColorMap ]);


    return (
        <>
            {showOverviewBarAndTimeAxis && trackData &&
                <div
                    id='overview-time-axis-container'
                    ref={overviewTimeAxisContainerRef}
                    onMouseUp={handleMouseUpOverview}
                    onContextMenu={(event) => event.preventDefault()}
                    style={{"paddingLeft":`0px`,
                            "marginLeft":`${TRACK_SIDEBAR_WIDTH}px`
                            }}
                >
                    <canvas
                        className='overview-canvas'
                        ref={overviewRef}
                        width={parent.innerWidth - TRACK_SIDEBAR_WIDTH}
                        height={OVERVIEW_CVS_HEIGHT}
                        onMouseDown={handleLMBDownOverview}
                        onMouseMove={hoverViewportFrame}
                    />
                    <button
                        id='left-scroll-overview-btn'
                        onClick={leftScrollOverview}
                        style={{"paddingLeft":`${TRACK_SIDEBAR_WIDTH - 200 + 3}px`,
                                "marginLeft":"0px"
                        }}
                    />
                    <button
                        id='right-scroll-overview-btn'
                        onClick={rightScrollOverview}
                        style={{"marginLeft":`${TRACK_SIDEBAR_WIDTH - 200 - 3  }px`}}
                    />
                    <canvas
                        className='time-axis-canvas'
                        ref={timeAxisRef}
                        width={parent.innerWidth - TRACK_SIDEBAR_WIDTH}
                        height={TIMEAXIS_CVS_HEIGHT}
                        onContextMenu={(event) => event.preventDefault()}
                    />
                </div>
            }
            {
                !trackData.visible ?
                    <div className='hidden-track-container'>
                        <Tooltip title={`Show Track ${trackData.trackIndex}`}>
                            <IconButton style={toggleVisibilityBtn}
                                        onClick={() => toggleTrackVisibility(trackID)}>
                                <VisibilityIcon style={icon}/>
                            </IconButton>
                        </Tooltip>
                        {`Track ${trackData.trackIndex} - ${trackData.filename ? trackData.filename : 'No audio'}`}
                    </div>
                :
                <div
                    className='track-container'
                    onMouseLeave={handleMouseLeaveTrackContainer}
                >
                    <Box display="flex" flexDirection="column" width="100vw">
                        <Box display="flex" flexDirection="row">
                            {/* Box_left */}
                            <Box display="flex" flexDirection="column">
                                <Box display="flex" flexDirection="row">
                                    <Box
                                        width={`${controlPanelWidth}px`}
                                        height={`${WAVEFORM_CVS_HEIGHT + specCanvasHeight}px`}
                                        border={0}
                                        display="flex"
                                        flexDirection="row" // Arrange buttons in a row to allow wrapping
                                        flexWrap="wrap" // Enable wrapping to form a grid layout
                                        alignContent="flex-start" // Align content to the top of the container
                                        style={{ overflowY: 'auto', overflowX: 'hidden' }} // Restrict overflow to vertical with hidden horizontal scroll
                                    >
                                            <LocalFileUpload
                                                filename={trackData.filename}
                                                trackID={trackID}
                                                specCalMethod={specCalMethod}
                                                nfft={nfft}
                                                binsPerOctave={binsPerOctave}
                                                minFreq={minFreq}
                                                maxFreq={maxFreq}
                                                passSpectrogramIsLoadingToTrack={passSpectrogramIsLoadingToTrack}
                                                handleUploadResponse={handleUploadResponse}
                                                handleUploadError={handleUploadError}
                                                strictMode={strictMode}
                                                colorMap={colorMap}
                                            />
                                            <Tooltip title={`Hide Track ${trackData.trackIndex}`}>
                                                <IconButton
                                                    style={toggleVisibilityBtn}
                                                    onClick={() => toggleTrackVisibility(trackID)}
                                                >
                                                    <VisibilityOffIcon style={icon}/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={displayWaveform ? 'Hide Waveform' : 'Show Waveform'}>
                                                <IconButton
                                                    style={{
                                                        position: 'relative',
                                                        paddingBottom: "15px",
                                                        marginTop: "8px",
                                                        marginRight: "15px",
                                                        marginLeft: "8px",
                                                    }}
                                                    onClick={ toggleDisplayWaveform }
                                                    >
                                                    {/* First Icon */}
                                                    <GraphicEqIcon
                                                        style={{
                                                        position: 'absolute',
                                                        top: '0',
                                                        left: '0',
                                                        // fontSize: '24px',
                                                        color: "white"
                                                        }}
                                                    />
                                                    {/* Second Icon */}
                                                    { displayWaveform?
                                                        <VisibilityOffIcon
                                                            style={{
                                                            position: 'absolute',
                                                            top: '-5',
                                                            left: '15px', // Adjust for overlap
                                                            fontSize: '16px',
                                                            color: "white"
                                                            }}
                                                        />:
                                                        <VisibilityIcon
                                                            style={{
                                                            position: 'absolute',
                                                            top: '-5',
                                                            left: '15px', // Adjust for overlap
                                                            fontSize: '16px',
                                                            color: "white"
                                                            }}
                                                        />
                                                    }
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={`${showLabelAndIndividualsCanvas ? 'Hide' : 'Show'} Annotations Panel`}>
                                                <IconButton
                                                    style={{
                                                        position: 'relative',
                                                        paddingBottom: "15px",
                                                        marginTop: "8px",
                                                        marginRight: "15px",
                                                        marginLeft: "8px",
                                                    }}
                                                    onClick={ ()=>{ setShowLabelAndIndividualsCanvas(!showLabelAndIndividualsCanvas) } }
                                                    >
                                                    {/* First Icon */}
                                                    <LineStyleIcon
                                                        style={{
                                                        position: 'absolute',
                                                        top: '0',
                                                        left: '0',
                                                        // fontSize: '24px',
                                                        color: "white"
                                                        }}
                                                    />
                                                    {/* Second Icon */}
                                                    { showLabelAndIndividualsCanvas?
                                                        <VisibilityOffIcon
                                                            style={{
                                                            position: 'absolute',
                                                            top: '-5',
                                                            left: '15px', // Adjust for overlap
                                                            fontSize: '16px',
                                                            color: "white"
                                                            }}
                                                        />:
                                                        <VisibilityIcon
                                                            style={{
                                                            position: 'absolute',
                                                            top: '-5',
                                                            left: '15px', // Adjust for overlap
                                                            fontSize: '16px',
                                                            color: "white"
                                                            }}
                                                        />
                                                    }
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Change Track Parameters">
                                                <IconButton
                                                    style={{...activeIconBtnStyle, ...(spectrogramIsLoading && iconBtnDisabled)}}
                                                    disabled={spectrogramIsLoading}
                                                    onClick={() => setShowLocalConfigWindow(true)}
                                                >
                                                    <TuneIcon style={activeIcon}/>
                                                </IconButton>
                                            </Tooltip>
                                            <WhisperSeg
                                                audioId={audioId}
                                                minFreq={minFreq}
                                                labels={labels}
                                                speciesArray={speciesArray}
                                                passLabelsToTrack={passLabelsToTrack}
                                                passWhisperSegIsLoadingToTrack={passWhisperSegIsLoadingToTrack}
                                                activeIconBtnStyle={activeIconBtnStyle}
                                                activeIcon={activeIcon}
                                                strictMode={strictMode}
                                                passSpeciesArrayToApp={passSpeciesArrayToApp}
                                                assignSpeciesInformationToImportedLabels={assignSpeciesInformationToImportedLabels}
                                                tokenInference={tokenInference}
                                                tokenFinetune={tokenFinetune}
                                                passTokenInferenceToWhisperSeg={passTokenInferenceToWhisperSeg}
                                                passTokenFinetuneToWhisperSeg={passTokenFinetuneToWhisperSeg}
                                            />
                                            {/* <Tooltip title="Frequency Range">
                                                <IconButton
                                                    style={{...activeIconBtnStyle, ...(!audioId && iconBtnDisabled)}}
                                                    disabled={!audioId}
                                                    onClick={handleClickFrequencyLinesBtn}
                                                >
                                                    <DensityLargeIcon style={{...activeIcon, ...(showFrequencyLines && {color: FREQUENCY_LINES_COLOR})}}/>
                                                </IconButton>
                                            </Tooltip> */}
                                            <Tooltip title="Move Track Up">
                                                <IconButton
                                                    style={{...activeIconBtnStyle, ...(trackData.trackIndex === 0 && iconBtnDisabled)}}
                                                    disabled={trackData.trackIndex === 0}
                                                    onClick={() => moveTrackUp(trackID)}
                                                >
                                                    <VerticalAlignTopIcon style={activeIcon}/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Move Track Down">
                                                <IconButton
                                                    style={{...activeIconBtnStyle, ...(trackData.trackIndex === lastTrackIndex && iconBtnDisabled)}}
                                                    disabled={trackData.trackIndex === lastTrackIndex}
                                                    onClick={() => moveTrackDown(trackID)}
                                                >
                                                    <VerticalAlignBottomIcon style={activeIcon}/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Track">
                                                <IconButton
                                                    style={{...activeIconBtnStyle, ...(strictMode && iconBtnDisabled)}}
                                                    disabled={strictMode}
                                                    onClick={handleRemoveTrack}
                                                >
                                                    <DeleteIcon style={activeIcon}/>
                                                </IconButton>
                                            </Tooltip>
                                        <div className='audio-controls'>
                                            <IconButton
                                                style={iconBtn}
                                                onClick={() => getAudio(currentStartTime, globalClipDuration)}
                                            >
                                                <PlayArrowIcon style={activeIcon}/>
                                            </IconButton>
                                            <IconButton style={iconBtn} onClick={pauseAudio}>
                                                <PauseIcon style={activeIcon}/>
                                            </IconButton>
                                            <IconButton style={iconBtn} onClick={stopAudio}>
                                                <StopIcon style={activeIcon}/>
                                            </IconButton>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", "marginLeft":"3px", "marginRight":"10px" }}>
                                                <Tooltip title="Brightness">
                                                    <LightModeIcon style={{marginLeft: "3px", marginRight: "3px", width:"22px" }} />
                                                </Tooltip>
                                                <input
                                                type="range"
                                                min="0.5"
                                                max="1.5"
                                                step="0.01"
                                                value={sliderSpecBrightnessValue}
                                                onChange={handleSliderSpecBrightnessChange} // Update temporary sliderValue
                                                onMouseUp={handleSliderSpecBrightnessMouseUp} // Update specBrightness on mouse up
                                                onTouchEnd={handleSliderSpecBrightnessMouseUp} // For mobile support
                                                style = {{"width":`${TRACK_SIDEBAR_WIDTH - 100}px`}}
                                                />
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", "marginLeft":"3px", "marginRight":"10px" }}>
                                                <Tooltip title="Contrast">
                                                    <ContrastIcon style={{marginLeft: "3px", marginRight: "3px", width:"22px" }} />
                                                </Tooltip>
                                                <input
                                                type="range"
                                                min="0.5"
                                                max="1.5"
                                                step="0.01"
                                                value={sliderSpecContrastValue}
                                                onChange={handleSliderSpecContrastChange} // Update temporary sliderValue
                                                onMouseUp={handleSliderSpecContrastMouseUp} // Update specBrightness on mouse up
                                                onTouchEnd={handleSliderSpecContrastMouseUp} // For mobile support
                                                style = {{"width":`${TRACK_SIDEBAR_WIDTH - 100}px`}}
                                                />
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", "marginLeft":"3px", "marginRight":"10px", "marginTop":"5px" }}>
                                                <Tooltip title="Color Palette">
                                                    <PaletteIcon style={{marginLeft: "3px", marginRight: "3px", width:"22px" }} />
                                                </Tooltip>
                                                <select
                                                    id="colormap"
                                                    value={colorMap}
                                                    onChange={(event) => {
                                                        setColorMap(event.target.value);
                                                    }}
                                                    style={{
                                                    width: '100%',
                                                    // height: '30px',
                                                    padding: '2px',
                                                    fontSize: '16px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ccc',
                                                    }}
                                                >
                                                    {/* Dropdown options */}
                                                    <option value="inferno">inferno</option>
                                                    <option value="viridis">viridis</option>
                                                    <option value="magma">magma</option>
                                                    <option value="gray">gray</option>
                                                    <option value="plasma">plasma</option>
                                                    <option value="cividis">cividis</option>
                                                </select>
                                        </div>

                                        {showLocalConfigWindow && !spectrogramIsLoading &&
                                            <Parameters
                                                specCalMethod={specCalMethod}
                                                nfft={nfft}
                                                binsPerOctave={binsPerOctave}
                                                minFreq={minFreq}
                                                maxFreq={maxFreq}
                                                passShowLocalConfigWindowToTrack={passShowLocalConfigWindowToTrack}
                                                passSpecCalMethodToTrack={passSpecCalMethodToTrack}
                                                passNfftToTrack={passNfftToTrack}
                                                passBinsPerOctaveToTrack={passBinsPerOctaveToTrack}
                                                passMinFreqToTrack={passMinFreqToTrack}
                                                passMaxFreqToTrack={passMaxFreqToTrack}
                                                submitLocalParameters={submitLocalParameters}
                                                strictMode={strictMode}
                                                spectrogram={spectrogram}
                                            />
                                        }
                                        
                                    </Box>
                                    <Box display="flex" flexDirection="column">
                                        {/* Area B */}
                                        <Box
                                        width={`${specYAxisWidth}px`}
                                        height={`${WAVEFORM_CVS_HEIGHT}px`}
                                        border={0}
                                        display={ displayWaveform? "flex":"none"} 
                                        >
                                                <div 
                                                    className={audioArray ? 'waveform-buttons' : 'hidden'}
                                                >
                                                    <IconButton style={freqBtn} onClick={waveformZoomIn}>
                                                        <ZoomInIcon style={icon}/>
                                                    </IconButton>
                                                    <IconButton style={freqBtn} onClick={waveformZoomOut}>
                                                        <ZoomOutIcon style={icon}/>
                                                    </IconButton>
                                                </div>
                                        </Box>
                                        {/* Area D */}
                                        <Box
                                        width={`${specYAxisWidth}px`}
                                        height={`${specCanvasHeight}px`}
                                        border={0}
                                        style={{"marginTop":"-20px"}}
                                        >
                                            <canvas
                                                className={showWaveform ? 'frequencies-canvas' : 'frequencies-canvas-small'}
                                                ref={frequenciesCanvasRef}
                                                width={specYAxisWidth}
                                                height={specCanvasHeight+20} //{showWaveform ? FREQ_CVS_HEIGHT : specCanvasHeight }
                                                // style={{"paddingTop":"50px"}}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                                {/* Area F */}
                                <Box
                                    width={`${TRACK_SIDEBAR_WIDTH}px`}
                                    height={showLabelAndIndividualsCanvas?"50px":"0px"}
                                    border={0}
                                >
                                    <canvas
                                        className={showLabelAndIndividualsCanvas ? 'individuals-canvas' : 'hidden'}
                                        ref={individualsCanvasRef}
                                        width={TRACK_SIDEBAR_WIDTH}
                                        height={numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES }
                                    />
                                </Box>
                            </Box>
                            {/* Box_right */}
                            <Box 
                                onMouseLeave={handleMouseLeaveCanvases}
                                display="flex" flexDirection="column" flex="1">
                                {/* Area C*/}
                                <Box height={`${WAVEFORM_CVS_HEIGHT}px`} border={0} >
                                        <div className='waveform-spec-labels-canvases-container' >
                                            <canvas
                                                    className={showWaveform ? 'waveform-canvas' : 'hidden'}
                                                    ref={waveformCanvasRef}
                                                    width={canvasWidth}
                                                    height={WAVEFORM_CVS_HEIGHT}
                                                    onMouseDown={handleLMBDown}
                                                    onMouseUp={handleMouseUp}
                                                    onContextMenu={handleRightClick}
                                                    onMouseMove={handleMouseMove}
                                                />
                                            {/* Overlay canvas for the waveform */}
                                            <canvas
                                                className="waveform-overlay-canvas"
                                                ref={waveformOverlayCanvasRef}
                                                width={canvasWidth}
                                                height={WAVEFORM_CVS_HEIGHT}
                                                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} // Pass-through style
                                            />
                                        </div>
                                </Box>
                                {/* Area E */}
                                <Box
                                        height={`${specCanvasHeight}px`}
                                        border={0}
                                        flex="1"
                                        >
                                            <div  className='waveform-spec-labels-canvases-container'>
                                                <canvas
                                                    className='spec-canvas'
                                                    ref={specCanvasRef}
                                                    width={canvasWidth}
                                                    height={specCanvasHeight}
                                                    onMouseDown={handleLMBDown}
                                                    onMouseUp={handleMouseUp}
                                                    onContextMenu={handleRightClick}
                                                    onMouseMove={handleMouseMove}
                                                />
                                            <canvas
                                                className="spec-overlay-canvas"
                                                ref={specOverlayCanvasRef}
                                                width={canvasWidth}
                                                height={specCanvasHeight}
                                                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} // Pass-through style
                                            />
                                            </div>
                                </Box>
                                {/* Area G */}
                                <Box
                                        flex="1"
                                        height={showLabelAndIndividualsCanvas?`${numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES}px`:"0px"}
                                        border={0}
                                    >
                                        <div className='waveform-spec-labels-canvases-container'>
                                                <canvas
                                                    className={showLabelAndIndividualsCanvas ? 'label-canvas' : 'hidden'}
                                                    ref={labelCanvasRef}
                                                    width={canvasWidth}
                                                    height={numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES}
                                                    onMouseDown={handleLMBDown}
                                                    onMouseUp={handleMouseUp}
                                                    onContextMenu={handleRightClick}
                                                    onMouseMove={handleMouseMove}
                                                />
                                                <canvas
                                                    className="label-overlay-canvas"
                                                    ref={labelOverlayCanvasRef}
                                                    width={canvasWidth}
                                                    height={numberOfIndividuals * HEIGHT_BETWEEN_INDIVIDUAL_LINES}
                                                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} // Pass-through style
                                                />
                                                {
                                                    expandedLabel &&
                                                    createPortal(
                                                        <LabelWindow
                                                            speciesArray={speciesArray}
                                                            labels={labels}
                                                            expandedLabel={expandedLabel}
                                                            passLabelsToTrack={passLabelsToTrack}
                                                            passExpandedLabelToTrack={passExpandedLabelToTrack}
                                                            getAllIndividualIDs={getAllIndividualIDs}
                                                            globalMouseCoordinates={globalMouseCoordinates}
                                                            audioId={audioId}
                                                            getAudio={getAudio}
                                                            handleClickFrequencyLinesBtn={handleClickFrequencyLinesBtn}
                                                            handleClickRemoveAnnotatedFreqBtn={handleClickRemoveAnnotatedFreqBtn}
                                                            numFreqLinesToAnnotate={numFreqLinesToAnnotate}
                                                        />,
                                                        document.body
                                                    )
                                                }
                                                {spectrogramIsLoading || whisperSegIsLoading ?
                                                    <Box sx={{width: '100%'}}><LinearProgress/></Box> : ''}
                                        </div>
                                </Box>
                            </Box>
                        </Box>

                    </Box>

                </div>

            }
        </>
    )
}

export default Track;