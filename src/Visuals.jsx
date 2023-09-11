import {useEffect, useRef, useState} from "react";
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress'

import Export from "./Export.jsx";

// TO DO
// Interpolation up to 200ms
// fix image crash
// sort new labels by onset

// generate several spectrograms for each zoomlevel
// set defined zoom levels from max zoom out (canvas width = screen width) to max zoom in (max canvas width) at ~32k pixels
// for each zoom level, pass necessary hop length as parameter to the backend. generate the specs for each zoom level
// load as many spec images as fit into the max canvas width, combine them to one image, send as base64 string into the background image css property
// on scroll event, load the next combined image
// on zoom out/in load the corresponding spec images

const spectrogramCanvasHeight = 256 //hardcoded, but actually depends on the height of the spectrogram generated in the backend
const overviewCanvasHeight = 50
const maxZoomLevel = 1

class Label {
    constructor(onset, offset, clustername) {
        this.onset = onset
        this.offset = offset
        this.clustername = clustername
    }
}

class PlayHead {
    constructor(timeframe) {
        this.timeframe = timeframe
    }
}

class CurrentSpecIndex{
    constructor(zoomLevel, index) {
        this.zoomLevel = zoomLevel
        this.index = index
    }
}
function adjustSpectrogramCanvasDimensions(spectrogramCanvas, zoomLevel){
    spectrogramCanvas.width = zoomLevel
    spectrogramCanvas.height = spectrogramCanvasHeight
}

function drawTimeline(spectrogramCanvas, timelineCanvas, timelineContext, firstTimeFrame, lastTimeFrame, extraTimestamps){
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
    const step = timelineCanvas.width / lastTimeFrame
    let timestamp = lastTimeFrame * (step / spectrogramCanvas.width)
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

    timestamp = lastTimeFrame * (step / spectrogramCanvas.width)
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

function Visuals( {audioFile, audioFileName, specImages, spectrogramIsLoading, importedLabels, activeClustername} ){

    const [audioLength, setAudioLength] = useState(null)

    const canvasContainerRef = useRef(null)

    const spectrogramCanvasRef = useRef(null)
    const spectrogramContextRef = useRef(null)

    const overviewCanvasRef = useRef(null)
    const overviewContextRef = useRef(null)

    const timelineCanvasRef = useRef(null)
    const timelineContextRef = useRef(null)

    const backgroundImageRef = useRef(null)

    const [zoomLevel, setZoomLevel] = useState(null)
    const zoomLevelRef = useRef(null)

    const [specImagesCurrentIndex, setSpecImagesCurrentIndex] = useState( new CurrentSpecIndex(0, 0) )

    const [currentViewportTimeframes, setCurrentViewportTimeframes] = useState([0, 0])

    const [labels, setLabels] = useState([])

    const playHeadRef = useRef(new PlayHead(0))

    let clickedLabel = undefined

    let lastHoveredLabel = {labelObject: null, isHighlighted: false}

    function handleLMBDown(event){
        pauseAudio()

        // Ignore other mouse buttons
        if (event.button !== 0){
            return
        }

        const xClicked = getXClicked(event)

        // Deal with click on PlayHead
        if ( checkIfClickedOnPlayhead(xClicked) ){
            spectrogramCanvasRef.current.addEventListener('mousemove', dragPlayhead)
            return
        }

        // Deal with click on Label
        if ( checkIfPositionIsOccupied(xClicked) ){
            // Deal with click on Onset
            clickedLabel = checkIfClickedOnOnset(xClicked)
            if ( clickedLabel ){
                spectrogramCanvasRef.current.addEventListener('mousemove', dragOnset)
                return
            }

            // Deal with click on Offset
            clickedLabel = checkIfClickedOnOffset(xClicked)
            if (clickedLabel){
                spectrogramCanvasRef.current.addEventListener('mousemove', dragOffset)
                return
            }
        }

        // Add offset to existing label if necessary
        const lastLabel = labels[labels.length-1]
        if (labels.length > 0 && lastLabel.offset === undefined){
            const newOffset = calculateTimeframe(event)
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

        // Add new Label
        addNewLabel(event)
    }

    function flipOnsetOffset(label){
        const newOnset = label.offset
        const newOffset = label.onset

        label.onset = newOnset
        label.offset = newOffset

        return label
    }

    function updateOnset(event){
        clickedLabel.onset = calculateTimeframe(event)
    }

    function updateOffset(event){
        clickedLabel.offset = calculateTimeframe(event)
    }

    function dragOnset(event){
        updateOnset(event)
        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevel)
        drawAllLabels()
        drawPlayhead(playHeadRef.current.timeframe)
    }

    function dragOffset(event){
        updateOffset(event)
        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevel)
        drawAllLabels()
        drawPlayhead(playHeadRef.current.timeframe)
    }

    function dragPlayhead(event){
        updatePlayHead( calculateTimeframe(event) )
        audioFile.currentTime = playHeadRef.current.timeframe
        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevel)
        drawAllLabels()
        drawPlayhead(playHeadRef.current.timeframe)
    }

    function handleMouseUp(event) {
        if (event.button !== 0) {
            return
        }
        spectrogramCanvasRef.current.removeEventListener('mousemove', dragOnset)
        spectrogramCanvasRef.current.removeEventListener('mousemove', dragOffset)
        spectrogramCanvasRef.current.removeEventListener('mousemove', dragPlayhead)

        // flip onset with offset if necessary
        if (clickedLabel){
            if (clickedLabel.onset > clickedLabel.offset){
                clickedLabel = flipOnsetOffset(clickedLabel)
            }
        }
        clickedLabel = undefined

        console.log(labels)
    }

    function hoverLine(event){
        const xHovered = getXClicked(event)
        if ( checkIfPositionIsOccupied(xHovered) || checkIfClickedOnPlayhead(xHovered)){
            spectrogramCanvasRef.current.style.cursor = 'col-resize'
        } else {
            spectrogramCanvasRef.current.style.cursor = 'default'
        }
    }

    function handleRightClick(event){
        event.preventDefault()
        const xClicked = getXClicked(event)

        if ( !checkIfPositionIsOccupied(xClicked ) ){
            return
        }

        deleteLabel(xClicked)
    }

    function deleteLabel(xClicked){
        const labelToBeDeleted = labels.find(
            label => (calculateXPosition(label.onset) >= xClicked - 1  &&  calculateXPosition(label.onset) <= xClicked + 1 )
                    || (calculateXPosition(label.offset) >= xClicked - 1  &&  calculateXPosition(label.offset) <= xClicked + 1 )
        )
        const filteredLabels = labels.filter(label => label !== labelToBeDeleted)
        setLabels(filteredLabels)
    }

    function checkIfPositionIsOccupied(xClicked){
        return ( checkIfClickedOnOnset(xClicked) || checkIfClickedOnOffset(xClicked) )
    }

    function checkIfClickedOnOnset(xClicked){
        for (let label of labels){
            const xOnset = calculateXPosition(label.onset)
            if ( ( xOnset >= xClicked - 1 && xOnset <= xClicked + 1 ) ){
                return label
            }
        }
    }

    function checkIfClickedOnOffset(xClicked){
        for (let label of labels){
            const xOffset = calculateXPosition(label.offset)
            if ( ( xOffset >= xClicked - 1 && xOffset <= xClicked + 1 ) ){
                return label
            }
        }
    }

    function checkIfClickedOnPlayhead(xClicked){
        const xPlayhead = calculateXPosition(playHeadRef.current.timeframe)
        if (xPlayhead >= xClicked - 1 && xPlayhead <= xClicked + 1){
            return true
        }
    }

    function addNewLabel(event){
        const onset = calculateTimeframe(event)
        setLabels(current => [...current, new Label (onset, undefined, activeClustername)])
    }

    function drawLine(timeframe, colorHex){
        const x = Math.round(calculateXPosition(timeframe))
        const ctx = spectrogramContextRef.current

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, spectrogramCanvasHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()
    }

    function drawAllLabels(){
        for (let label of labels) {
            drawLine(label.onset, "#00FF00")
            drawLine(label.offset,"#00FF00")
            drawLineBetween(label,"#00FF00")
        }
    }

    function drawLineBetween(label, colorHex){
        const xOnset = calculateXPosition(label.onset)
        const xOffset = calculateXPosition(label.offset)
        const ctx = spectrogramContextRef.current

        ctx.beginPath()
        ctx.setLineDash([1, 1])
        ctx.moveTo(xOnset, spectrogramCanvasHeight / 2 )
        ctx.lineTo(xOffset, spectrogramCanvasHeight / 2)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()
        ctx.setLineDash([])
    }

    function drawPlayhead(timeframe){
        const x = calculateXPosition(timeframe)
        const ctx = spectrogramContextRef.current

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, spectrogramCanvasHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = "#ff0000"
        ctx.stroke()
    }

    function calculateTimeframe(event){
        const xClicked = getXClicked(event)
        return audioLength * (xClicked / spectrogramCanvasRef.current.width)
    }

    function calculateXPosition(timeframe){
        return timeframe * spectrogramCanvasRef.current.width / audioLength
    }

    function getXClicked(event){
        const rect = event.target.getBoundingClientRect()
        return event.clientX - rect.left
    }

    function handleClickZoomIn(){
        setZoomLevel(65535) // max width in pixels supported by Canvas API
        zoomLevelRef.current = 65535

        if (specImagesCurrentIndex.zoomLevel >= maxZoomLevel){
            return
        }

        setSpecImagesCurrentIndex(prevState => ({
                ...prevState,
                zoomLevel: prevState.zoomLevel + 1
            })
        )

        // Only on the first time zooming in, set the viewport time frames, to avoid overwriting viewport updates in checkIfScrolledToEdge()
        if (currentViewportTimeframes[1] === audioLength){
            setCurrentViewportTimeframes([0, 5])
        }
    }

    function handleClickZoomOut(){
        setZoomLevel(canvasContainerRef.current.clientWidth)
        zoomLevelRef.current = canvasContainerRef.current.clientWidth

        if (specImagesCurrentIndex.zoomLevel <= 0){
            return
        }

        setSpecImagesCurrentIndex(prevState => ({
                ...prevState,
                zoomLevel: prevState.zoomLevel - 1
            })
        )
    }

    function playAudio(){
        audioFile.play()

        const scrollSteps = Math.floor( spectrogramCanvasRef.current.width / canvasContainerRef.current.clientWidth )
        const scrollStepsXValues = []
        for (let i = 1; i <= scrollSteps; i++){
            scrollStepsXValues.push(canvasContainerRef.current.clientWidth * i)
        }

        loop(scrollStepsXValues)
    }

    function pauseAudio(){
        audioFile.pause()
        updatePlayHead(audioFile.currentTime)
    }

    function stopAudio(){
        audioFile.pause()
        audioFile.currentTime = 0

        updatePlayHead(0)
        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevel)
        drawAllLabels()
        drawPlayhead(0)
    }

    function updatePlayHead(newTimeframe){
        playHeadRef.current.timeframe = newTimeframe
    }

    function loop(scrollStepsXValues){
        if (audioFile.paused){
            return
        }
        window.requestAnimationFrame(() => loop(scrollStepsXValues) )

        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevelRef.current)
        drawAllLabels()
        drawPlayhead(audioFile.currentTime)

        scroll(scrollStepsXValues)
    }

    function scroll(scrollStepsXValues){
        const x = calculateXPosition(audioFile.currentTime)

        if (x > scrollStepsXValues[0]){
            canvasContainerRef.current.scrollTo({
                top: 0,
                left: x,
                behavior: "instant",
            })
            scrollStepsXValues.shift()
        }
    }

    // this isn't very neat or ressourceful, but it works well enough for now. possible candidate for re-factoring in the future
    function hoverLabel(event){
        if (lastHoveredLabel.labelObject && lastHoveredLabel.isHighlighted){
            adjustSpectrogramCanvasDimensions(
                spectrogramCanvasRef.current,
                zoomLevelRef.current)
            drawAllLabels()
            drawPlayhead(audioFile.currentTime)
            lastHoveredLabel.isHighlighted = false
            console.log('drawing green')
        }


        const mouseX = getXClicked(event)

        for (let label of labels){
            const onsetX = calculateXPosition(label.onset)
            const offsetX = calculateXPosition(label.offset)
            if (mouseX >= onsetX && mouseX <= offsetX && !lastHoveredLabel.isHighlighted){
                drawLine(label.onset, "#f3e655") //"#f3e655"
                drawLine(label.offset, "#f3e655")
                drawLineBetween(label, "#f3e655")
                drawClustername(label)
                lastHoveredLabel.labelObject = label
                lastHoveredLabel.isHighlighted = true
                console.log('drawing yellow')
                break;
            }
        }
    }


    function handleMouseMove(event){
        hoverLine(event)
        hoverLabel(event)
    }

    function drawClustername(label){
        const xClustername = ( calculateXPosition(label.onset) + calculateXPosition(label.offset) ) / 2
        const ctx = spectrogramContextRef.current
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = '#f3e655'
        ctx.fillText(label.clustername, xClustername, spectrogramCanvasHeight / 2 - 5);
    }

    function populateSpectrogramCanvas(base64string){
        backgroundImageRef.current.style.backgroundImage = `url(data:image/png;base64,${base64string})`
    }

    function populateOverviewCanvas(){
        if (!overviewCanvasRef.current.style.backgroundImage){
            overviewCanvasRef.current.style.backgroundImage = `url(data:image/png;base64,${specImages[0][0]})`
        }
    }

    function checkIfScrolledToEdge(event){
        if (event.target.scrollWidth - event.target.scrollLeft - event.target.clientWidth < 10) {
            if (specImagesCurrentIndex.index >= specImages[specImagesCurrentIndex.zoomLevel].length - 1){
                // reached right edge
                return
            }
            setSpecImagesCurrentIndex(prevState => ({
                    ...prevState,
                    index: prevState.index + 1
                })
            )
            setCurrentViewportTimeframes(currentState => currentState.map(timeframe => timeframe + 5))
            return
        }
        if (event.target.scrollLeft === 0){
            if (specImagesCurrentIndex.index <= 0){
                // reached left edge
                return
            }
            setSpecImagesCurrentIndex(prevState => ({
                    ...prevState,
                    index: prevState.index - 1
                })
            )
            setCurrentViewportTimeframes(currentState => currentState.map(timeframe => timeframe - 5))
        }
    }

    function calculateViewportX(timeframe){
        return timeframe * overviewCanvasRef.current.width / audioLength
    }

    function drawViewport(colorHex){
        const ctx = overviewContextRef.current

        // if max zoomed out, draw viewport over the entire overview canvas
        if (zoomLevelRef.current === canvasContainerRef.current.clientWidth){
            // Draw Top Line
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(canvasContainerRef.current.clientWidth, 0)
            ctx.lineWidth = 2
            ctx.strokeStyle = colorHex
            ctx.stroke()

            // Draw Bottom Line
            ctx.beginPath()
            ctx.moveTo(0, overviewCanvasHeight)
            ctx.lineTo(canvasContainerRef.current.clientWidth, overviewCanvasHeight)
            ctx.lineWidth = 2
            ctx.strokeStyle = colorHex
            ctx.stroke()

            // Draw left line
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(0, overviewCanvasHeight)
            ctx.lineWidth = 2
            ctx.strokeStyle = colorHex
            ctx.stroke()

            // Draw right line
            ctx.beginPath()
            ctx.moveTo(canvasContainerRef.current.clientWidth, 0)
            ctx.lineTo(canvasContainerRef.current.clientWidth, overviewCanvasHeight)
            ctx.lineWidth = 2
            ctx.strokeStyle = colorHex
            ctx.stroke()

            return
        }

        const viewportStart = Math.round( calculateViewportX(currentViewportTimeframes[0] ) )
        const viewportEnd = Math.round( calculateViewportX(currentViewportTimeframes[1] ) )

        // Draw Top Line
        ctx.beginPath()
        ctx.moveTo(viewportStart, 0)
        ctx.lineTo(viewportEnd, 0)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()

        // Draw Bottom Line
        ctx.beginPath()
        ctx.moveTo(viewportStart, overviewCanvasHeight)
        ctx.lineTo(viewportEnd, overviewCanvasHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()

        // Draw Left Line
        ctx.beginPath()
        ctx.moveTo(viewportStart, 0)
        ctx.lineTo(viewportStart, overviewCanvasHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()

        // Draw Right Line
        ctx.beginPath()
        ctx.moveTo(viewportEnd, 0)
        ctx.lineTo(viewportEnd, overviewCanvasHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = colorHex
        ctx.stroke()
    }

    function adjustOverviewCanvasDimensions(){
        overviewCanvasRef.current.height = overviewCanvasHeight
        overviewCanvasRef.current.style.width ='100%'
        overviewCanvasRef.current.width  = overviewCanvasRef.current.offsetWidth
        overviewContextRef.current = overviewCanvasRef.current.getContext('2d')
    }

    // When a new audio File was uploaded, do this:
    useEffect( () => {
        if (!specImages){
            return
        }

        setAudioLength(audioFile.duration)
        setCurrentViewportTimeframes([0, audioFile.duration])

        setZoomLevel(canvasContainerRef.current.clientWidth)
        zoomLevelRef.current = canvasContainerRef.current.clientWidth

        spectrogramContextRef.current = spectrogramCanvasRef.current.getContext('2d')

        populateSpectrogramCanvas(specImages[0][0])

        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevel)

        drawTimeline(spectrogramCanvasRef.current,
            timelineCanvasRef.current,
            timelineContextRef.current,
            0,
            audioLength,
            false)

        setLabels([])
        drawAllLabels()
        drawPlayhead(playHeadRef.current.timeframe)

    }, [specImages])


    // When a new CSV File was uploaded, do this:
    useEffect( () => {
        if (!specImages){
            return
        }

        setLabels(importedLabels)
        drawAllLabels()
    }, [importedLabels])


    // Redraw every time zoom level or labels is changed
    useEffect( () => {
        console.log('trigger rerender')
        spectrogramContextRef.current = spectrogramCanvasRef.current.getContext('2d')
        timelineContextRef.current = timelineCanvasRef.current.getContext('2d')

        adjustSpectrogramCanvasDimensions(
            spectrogramCanvasRef.current,
            zoomLevel)

        drawTimeline(spectrogramCanvasRef.current,
            timelineCanvasRef.current,
            timelineContextRef.current,
            currentViewportTimeframes[0],
            currentViewportTimeframes[1],
            false)

        drawAllLabels()
        drawPlayhead(playHeadRef.current.timeframe)
    }
    , [zoomLevel, labels])


    // Every time specImagesCurrentIndex is changed (this means the user scrolled to edge of the spectrogram), do this:
    useEffect ( () => {
        if (!specImages){
            return
        }
        console.log(currentViewportTimeframes)
        drawTimeline(spectrogramCanvasRef.current,
            timelineCanvasRef.current,
            timelineContextRef.current,
            currentViewportTimeframes[0],
            currentViewportTimeframes[1],
            false)

        adjustOverviewCanvasDimensions()
        drawViewport('#55e6f3')
        populateOverviewCanvas()

        // this prevents crash when zooming out
        let correctIndex = specImagesCurrentIndex.index
        if (specImagesCurrentIndex.zoomLevel === 0){
            correctIndex = 0
        }
        populateSpectrogramCanvas(specImages[specImagesCurrentIndex.zoomLevel][correctIndex])
    }
    , [specImagesCurrentIndex, zoomLevel])


    return (
        <div id='visuals-container'>
            <canvas id='overview-canvas'
                    ref={overviewCanvasRef}
            />
            <div id='canvas-container' ref={canvasContainerRef} onScroll={checkIfScrolledToEdge}>
                <div id='background-img'
                     ref={backgroundImageRef}
                />
                <canvas id='spectrogram-canvas'
                        ref={spectrogramCanvasRef}
                        onMouseDown={handleLMBDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                />
                <canvas id='timeline-canvas'
                        ref={timelineCanvasRef}
                />
                {spectrogramIsLoading ? <Box sx={{ width: '100%' }}><LinearProgress /></Box> : ''}
            </div>
            <div id='controls-container'>
                <button id='play-btn' onClick={playAudio}>
                    ▶
                </button>
                <button id='pause-btn' onClick={pauseAudio}>
                    ⏸
                </button>
                <button id='stop-btn' onClick={stopAudio}>
                    ⏹
                </button>
                <button id='zoom-in-btn' onClick={handleClickZoomIn}>
                    +🔍
                </button>
                <button id='zoom-out-btn' onClick={handleClickZoomOut}>
                    -🔍
                </button>
                <Export
                    audioFileName={audioFileName}
                    labels={labels}
                />
            </div>
        </div>
    )
}

export default Visuals
