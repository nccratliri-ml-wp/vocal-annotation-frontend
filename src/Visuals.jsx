import {useEffect, useRef, useState} from "react";

class Label {
    constructor(onset, offset) {
        this.onset = onset
        this.offset = offset
    }
}

function drawSpectrogram(spectrogramImg, spectrogramCanvas, spectrogramCanvasContext, zoomLevel){
    spectrogramCanvas.width = zoomLevel
    spectrogramCanvas.height = spectrogramImg.naturalHeight * 1.5
    spectrogramCanvasContext.drawImage(spectrogramImg, 0, 0, zoomLevel, spectrogramImg.naturalHeight * 1.5)
}

function drawTimeline(spectrogramCanvas, timelineCanvas, timelineContext, audioLength, extraTimestamps){
    timelineCanvas.height = 40
    timelineCanvas.width = spectrogramCanvas.width

    // Drawing horizontal timeline
    timelineContext.beginPath()
    timelineContext.moveTo(0, timelineCanvas.height - 1)
    timelineContext.lineTo(timelineCanvas.width, timelineCanvas.height - 1)
    timelineContext.lineWidth = 2
    timelineContext.strokeStyle = '#9db4c0'
    timelineContext.stroke()

    // Drawing first timestamp
    timelineContext.beginPath()
    timelineContext.moveTo(1, timelineCanvas.height)
    timelineContext.lineTo(1, 0)
    timelineContext.lineWidth = 2
    timelineContext.strokeStyle = '#9db4c0'
    timelineContext.stroke()

    // Drawing last timestamp
    timelineContext.beginPath()
    timelineContext.moveTo(timelineCanvas.width - 1, timelineCanvas.height)
    timelineContext.lineTo(timelineCanvas.width - 1, 0)
    timelineContext.lineWidth = 2
    timelineContext.strokeStyle = '#9db4c0'
    timelineContext.stroke()

    // Drawing lines in between
    const step = timelineCanvas.width / audioLength
    let timestamp = audioLength * (step / spectrogramCanvas.width)
    for (let i = step; i < timelineCanvas.width; i += step) {
        timelineContext.beginPath()
        timelineContext.moveTo(i, timelineCanvas.height)
        timelineContext.lineTo(i, 15)
        timelineContext.lineWidth = 2
        timelineContext.strokeStyle = '#9db4c0'
        timelineContext.stroke()
        timelineContext.font = "14px Arial";
        timelineContext.fillStyle = '#9db4c0'
        timelineContext.fillText(timestamp.toString() + '.00', i - 14, 12);
        timestamp++
    }

    timestamp = audioLength * (step / spectrogramCanvas.width)
    for (let i = step/4; i < timelineCanvas.width; i += step/4) {
        if (timestamp % 4 === 0){
            timestamp++
            continue;
        }
        timelineContext.beginPath()
        timelineContext.moveTo(i, timelineCanvas.height)
        timelineContext.lineTo(i, 25)
        timelineContext.lineWidth = 1
        timelineContext.strokeStyle = '#9db4c0'
        timelineContext.stroke()
        timelineContext.font = "10px Arial";
        timelineContext.fillStyle = '#9db4c0'
        if (extraTimestamps){
            const timestampText = (timestamp/4).toString()
            timelineContext.fillText(timestampText, i - 10, 20);
        }
        timestamp++
    }
}

function Visuals( {audioFile, audioLength, spectrogramImg} ){

    const canvasContainerRef = useRef(null)

    const spectrogramCanvasRef = useRef(null)
    const spectrogramContextRef = useRef(null)

    const timelineCanvasRef = useRef(null)
    const timelineContextRef = useRef(null)

    const [zoomLevel, setZoomLevel] = useState(null)

    const [labels, setLabels] = useState([])

    function handleLMBDown(event){
        // Ignore other mouse buttons
        if (event.button !== 0){
            return
        }

        const rect = event.target.getBoundingClientRect()
        const xClicked = event.clientX - rect.left

        addNewLabel(event)
        drawLine( calculateTimeframe(event) )
    }

    function addNewLabel(event){
        const onset = calculateTimeframe(event)
        setLabels(current => [...current, new Label (onset)])
    }

    function drawLine(timeframe){
        const x = Math.round(timeframe * spectrogramCanvasRef.current.width / audioLength)
        const ctx = spectrogramContextRef.current

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, spectrogramImg.naturalHeight * 1.5)
        ctx.lineWidth = 3
        ctx.strokeStyle = "#00FF00"
        ctx.stroke()
    }

    function calculateTimeframe(event){
        const rect = event.target.getBoundingClientRect()
        const xClicked = event.clientX - rect.left
        return audioLength * (xClicked / spectrogramCanvasRef.current.width)
    }

    function handleClickZoomIn(){
        setZoomLevel(spectrogramImg.naturalWidth)
    }

    function handleClickZoomOut(){
        setZoomLevel(canvasContainerRef.current.clientWidth)
    }

    function playAudio(){
        audioFile.play()
    }

    function pauseAudio(){
        audioFile.pause()
    }

    function stopAudio(){
        audioFile.pause()
        audioFile.currentTime = 0
    }

    // Initial drawing
    useEffect( () => {
        setZoomLevel(canvasContainerRef.current.clientWidth)

        spectrogramContextRef.current = spectrogramCanvasRef.current.getContext('2d')

        spectrogramImg.addEventListener('load', () => {
            drawSpectrogram(spectrogramImg,
                spectrogramCanvasRef.current,
                spectrogramContextRef.current,
                zoomLevel)

            drawTimeline(spectrogramCanvasRef.current,
                timelineCanvasRef.current,
                timelineContextRef.current,
                audioLength,
                zoomLevel === spectrogramImg.naturalWidth)
        })
    }
    , [spectrogramImg])

    // Redraw every time zoom level is changed
    useEffect( () => {
        spectrogramContextRef.current = spectrogramCanvasRef.current.getContext('2d')
        timelineContextRef.current = timelineCanvasRef.current.getContext('2d')

        drawSpectrogram(spectrogramImg,
            spectrogramCanvasRef.current,
            spectrogramContextRef.current,
            zoomLevel)

        drawTimeline(spectrogramCanvasRef.current,
            timelineCanvasRef.current,
            timelineContextRef.current,
            audioLength,
            zoomLevel === spectrogramImg.naturalWidth)

    }
    , [zoomLevel])

    return (
        <div>
            <button id='zoom-in-btn' onClick={handleClickZoomIn}>
                Zoom in
            </button>
            <button id='zoom-out-btn' onClick={handleClickZoomOut}>
                Zoom out
            </button>
            <button id='play-btn' onClick={playAudio}>
                ▶️
            </button>
            <button id='pause-btn' onClick={pauseAudio}>
                ⏸
            </button>
            <button id='stop-btn' onClick={stopAudio}>
                ⏹
            </button>
            <div id='canvas-container' ref={canvasContainerRef}>
                <canvas id='spectrogram-canvas' ref={spectrogramCanvasRef} onMouseDown={handleLMBDown} />
                <canvas id='timeline-canvas' ref={timelineCanvasRef} />
            </div>
        </div>

    )
}

export default Visuals