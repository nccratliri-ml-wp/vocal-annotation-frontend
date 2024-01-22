import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Export from "./Export.jsx";
import FileUpload from "./FileUpload.jsx";
import Parameters from "./Parameters.jsx"

// Classes
class Label {
    constructor(onset, offset, clustername) {
        this.onset = onset
        this.offset = offset
        this.clustername = clustername
    }
}

class Playhead{
    constructor(timeframe) {
        this.timeframe = timeframe
    }
}

// Global variables
const LABEL_COLOR = "#00FF00"
const LABEL_COLOR_HOVERED = "#f3e655"

function ScalableSpec(
                        {
                            id,
                            activeClustername,
                            showOverviewInitialValue,
                            globalAudioDuration,
                            globalClipDuration,
                            passClipDurationToApp,
                            currentStartTime,
                            currentEndTime,
                            maxScrollTime,
                            scrollStep,
                            SCROLL_STEP_RATIO,
                            newOverviewSpecNeeded,
                            passNewOverviewSpecNeededToApp,
                            passScrollStepToApp,
                            passMaxScrollTimeToApp,
                            passCurrentEndTimeToApp,
                            passCurrentStartTimeToApp,
                            passTrackDurationToApp,
                            deletePreviousTrackDurationInApp,
                            removeTrackInApp
                        }
                    )
                {

    // General
    const [audioId, setAudioId] = useState(null);

    // Spectrogram
    const specCanvasRef = useRef(null);
    const specImgData = useRef(null)
    const [spectrogram, setSpectrogram] = useState(null);

    // Time Axis
    const timeAxisRef = useRef(null);

    // Overview Window
    const overviewRef = useRef(null)
    const overviewImgData = useRef(null)
    let newViewportStartFrame = null
    let newViewportEndFrame = null
    let widthBetween_xStartTime_xClicked = null
    let widthBetween_xEndTime_xClicked = null

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

    // File Upload
    const [response, setResponse] = useState(null)
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    const [showOverview, setShowOverview] = useState(showOverviewInitialValue)
    const [parameters, setParameters] = useState({
        spec_cal_method: 'log-mel'
    })


    /* ++++++++++++++++++++ Pass methods ++++++++++++++++++++ */
    const passResponseToScalableSpec = ( newResponse ) => {
        setResponse( newResponse )
    }

    const passSpectrogramIsLoadingToScalableSpec = ( boolean ) => {
        setSpectrogramIsLoading( boolean )
    }

    const passParametersToScalableSpec = ( newParameters ) => {
        setParameters( newParameters )
    }

    /* ++++++++++++++++++ Spectrogram fetching methods ++++++++++++++++++ */

    const getAudioClipSpec = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-spec'
        const requestParameters = {
            ...parameters,
            audio_id: audioId,
            start_time: currentStartTime,
            clip_duration: globalClipDuration,
            //spec_cal_method: 'constant-q',
            //n_fft: nfft,
            //bins_per_octave: binsPerOctave,
        }

        const response = await axios.post(path, requestParameters)

        return response.data.spec
    }

    const getSpecAndAudioArray = async () => {
        try {
            const [newSpec, newAudioArray] = await Promise.all(
                [
                    getAudioClipSpec(),
                    getAudioArray()
                ]
            )
            drawEditorCanvases(newSpec, newAudioArray)
            setSpectrogramIsLoading(false)
            setSpectrogram(newSpec)
            setAudioArray(newAudioArray)
        } catch (error) {
            console.error('Error fetching data:', error)
            alert(error+' \nPlease try again later.')
        }
    }

    /* ++++++++++++++++++ Mouse Interaction methods ++++++++++++++++++ */

    const handleLMBDown = (event) => {
        // Ignore clicks from other mouse buttons
        if (event.button !== 0) return

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        const xClicked = getXClicked(event)

        // Deal with click on Label
        if ( checkIfPositionIsOccupied(xClicked) ){
            // Deal with click on Onset
            clickedLabel = checkIfClickedOnOnset(xClicked)
            if ( clickedLabel ){
                specCanvasRef.current.addEventListener('mousemove', dragOnset)
                waveformCanvasRef.current.addEventListener('mousemove', dragOnset)
                return
            }

            // Deal with click on Offset
            clickedLabel = checkIfClickedOnOffset(xClicked)
            if (clickedLabel){
                specCanvasRef.current.addEventListener('mousemove', dragOffset)
                waveformCanvasRef.current.addEventListener('mousemove', dragOffset)
                return
            }
        }

        // Add offset to existing label if necessary
        const lastLabel = labels[labels.length-1]
        if (labels.length > 0 && lastLabel.offset === undefined){
            const newOffset = calculateTimestamp(event)
            const labelsCopy = labels
            if (newOffset < lastLabel.onset){
                lastLabel.offset = newOffset
                labelsCopy[labels.length-1] = flipOnsetOffset(lastLabel)
            } else {
                labelsCopy[labels.length-1].offset = newOffset
            }
            setLabels(labelsCopy)
            drawLine(newOffset,LABEL_COLOR)
            drawLineBetween(lastLabel,LABEL_COLOR)
            return
        }

        // Add onset
        const clickedTimestamp = calculateTimestamp(event)
        addNewLabel(clickedTimestamp)
    }

    const handleMouseUp = (event) => {
        if (event.button !== 0) return

        specCanvasRef.current.removeEventListener('mousemove', dragOnset)
        specCanvasRef.current.removeEventListener('mousemove', dragOffset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOnset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOffset)

        //specCanvasRef.current.removeEventListener('mousemove', dragPlayhead)

        // flip onset with offset if necessary
        if (clickedLabel){
            if (clickedLabel.onset > clickedLabel.offset){
                clickedLabel = flipOnsetOffset(clickedLabel)
            }
        }
        clickedLabel = undefined
    }

    const handleRightClick = (event) => {
        event.preventDefault()

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        const xClicked = getXClicked(event)
        if ( !checkIfPositionIsOccupied(xClicked ) ) return
        deleteLabel(xClicked)
    }

    const handleMouseMove = (event) => {
        hoverLine(event)
        hoverLabel(event)
    }

    const hoverLine = (event) => {
        const xHovered = getXClicked(event)
        if ( checkIfPositionIsOccupied(xHovered) /*|| checkIfClickedOnPlayhead(xHovered)*/){
            specCanvasRef.current.style.cursor = 'col-resize'
            waveformCanvasRef.current.style.cursor = 'col-resize'
        } else {
            specCanvasRef.current.style.cursor = 'default'
            waveformCanvasRef.current.style.cursor = 'default'
        }
    }

    // this isn't very neat or resourceful, but it works well enough for now. possible candidate for re-factoring in the future
    const hoverLabel = (event) => {
        if (lastHoveredLabel.labelObject && lastHoveredLabel.isHighlighted){
            const specCVS = specCanvasRef.current;
            const specCTX = specCVS.getContext('2d');
            const waveformCVS = waveformCanvasRef.current
            const waveformCTX = waveformCVS.getContext('2d')
            specCTX.clearRect(0, 0, specCVS.width, specCVS.height);
            specCTX.putImageData(specImgData.current, 0, 0);
            waveformCTX.clearRect(0, 0, waveformCVS.width, waveformCVS.height)
            waveformCTX.putImageData(waveformImgData.current, 0, 0)
            drawAllLabels()
            drawPlayhead(playheadRef.current.timeframe)
            lastHoveredLabel.isHighlighted = false
            //console.log('drawing green')
        }

        const mouseX = getXClicked(event)

        for (let label of labels){
            const onsetX = calculateXPosition(label.onset, specCanvasRef.current)
            const offsetX = calculateXPosition(label.offset, specCanvasRef.current)
            if (mouseX >= onsetX && mouseX <= offsetX && !lastHoveredLabel.isHighlighted){
                drawLine(label.onset, LABEL_COLOR_HOVERED)
                drawLine(label.offset, LABEL_COLOR_HOVERED)
                drawLineBetween(label, LABEL_COLOR_HOVERED)
                drawClustername(label)
                lastHoveredLabel.labelObject = label
                lastHoveredLabel.isHighlighted = true
                //console.log('drawing yellow')
                break;
            }
        }
    }


    /* ++++++++++++++++++ Helper methods ++++++++++++++++++ */

    const getXClicked = (event) => {
        const rect = event.target.getBoundingClientRect()
        return event.clientX - rect.left
    }

    const calculateXPosition = (timestamp, canvas) => {
        return ( timestamp * canvas.width / globalClipDuration ) - ( currentStartTime * canvas.width / globalClipDuration )
    }

    const calculateTimestamp = (event) => {
        const xClicked = getXClicked(event)
        const ratio = (xClicked / specCanvasRef.current.width)
        return globalClipDuration * ratio + currentStartTime
    }

    const checkIfPositionIsOccupied = (xClicked) => {
        return ( checkIfClickedOnOnset(xClicked) || checkIfClickedOnOffset(xClicked) )
    }

    const checkIfClickedOnOnset = (xClicked) => {
        for (let label of labels){
            const xOnset = calculateXPosition(label.onset, specCanvasRef.current)
            if ( ( xOnset >= xClicked - 1 && xOnset <= xClicked + 1 ) ){
                return label
            }
        }
    }

    const checkIfClickedOnOffset = (xClicked) => {
        for (let label of labels){
            const xOffset = calculateXPosition(label.offset, specCanvasRef.current)
            if ( ( xOffset >= xClicked - 1 && xOffset <= xClicked + 1 ) ){
                return label
            }
        }
    }


    /* ++++++++++++++++++ Draw methods ++++++++++++++++++ */

    const drawEditorCanvases = (spectrogram, newAudioArray) => {
        if (!specCanvasRef.current) return

        const canvas = specCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
        const image = new Image();

        // Draw Spectrogram, Waveform and labels
        image.addEventListener('load', () => {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            specImgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            drawWaveform(newAudioArray)
            drawAllLabels()
            //drawPlayhead(playheadRef.current.timeframe)
        })
        image.src = `data:image/png;base64,${spectrogram}`;

        // Draw Time Axis, Viewport
        if (showOverview){
            if (newOverviewSpecNeeded){
                drawOverviewSpectrogram(spectrogram)
                passNewOverviewSpecNeededToApp(false)
            }
            drawTimeAxis()
            drawViewport(currentStartTime, currentEndTime, 'white', 2)
        }
    }

    const drawOverviewSpectrogram = (spectrogram) => {
        return
        const overviewCanvas = overviewRef.current
        const overviewCTX = overviewCanvas.getContext('2d', { willReadFrequently: true, alpha: false });
        const image = new Image();
        image.addEventListener('load',  () => {
            overviewCTX.drawImage(image, 0, 0, overviewCanvas.width, overviewCanvas.height)
            overviewImgData.current = overviewCTX.getImageData(0, 0, overviewCanvas.width, overviewCanvas.height);
            drawViewport(currentStartTime, currentEndTime, 'white', 2)
        });
        image.src = `data:image/png;base64,${spectrogram}`;
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
        const withText = globalClipDuration < globalAudioDuration

        let step = Math.floor(globalAudioDuration / 10 / 10) * 10
        if (step < 1){
            step = 1
        }

        // Draw 1st level
        for (let i=step; i < globalAudioDuration; i+=step){
            drawTimestamp(i, 30, '.00', 14,true, false)
        }

        step = step * 0.1
        // Draw 2nd level
        // TO DO: figure out why this breaks at 4.5
        for (let i=step; i < globalAudioDuration; i+=step){
            drawTimestamp(i, 15, '', 10,withText, true)
        }

        // Draw 3rd level
    }

    const drawTimestamp = (timestamp, lineHeight, ending, fontSize, withText, withFloor) => {
        const canvas = timeAxisRef.current;
        const ctx = timeAxisRef.current.getContext('2d');
        const x = (timestamp * canvas.width / globalClipDuration) - ( currentStartTime * canvas.width / globalClipDuration )

        // Draw line under Timestamp text
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, lineHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'
        ctx.stroke()
        // Draw timestamp text
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#9db4c0'

        if (withFloor){
            timestamp = Math.floor(timestamp * 100) / 100
        }

        const timestampText = timestamp.toString() + ending
        const textWidth = ctx.measureText(timestampText).width;

        if (withText) {
            ctx.fillText(timestamp.toString() + ending, x - textWidth / 2, lineHeight+10);
        }
    }

    const drawLine = (timestamp, hexColorCode) => {
        const x = calculateXPosition(timestamp, specCanvasRef.current)
        const specCTX = specCanvasRef.current.getContext('2d');
        const waveformCTX = waveformCanvasRef.current.getContext('2d')

        specCTX.beginPath()
        specCTX.moveTo(x, 0)
        specCTX.lineTo(x, specCanvasRef.current.height)
        specCTX.lineWidth = 2
        specCTX.strokeStyle = hexColorCode
        specCTX.stroke()

        waveformCTX.beginPath()
        waveformCTX.moveTo(x, 0)
        waveformCTX.lineTo(x, waveformCanvasRef.current.height)
        waveformCTX.lineWidth = 2
        waveformCTX.strokeStyle = hexColorCode
        waveformCTX.stroke()
    }

    const drawLineBetween = (label, colorHex) => {
        const xOnset = calculateXPosition(label.onset, specCanvasRef.current)
        const xOffset = calculateXPosition(label.offset, specCanvasRef.current)
        const cvs = waveformCanvasRef.current
        const ctx = cvs.getContext('2d');

        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(xOnset, cvs.height)
        ctx.lineTo(xOffset, cvs.height)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()
        ctx.setLineDash([])
    }

    const drawClustername = (label) => {
        const cvs = waveformCanvasRef.current;
        const ctx = cvs.getContext('2d');
        const xClustername = ( calculateXPosition(label.onset, cvs) + calculateXPosition(label.offset, cvs) ) / 2

        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = '#f3e655'
        ctx.fillText(label.clustername, xClustername, cvs.height - 6);
    }

    const drawAllLabels = () => {
        for (let label of labels) {
            drawLine(label.onset, LABEL_COLOR)
            drawLine(label.offset, LABEL_COLOR)
            drawLineBetween(label,LABEL_COLOR)
        }
    }


    /* ++++++++++++++++++ Label manipulation methods ++++++++++++++++++ */

    const addNewLabel = (onset) => {
        setLabels(current => [...current, new Label(onset, undefined, activeClustername) ])
    }

    const deleteLabel = (xClicked) => {
        const labelToBeDeleted = labels.find(
            label => (calculateXPosition(label.onset, specCanvasRef.current) >= xClicked - 1  &&  calculateXPosition(label.onset, specCanvasRef.current) <= xClicked + 1 )
                || (calculateXPosition(label.offset, specCanvasRef.current) >= xClicked - 1  &&  calculateXPosition(label.offset, specCanvasRef.current) <= xClicked + 1 )
        )
        const filteredLabels = labels.filter(label => label !== labelToBeDeleted)
        setLabels(filteredLabels)
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
        drawPlayhead(playheadRef.current.timeframe)
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
        drawPlayhead(playheadRef.current.timeframe)
    }


    /* ++++++++++++++++++ Overview Bar Methods ++++++++++++++++++ */

    const handleLMBDownOverview = (event) => {
        const xClicked = getXClicked(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + globalClipDuration)

        // Deal with click on Start Frame
        if (xClicked >= xStartFrame - 2 && xClicked <= xStartFrame + 2){
            overviewRef.current.style.cursor = 'col-resize'
            overviewRef.current.addEventListener('mousemove', dragStartFrame)
            //overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
            return
        }

        // Deal with click on End Frame
        if (xClicked >= xEndFrame - 2 && xClicked <= xEndFrame + 2){
            overviewRef.current.addEventListener('mousemove', dragEndFrame)
            //overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
            return
        }

        // Deal with click inside viewport
        if (xClicked > xStartFrame && xClicked < xEndFrame){
            const xStartTime = calculateViewportFrameX(currentStartTime)
            const xCurrentEndTime = calculateViewportFrameX(currentEndTime)
            widthBetween_xStartTime_xClicked = xClicked - xStartTime
            widthBetween_xEndTime_xClicked = xCurrentEndTime - xClicked
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

        // Set new Viewport (Start & Endframe)
        if (widthBetween_xStartTime_xClicked){
            const newDuration = newViewportEndFrame - newViewportStartFrame
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentStartTimeToApp( newViewportStartFrame )
            passCurrentEndTimeToApp( newViewportEndFrame )
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO)
        // Set new Start Frame
        } else if (newViewportStartFrame){
            const newDuration = currentEndTime - newViewportStartFrame
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentStartTimeToApp(newViewportStartFrame)
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO);
        // Set new End frame
        } else if (newViewportEndFrame){
            const newDuration = newViewportEndFrame - currentStartTime
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentEndTimeToApp( newViewportEndFrame )
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO);
        }

        newViewportStartFrame = null
        newViewportEndFrame = null
        widthBetween_xStartTime_xClicked = null
        widthBetween_xEndTime_xClicked = null
    }

    const dragStartFrame = (event) => {
        const xClicked = getXClicked(event)
        newViewportStartFrame = calculateViewportTimestamp(xClicked)
        drawViewport(newViewportStartFrame, currentEndTime, 'white', 2)
    }

    const dragEndFrame = (event) => {
        const xClicked = getXClicked(event)
        newViewportEndFrame = calculateViewportTimestamp(xClicked)
        drawViewport(currentStartTime, newViewportEndFrame, 'white', 2)
    }

    const dragViewport = (event) => {
        const xClicked = getXClicked(event)
        const viewportWidth = widthBetween_xStartTime_xClicked + widthBetween_xEndTime_xClicked
        newViewportStartFrame = calculateViewportTimestamp(xClicked - widthBetween_xStartTime_xClicked)
        newViewportEndFrame = calculateViewportTimestamp(xClicked + widthBetween_xEndTime_xClicked)
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

    const calculateViewportTimestamp = (xClicked) => {
        return globalAudioDuration * (xClicked / overviewRef.current.width)
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
        /*
        if (overviewImgData.current){
            ctx.putImageData(overviewImgData.current, 0, 0);
        }
         */
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
        ctx.font = `15px Arial`;
        ctx.fillStyle = hexColorCode
        const timestampText = (Math.round(startFrame * 100) / 100).toString()
        ctx.fillText(timestampText, x1 + 5, overviewCanvas.height-5);

        // Update Scroll Button positions
        updateViewportScrollButtons(startFrame, endFrame)
    }

    const handleMouseMoveOverview = (event) => {
        hoverViewportFrame(event)
    }

    const hoverViewportFrame = (event) => {
        const xHovered = getXClicked(event)
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
        const x = calculateXPosition(timeframe, canvas)

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

        const scale = 35
        const centerY = canvas.height / 2
        const ratio = Math.min((response.data.audio_duration - currentStartTime) / globalClipDuration, 1)
        ctx.strokeStyle = '#ddd8ff'

        for (let i=0; i < newAudioArray.length; i++) {
            const datapoint = newAudioArray[i]
            const y = centerY + scale * datapoint

            ctx.beginPath()
            ctx.moveTo(i * canvas.width * ratio / newAudioArray.length, y)
            ctx.lineTo((i + 1) * canvas.width * ratio / newAudioArray.length, centerY + scale * newAudioArray[i + 1])
            ctx.stroke()
        }

        // Draw flat line representing silence
        ctx.beginPath()
        ctx.moveTo(canvas.width * ratio ,centerY)
        ctx.lineTo(canvas.width, centerY)
        ctx.stroke()

        waveformImgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }


    /* ++++++++++++++++++ Tracks ++++++++++++++++++ */

    const handleRemoveTrack = () => {
        if (response){
            deletePreviousTrackDurationInApp( response.data.audio_duration )
        }
        removeTrackInApp(id)
    }


    /* ++++++++++++++++++ UseEffect Hooks ++++++++++++++++++ */

    // When a new spectrogram is returned from the backend
    useEffect(() => {
        if (!spectrogram) return
        drawEditorCanvases(spectrogram, audioArray)
    }, [labels])

    // When user zoomed, scrolled, or changed a parameter
    useEffect( () => {
            if (!globalClipDuration || !response) return

            if (audioSnippet) {
                audioSnippet.pause()
                audioSnippet.currentTime = currentStartTime
            }

            getSpecAndAudioArray()
        }, [currentStartTime, globalClipDuration, audioId, parameters]
    )


    // When a new audio file is uploaded:
    useEffect( () => {
            if (!response) return

            setAudioId(response.data.audio_id)
            setLabels([])
            //playheadRef.current.timeframe = 0

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
    }, [audioSnippet])

    // When globalAudioDuration is updated in the App component
    useEffect( () => {
        if (!globalAudioDuration || !response) return

        passNewOverviewSpecNeededToApp(true)
        passClipDurationToApp(globalAudioDuration)
        passCurrentStartTimeToApp(0)
        passCurrentEndTimeToApp(globalAudioDuration)
        passMaxScrollTimeToApp(0)
        passScrollStepToApp(globalAudioDuration * SCROLL_STEP_RATIO)
        playheadRef.current.timeframe = 0

    }, [response, globalAudioDuration])

    return (
        <div
            className='editor-container'
        >

            {showOverview && response &&
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
                <div className='track-controls' >
                    <FileUpload
                        passResponseToScalableSpec={passResponseToScalableSpec}
                        passSpectrogramIsLoadingToScalableSpec={passSpectrogramIsLoadingToScalableSpec}
                        passTrackDurationToApp={passTrackDurationToApp}
                        deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                        previousAudioDuration={response? response.data.audio_duration : undefined}
                    />
                    <Export
                        audioFileName={'Example Audio File Name'}
                        labels={labels}
                    />
                    {id !== 'track_1' &&
                        <button
                            onClick={handleRemoveTrack}
                        >
                            Remove Track
                        </button>
                    }
                    <button
                        onClick={() => console.log(labels)}
                    >
                        Console log labels
                    </button>
                    <div className='audio-controls'>
                        <button
                            onClick={getAudio}
                        >
                            ▶
                        </button>
                        <button
                            onClick={pauseAudio}
                        >
                            ⏸
                        </button>
                        <button
                            onClick={stopAudio}
                        >
                            ⏹
                        </button>
                    </div>
                    <Parameters
                        passParametersToScalableSpec={passParametersToScalableSpec}
                    />
                </div>

                <div>
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
                    {spectrogramIsLoading ? <Box sx={{ width: '100%' }}><LinearProgress /></Box> : ''}
                </div>

            </div>
        </div>
    );
}

export default ScalableSpec;