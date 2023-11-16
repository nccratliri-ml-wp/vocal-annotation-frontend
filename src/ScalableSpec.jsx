import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Export from "./Export.jsx";

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

// clean up code
// remove onScroll method, add single scroll on single click (at each side of the spec canvas, half transparent)
// add button on each side of the viewport endframe becomes the new viewport startframe
// fix issue: on upload of a new file, right scroll doesn't work when adjusting the viewport manually
// parameters to add: n_fft, bins_per_octave
//log-mel -> n_fft
//constant-q -> bins_per_octave
// labels should display on the waveform too
// add audio play window
// draw label text to top or waveform
// more detailed timeline
// add visual distinguishment between onset and offset
// foldable elements
// show green dot at the bottom of the overview spec for every label


function ScalableSpec( { response, audioFileName, importedLabels, activeClustername, spectrogramIsLoading, passSpectrogramIsLoadingToApp, specType, parameters }) {
    const [spectrogram, setSpectrogram] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioId, setAudioId] = useState(null);
    const [clipDuration, setClipDuration] = useState(null);
    const [currentStartTime, setCurrentStartTime] = useState(0);
    const [currentEndTime, setCurrentEndTime] = useState(0);
    const [maxScrollTime, setMaxScrollTime] = useState(0);
    const [scrollStep, setScrollStep] = useState(0);
    const [scrollInterval, setScrollInterval] = useState(null);
    const canvasRef = useRef(null);
    const timeAxisRef = useRef(null);

    const overviewRef = useRef(null)
    const newFileUploaded = useRef(null)
    const [overviewSpectrogram, setOverviewSpectrogram] = useState(null)
    const overviewImgData = useRef(null)
    let newViewportStartFrame = null
    let newViewportEndFrame = null
    let widthBetween_xStartTime_xClicked = null
    let widthBetween_xEndTime_xClicked = null

    const [labels, setLabels] = useState([])
    const imgData = useRef(null)
    let clickedLabel = undefined
    let lastHoveredLabel = {labelObject: null, isHighlighted: false}

    const playheadRef = useRef(new Playhead(0))
    const [audioSnippet, setAudioSnippet] = useState(null)

    const waveformCanvasRef = useRef(null)
    const [audioArray, setAudioArray] = useState(null)


    const getAudioClipSpec = async (startTime, duration, spectrogramType) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-spec'
        const requestParameters = {
            ...parameters,
            audio_id: audioId,
            start_time: startTime,
            clip_duration: duration,
            spec_cal_method: spectrogramType
        }
        try {
            const response = await axios.post(path, requestParameters);
            drawStuff(response.data.spec)
            setSpectrogram(response.data.spec);
            if (newFileUploaded.current){
                setOverviewSpectrogram(response.data.spec)
                newFileUploaded.current = false
            }
        } catch (error) {
            console.error("Error fetching audio clip spec:", error);
        }
    };

    const renderTimeAxis = () => {
        const canvas = timeAxisRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'

        // Drawing horizontal timeline
        ctx.beginPath()
        ctx.moveTo(0, canvas.height - 1)
        ctx.lineTo(canvas.width, canvas.height - 1)
        ctx.stroke()

        // Drawing first timestamp
        ctx.beginPath()
        ctx.moveTo(1, canvas.height)
        ctx.lineTo(1, 0)
        ctx.stroke()

        // Drawing last timestamp
        ctx.beginPath()
        ctx.moveTo(canvas.width - 1, canvas.height)
        ctx.lineTo(canvas.width - 1, 0)
        ctx.stroke()

        // Drawing timestamps in between
        const withText = clipDuration < audioDuration

        let step = Math.floor(audioDuration / 10 / 10) * 10
        if (step < 1){
            step = 1
        }

        // Draw 1st level
        for (let i=step; i < audioDuration; i+=step){
            drawTimestamp(i, 15, '.00', 14,true, false)
        }

        step = step * 0.1
        // Draw 2nd level
        // TO DO: figure out why this breaks at 4.5
        for (let i=step; i < audioDuration; i+=step){
            drawTimestamp(i, 30, '', 10,withText, true)
        }

        // Draw 3rd level

    }

    const drawTimestamp = (timestamp, lineHeight, ending, fontSize, withText, withFloor) => {
        const canvas = timeAxisRef.current;
        const ctx = timeAxisRef.current.getContext('2d');
        const x = (timestamp * canvas.width / clipDuration) - ( currentStartTime * canvas.width / clipDuration )

        // Draw line under Timestamp text
        ctx.beginPath()
        ctx.moveTo(x, canvas.height)
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
            ctx.fillText(timestamp.toString() + ending, x - textWidth / 2, lineHeight-5);
        }
    }

    const onZoomIn = () => {
        const newDuration = Math.max(clipDuration / 2, 0.1);
        const newMaxScrollTime = Math.max(audioDuration - newDuration, 0);
        setClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration*0.05);
        setCurrentEndTime( currentStartTime + newDuration );
    };

    const onZoomOut = () => {
        const newDuration = Math.min(clipDuration * 2, audioDuration);
        const newMaxScrollTime = Math.max(audioDuration - newDuration, 0);
        const newStartTime = Math.min( Math.max(  audioDuration - newDuration, 0), currentStartTime);
        setClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration*0.05);
        setCurrentStartTime( newStartTime );
        setCurrentEndTime( newStartTime + newDuration );
    };

    const onLeftScroll = () => {
        setCurrentStartTime(
            prevStartTime => Math.max(prevStartTime - scrollStep, 0)
        );
        setCurrentEndTime(
            prevEndTime => Math.max(prevEndTime - scrollStep, clipDuration)
        );
    };

    const onRightScroll = () => {
        setCurrentStartTime(
            prevStartTime => Math.min(prevStartTime + scrollStep, maxScrollTime)
        );
        setCurrentEndTime(
            prevEndTime => Math.min(prevEndTime + scrollStep, audioDuration)
        );
    };

    const startLeftScroll = () => {
        const interval = setInterval(onLeftScroll, 100);
        setScrollInterval(interval);
    };

    const startRightScroll = () => {
        const interval = setInterval(onRightScroll, 100);
        setScrollInterval(interval);
    };

    const stopScroll = () => {
        clearInterval(scrollInterval);
        setScrollInterval(null);
    };


    /* ++++++++++++++++++ Mouse Interaction methods ++++++++++++++++++ */

    const handleLMBDown = (event) => {
        // Ignore clicks from other mouse buttons
        if (event.button !== 0){
            return
        }

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused){
            return
        }

        const xClicked = getXClicked(event)

        // Deal with click on Label
        if ( checkIfPositionIsOccupied(xClicked) ){
            // Deal with click on Onset
            clickedLabel = checkIfClickedOnOnset(xClicked)
            if ( clickedLabel ){
                canvasRef.current.addEventListener('mousemove', dragOnset)
                return
            }

            // Deal with click on Offset
            clickedLabel = checkIfClickedOnOffset(xClicked)
            if (clickedLabel){
                canvasRef.current.addEventListener('mousemove', dragOffset)
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
            } else{
                labelsCopy[labels.length-1].offset = newOffset
            }
            setLabels(labelsCopy)
            drawLine(newOffset,"#00FF00")
            drawLineBetween(lastLabel,"#00FF00")
            return
        }

        // Add onset
        const clickedTimestamp = calculateTimestamp(event)
        addNewLabel(clickedTimestamp)
    }

    const handleMouseUp = (event) => {
        if (event.button !== 0) {
            return
        }
        canvasRef.current.removeEventListener('mousemove', dragOnset)
        canvasRef.current.removeEventListener('mousemove', dragOffset)
        //canvasRef.current.removeEventListener('mousemove', dragPlayhead)

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
        if (audioSnippet && !audioSnippet.paused){
            return
        }

        const xClicked = getXClicked(event)

        if ( !checkIfPositionIsOccupied(xClicked ) ){
            return
        }

        deleteLabel(xClicked)
    }

    const handleMouseMove = (event) => {
        hoverLine(event)
        hoverLabel(event)
    }

    const hoverLine = (event) => {
        const xHovered = getXClicked(event)
        if ( checkIfPositionIsOccupied(xHovered) /*|| checkIfClickedOnPlayhead(xHovered)*/){
            canvasRef.current.style.cursor = 'col-resize'
        } else {
            canvasRef.current.style.cursor = 'default'
        }
    }

    // this isn't very neat or ressourceful, but it works well enough for now. possible candidate for re-factoring in the future
    const hoverLabel = (event) => {
        if (lastHoveredLabel.labelObject && lastHoveredLabel.isHighlighted){
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imgData.current, 0, 0);
            drawAllLabels()
            drawPlayhead(playheadRef.current.timeframe)
            lastHoveredLabel.isHighlighted = false
            //console.log('drawing green')
        }

        const mouseX = getXClicked(event)

        for (let label of labels){
            const onsetX = calculateXPosition(label.onset, canvasRef.current)
            const offsetX = calculateXPosition(label.offset, canvasRef.current)
            if (mouseX >= onsetX && mouseX <= offsetX && !lastHoveredLabel.isHighlighted){
                drawLine(label.onset, "#f3e655") //"#f3e655"
                drawLine(label.offset, "#f3e655")
                drawLineBetween(label, "#f3e655")
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
        return ( timestamp * canvas.width / clipDuration ) - ( currentStartTime * canvas.width / clipDuration )
    }

    const calculateTimestamp = (event) => {
        const xClicked = getXClicked(event)
        const ratio = (xClicked / canvasRef.current.width)
        return clipDuration * ratio + currentStartTime
    }

    const checkIfPositionIsOccupied = (xClicked) => {
        return ( checkIfClickedOnOnset(xClicked) || checkIfClickedOnOffset(xClicked) )
    }

    const checkIfClickedOnOnset = (xClicked) => {
        for (let label of labels){
            const xOnset = calculateXPosition(label.onset, canvasRef.current)
            if ( ( xOnset >= xClicked - 1 && xOnset <= xClicked + 1 ) ){
                return label
            }
        }
    }

    const checkIfClickedOnOffset = (xClicked) => {
        for (let label of labels){
            const xOffset = calculateXPosition(label.offset, canvasRef.current)
            if ( ( xOffset >= xClicked - 1 && xOffset <= xClicked + 1 ) ){
                return label
            }
        }
    }


    /* ++++++++++++++++++ Draw methods ++++++++++++++++++ */

    const drawLine = (timestamp, hexColorCode) => {
        const x = calculateXPosition(timestamp, canvasRef.current)
        const ctx = canvasRef.current.getContext('2d');

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvasRef.current.height)
        ctx.lineWidth = 2
        ctx.strokeStyle = hexColorCode
        ctx.stroke()
    }

    const drawLineBetween = (label, colorHex) => {
        const xOnset = calculateXPosition(label.onset, canvasRef.current)
        const xOffset = calculateXPosition(label.offset, canvasRef.current)
        const ctx = canvasRef.current.getContext('2d');

        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(xOnset, 300 / 2 )
        ctx.lineTo(xOffset, 300 / 2)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()
        ctx.setLineDash([])
    }

    const drawClustername = (label) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const xClustername = ( calculateXPosition(label.onset, canvasRef.current) + calculateXPosition(label.offset, canvasRef.current) ) / 2

        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = '#f3e655'
        ctx.fillText(label.clustername, xClustername, canvas.height / 2 - 5);
    }

    const drawAllLabels = () => {
        for (let label of labels) {
            drawLine(label.onset, "#00FF00")
            drawLine(label.offset, "#00FF00")
            drawLineBetween(label,"#00FF00")
        }
    }


    /* ++++++++++++++++++ Label manipulation methods ++++++++++++++++++ */

    const addNewLabel = (onset) => {
        setLabels(current => [...current, new Label(onset, undefined, activeClustername) ])
    }

    const deleteLabel = (xClicked) => {
        const labelToBeDeleted = labels.find(
            label => (calculateXPosition(label.onset, canvasRef.current) >= xClicked - 1  &&  calculateXPosition(label.onset, canvasRef.current) <= xClicked + 1 )
                || (calculateXPosition(label.offset, canvasRef.current) >= xClicked - 1  &&  calculateXPosition(label.offset, canvasRef.current) <= xClicked + 1 )
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
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d');
        updateOnset(event)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imgData.current, 0, 0);
        drawAllLabels()
        drawPlayhead(playheadRef.current.timeframe)
    }

    const dragOffset = (event) => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d');
        updateOffset(event)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imgData.current, 0, 0);
        drawAllLabels()
        drawPlayhead(playheadRef.current.timeframe)
    }


    /* ++++++++++++++++++ Overview Bar Methods ++++++++++++++++++ */

    const handleLMBDownOverview = (event) => {
        const xClicked = getXClicked(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + clipDuration)

        // Deal with click on Start Frame
        if (xClicked >= xStartFrame - 2 && xClicked <= xStartFrame + 2){
            overviewRef.current.style.cursor = 'col-resize'
            overviewRef.current.addEventListener('mousemove', dragStartFrame)
            overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
            return
        }

        // Deal with click on End Frame
        if (xClicked >= xEndFrame - 2 && xClicked <= xEndFrame + 2){
            overviewRef.current.addEventListener('mousemove', dragEndFrame)
            overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
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
            setCurrentStartTime(newViewportStartFrame)
            setCurrentEndTime( newViewportEndFrame )
            setClipDuration( newViewportEndFrame - newViewportStartFrame )
        // Set new Start Frame
        } else if (newViewportStartFrame){
            setCurrentStartTime(newViewportStartFrame)
            setClipDuration( currentEndTime - newViewportStartFrame )
        // Set new End frame
        } else if (newViewportEndFrame){
            setCurrentEndTime( newViewportEndFrame )
            setClipDuration( newViewportEndFrame - currentStartTime )
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
        if (newViewportEndFrame > audioDuration){
            newViewportStartFrame = calculateViewportTimestamp(overviewRef.current.width - viewportWidth )
            newViewportEndFrame = audioDuration
            return
        }
        drawViewport(newViewportStartFrame, newViewportEndFrame, 'white', 4)
    }

    const calculateViewportTimestamp = (xClicked) => {
        return audioDuration * (xClicked / overviewRef.current.width)
    }

    const calculateViewportFrameX = (timestamp) => {
        return timestamp * overviewRef.current.width / audioDuration
    }

    const drawViewport = (startFrame, endFrame, hexColorCode, lineWidth) => {
        const overviewCanvas = overviewRef.current
        const ctx = overviewCanvas.getContext('2d');
        ctx.clearRect(0, 0, overviewCanvas.width, overviewCanvas.height);
        if (overviewImgData.current){
            ctx.putImageData(overviewImgData.current, 0, 0);
        }
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
    }

    const handleMouseMoveOverview = (event) => {
        hoverViewportFrame(event)
    }

    const hoverViewportFrame = (event) => {
        const xHovered = getXClicked(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + clipDuration)

        // Deal with click on Start Frame
        if ( (xHovered >= xStartFrame - 2 && xHovered <= xStartFrame + 2) || (xHovered >= xEndFrame - 2 && xHovered <= xEndFrame + 2) ){
            overviewRef.current.style.cursor = 'col-resize'
        } else {
            overviewRef.current.style.cursor = 'default'
        }
    }

    /* ++++++++++++++++++ Audio ++++++++++++++++++ */
    const getAudio = async () => {
        setAudioSnippet(null)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-wav'
        try {
            const response = await axios.post(path, {
                audio_id: audioId,
                start_time: currentStartTime,
                clip_duration: clipDuration
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

    }

    function loop(){
        if (audioSnippet.paused){
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imgData.current, 0, 0);
        drawAllLabels()
        drawPlayhead(currentStartTime + audioSnippet.currentTime)

        window.requestAnimationFrame(() => loop() )
    }

    const pauseAudio = () => {
        if (!audioSnippet){
            return
        }
        audioSnippet.pause()
        updatePlayhead(currentStartTime + audioSnippet.currentTime)
    }

    const stopAudio = () => {
        if (!audioSnippet){
            return
        }

        audioSnippet.pause()
        audioSnippet.currentTime = currentStartTime
        updatePlayhead(currentStartTime)

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imgData.current, 0, 0);
        drawAllLabels()
    }

    const drawPlayhead = (timeframe) => {
        const canvas = canvasRef.current
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
        try {
            const response = await axios.post(path, {
                audio_id: audioId,
                start_time: currentStartTime,
                clip_duration: clipDuration,
                target_length: 100000
            });
            setAudioArray(response.data.wav_array)
        } catch (error) {
            console.error("Error fetching audio clip:", error);
        }
    };

    const drawWaveform = () => {
        const canvas = waveformCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
        canvas.width = window.innerWidth -30;

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const scale = 50;
        const centerY = canvas.height / 2
        ctx.strokeStyle = '#ddd8ff'

        for (let i = 0; i < audioArray.length; i++) {
            const datapoint = audioArray[i]
            const y = centerY + scale * Math.sin(datapoint)

            ctx.beginPath()
            ctx.moveTo(i * (canvas.width / audioArray.length), y)
            ctx.lineTo((i + 1) * (canvas.width / audioArray.length), centerY + scale * audioArray[i + 1])
            ctx.stroke()
        }
    }


    const drawStuff = (spectrogram) => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
        const image = new Image();

        image.addEventListener('load', () => {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            imgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            drawAllLabels()
            //drawPlayhead(playheadRef.current.timeframe)
            renderTimeAxis();
            drawViewport(currentStartTime, currentEndTime, 'white', 2)
            passSpectrogramIsLoadingToApp(false)
        })

        image.src = `data:image/png;base64,${spectrogram}`;
    }



    /* ++++++++++++++++++ UseEffect Hooks ++++++++++++++++++ */

    // When a new spectrogram is returned from the backend
    useEffect(() => {
        if (!spectrogram) return
        drawStuff(spectrogram)
    }, [labels]);

    // When the first spec is returned from the backend (equals to Overview Spec)
    useEffect( () => {
        if (!overviewSpectrogram) return
            getAudioClipSpec(currentStartTime, currentEndTime, specType)
            //getAudio()
            getAudioArray()
            const overviewCanvas = overviewRef.current
            const overviewCTX = overviewCanvas.getContext('2d', { willReadFrequently: true, alpha: false });
            const image = new Image();
            image.addEventListener('load',  () => {
                overviewCTX.drawImage(image, 0, 0, overviewCanvas.width, overviewCanvas.height)
                overviewImgData.current = overviewCTX.getImageData(0, 0, overviewCanvas.width, overviewCanvas.height);
                //drawViewport(currentStartTime, currentEndTime, 'white', 2)
            });
            image.src = `data:image/png;base64,${overviewSpectrogram}`;

    }, [overviewSpectrogram])

    // When user zoomed in/out, scrolled
    useEffect( () => {
            if (!clipDuration) return

            if (audioSnippet) {
                audioSnippet.pause()
                audioSnippet.currentTime = currentStartTime
            }

            getAudioClipSpec(currentStartTime, clipDuration, specType);
            getAudioArray()
        }, [currentStartTime, clipDuration]
    );

    // When user changed spectrogram type
    useEffect( () => {
            if (!clipDuration) return

            if (audioSnippet) {
                audioSnippet.pause()
                audioSnippet.currentTime = currentStartTime
            }

            getAudioClipSpec(currentStartTime, clipDuration, specType);
        }, [specType, parameters]
    );

    // When a new file is uploaded:
    useEffect( () => {
            if (!response) return

            newFileUploaded.current = true
            setAudioDuration(response.data.audio_duration);
            setAudioId(response.data.audio_id);
            setClipDuration(response.data.audio_duration);
            setCurrentStartTime(0);
            setCurrentEndTime(response.data.audio_duration)
            setMaxScrollTime(0);
            setScrollStep(response.data.audio_duration*0.05);
            setLabels([])
            playheadRef.current.timeframe = 0

        }, [response])

    // When a new CSV File was uploaded:
    useEffect( () => {
        if (!importedLabels) return
        setLabels(importedLabels)
    }, [importedLabels])


    // When a new audio array is returned from the backend
    useEffect( () => {
        if (!waveformCanvasRef.current) return
        drawWaveform()
    }, [audioArray])

    // When a new audio snippet is returned from the backend
    useEffect( () => {
        if (!audioSnippet) return

        audioSnippet.play()
        loop()
    }, [audioSnippet])

    return (
        <div>
            {spectrogram && (
                <div>
                    <canvas
                        id='overview-canvas'
                        ref={overviewRef}
                        width={parent.innerWidth -30}
                        height={100}
                        onMouseDown={handleLMBDownOverview}
                        onMouseUp={handleMouseUpOverview}
                        onContextMenu={(event) => event.preventDefault()}
                        onMouseMove={handleMouseMoveOverview}
                    />
                    {/*<div
                        id='waveform-container'
                        ref={waveformContainerRef}>
                    </div>*/}
                    <canvas
                        id='waveform-canvas'
                        ref={waveformCanvasRef}>
                        width={parent.innerWidth -30}
                        height={100}
                    </canvas>
                    <canvas
                        ref={canvasRef}
                        width={parent.innerWidth -30}
                        height={300}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    <canvas
                        ref={timeAxisRef}
                        width={parent.innerWidth -30}
                        height={40}
                    />
                    <div id='controls-container'>
                        <button
                            //onClick={onLeftScroll}
                            onMouseDown={startLeftScroll}
                            onMouseUp={stopScroll}
                            onMouseLeave={stopScroll}

                        >&larr; Left Scroll</button>
                        <button
                            // onClick={onRightScroll}
                            onMouseDown={startRightScroll}
                            onMouseUp={stopScroll}
                            onMouseLeave={stopScroll}
                        >
                            Right Scroll &rarr;
                        </button>
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
                            onClick={() => console.log(labels)}
                        >
                            Console log labels
                        </button>
                        <button
                            onClick={getAudio}
                        >
                            Play Audio
                        </button>
                        <button
                            onClick={pauseAudio}
                        >
                            Pause Audio
                        </button>
                        <button
                            onClick={stopAudio}
                        >
                            Stop Audio
                        </button>
                        <Export
                            audioFileName={audioFileName}
                            labels={labels}
                        />
                    </div>
                </div>
            )}
            {spectrogramIsLoading ? <Box sx={{ width: '100%' }}><LinearProgress /></Box> : ''}
        </div>
    );
}

export default ScalableSpec;