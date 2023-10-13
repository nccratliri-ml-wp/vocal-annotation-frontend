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

function ScalableSpec( { response, audioFileName, importedLabels, activeClustername, spectrogramIsLoading, passSpectrogramIsLoadingToApp }) {
    const [spectrogram, setSpectrogram] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioId, setAudioId] = useState(null);
    const [clipDuration, setClipDuration] = useState(null);
    const [currentStartTime, setCurrentStartTime] = useState(0);
    const [maxScrollTime, setMaxScrollTime] = useState(0);
    const [scrollStep, setScrollStep] = useState(0);
    const [scrollInterval, setScrollInterval] = useState(null);
    const canvasRef = useRef(null);
    const timeAxisRef = useRef(null);

    const [labels, setLabels] = useState([])
    const imgData = useRef(null)
    let clickedLabel = undefined
    let lastHoveredLabel = {labelObject: null, isHighlighted: false}

    const getAudioClipSpec = async (start_time, duration) => {
        try {
            const response = await axios.post('http://34.65.142.108:8050/get-audio-clip-spec', {
                audio_id: audioId,
                start_time: start_time,
                clip_duration: duration
            });
            setSpectrogram(response.data.spec);
        } catch (error) {
            console.error("Error fetching audio clip spec:", error);
        }
    };

    const renderTimeAxis = () => {
        const canvas = timeAxisRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

        // Drawing horizontal timeline
        ctx.beginPath()
        ctx.moveTo(0, canvas.height - 1)
        ctx.lineTo(canvas.width, canvas.height - 1)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'
        ctx.stroke()

        // Drawing first timestamp
        ctx.beginPath()
        ctx.moveTo(1, canvas.height)
        ctx.lineTo(1, 0)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'
        ctx.stroke()

        // Drawing last timestamp
        ctx.beginPath()
        ctx.moveTo(canvas.width - 1, canvas.height)
        ctx.lineTo(canvas.width - 1, 0)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'
        ctx.stroke()

        const minStepWidth1 = 2
        const minStepWidth2 = 15
        const minStepWidth3 = 30
        let step = 1
        const stepWidth = ( canvas.width / clipDuration )

        if (stepWidth < minStepWidth1){
            step = 800
        } else if (stepWidth < minStepWidth2) {
            step = 20
        } else if (stepWidth < minStepWidth3) {
            step = 2
        }

        //console.log('stepWidth ' + stepWidth)
        //console.log('step ' +step)

        // TO DO: figure out formula instead of these if-statments to make it dynamically
        // display hours and minutes for longer files
        // display miliseconds as zooming in

        // Drawing timestamps in between
        for (let i=step; i < audioDuration; i+=step){
            drawTimestamp(i, 15, '.00','#9db4c0')
        }
        /*
        for (let i=0; i < audioDuration; i+=(step/10)){
            if (Number.isInteger (Math.ceil(i * 10) / 10)) {
                continue;
            }
            drawTimestamp(i, 25,'','#9db4c0')
        }
         */
    }

    const drawTimestamp = (timestamp, lineHeight, ending, hexColorCode) => {
        const canvas = timeAxisRef.current;
        const ctx = timeAxisRef.current.getContext('2d');
        const x = ( timestamp * canvas.width / clipDuration ) - ( currentStartTime * canvas.width / clipDuration )

        // Draw line under Timestamp text
        ctx.beginPath()
        ctx.moveTo(x, canvas.height)
        ctx.lineTo(x, lineHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = hexColorCode
        ctx.stroke()
        // Draw timestamp text
        ctx.font = "14px Arial";
        ctx.fillStyle = hexColorCode
        timestamp = Math.ceil(timestamp * 10) / 10
        ctx.fillText(timestamp.toString() + ending, x - 14, lineHeight-5);
    }

    const onZoomIn = () => {
        const newDuration = Math.max(clipDuration / 2, 0.1);
        const newMaxScrollTime = Math.max(audioDuration - newDuration, 0);
        setClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration*0.05);
    };

    const onZoomOut = () => {
        const newDuration = Math.min(clipDuration * 2, audioDuration);
        const newMaxScrollTime = Math.max(audioDuration - newDuration, 0);
        const newStartTime = Math.min( Math.max(  audioDuration - newDuration, 0), currentStartTime);
        setClipDuration(newDuration);
        setMaxScrollTime(newMaxScrollTime);
        setScrollStep(newDuration*0.05);
        setCurrentStartTime( newStartTime );
    };

    const onScrollbarChange = async (event) => {
        const position = event.target.value;
        // Send a POST request to the server with the current scrollbar position
        // For demonstration purposes, I'm just logging the position.
        // You can send the position and audioId to the server as needed.
        setCurrentStartTime(parseFloat(position));
    };

    const onLeftScroll = () => {
        setCurrentStartTime(prevStartTime => {
            const newStartTime = Math.max(prevStartTime - scrollStep, 0);
            return newStartTime;
        });
    };

    const onRightScroll = () => {
        setCurrentStartTime(
            prevStartTime => Math.min(prevStartTime + scrollStep, maxScrollTime)
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
        if (event.button !== 0){
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
            //drawPlayhead(audioFile.currentTime)
            lastHoveredLabel.isHighlighted = false
            //console.log('drawing green')
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

    const calculateTimestamp = (event) => {
        const xClicked = getXClicked(event)
        const ratio = (xClicked / canvasRef.current.width)
        return clipDuration * ratio + currentStartTime
    }

    const calculateXPosition = (timestamp) => {
        return ( timestamp * canvasRef.current.width / clipDuration ) - ( currentStartTime * canvasRef.current.width / clipDuration )
    }

    const checkIfPositionIsOccupied = (xClicked) => {
        return ( checkIfClickedOnOnset(xClicked) || checkIfClickedOnOffset(xClicked) )
    }

    const checkIfClickedOnOnset = (xClicked) => {
        for (let label of labels){
            const xOnset = calculateXPosition(label.onset)
            if ( ( xOnset >= xClicked - 1 && xOnset <= xClicked + 1 ) ){
                return label
            }
        }
    }

    const checkIfClickedOnOffset = (xClicked) => {
        for (let label of labels){
            const xOffset = calculateXPosition(label.offset)
            if ( ( xOffset >= xClicked - 1 && xOffset <= xClicked + 1 ) ){
                return label
            }
        }
    }


    /* ++++++++++++++++++ Draw methods ++++++++++++++++++ */

    const drawLine = (timestamp, hexColorCode) => {
        const x = calculateXPosition(timestamp)
        const ctx = canvasRef.current.getContext('2d');

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, 300)
        ctx.lineWidth = 2
        ctx.strokeStyle = hexColorCode
        ctx.stroke()
    }

    const drawLineBetween = (label, colorHex) => {
        const xOnset = calculateXPosition(label.onset)
        const xOffset = calculateXPosition(label.offset)
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
        const xClustername = ( calculateXPosition(label.onset) + calculateXPosition(label.offset) ) / 2

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
        setLabels(current => [...current, new Label (onset, undefined, activeClustername)])
    }

    const deleteLabel = (xClicked) => {
        const labelToBeDeleted = labels.find(
            label => (calculateXPosition(label.onset) >= xClicked - 1  &&  calculateXPosition(label.onset) <= xClicked + 1 )
                || (calculateXPosition(label.offset) >= xClicked - 1  &&  calculateXPosition(label.offset) <= xClicked + 1 )
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
    }

    const dragOffset = (event) => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d');
        updateOffset(event)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imgData.current, 0, 0);
        drawAllLabels()
        //drawPlayhead(playHeadRef.current.timeframe)
    }


    // When a new spectrogram is returned from the backend
    useEffect(() => {
        if (spectrogram) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                imgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
                drawAllLabels()
                passSpectrogramIsLoadingToApp(false)
            };
            image.src = `data:image/png;base64,${spectrogram}`;

            renderTimeAxis();
        }
    }, [spectrogram, labels]);

    // When user zoomed in/out or scrolled:
    useEffect( () => {
        if (!clipDuration){
            return
        }
            getAudioClipSpec(currentStartTime, clipDuration);
        },
        [currentStartTime, clipDuration]
    );

    // When a new file is uploaded:
    useEffect( () => {
            if (!response){
                return
            }
            setAudioDuration(response.data.audio_duration);
            setAudioId(response.data.audio_id);
            setClipDuration(response.data.audio_duration);
            setCurrentStartTime(0);
            setMaxScrollTime(0);
            setScrollStep(response.data.audio_duration*0.05);
            setLabels([])
        },
        [response]
    )

    // When a new CSV File was uploaded:
    useEffect( () => {
        if (!importedLabels){
            return
        }
        setLabels(importedLabels)
    }, [importedLabels])


    return (
        <div>
            {spectrogram && (
                <div>
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
                    <div id="controls-container">
                        <button
                            // onClick={onLeftScroll}
                            onMouseDown={startLeftScroll}
                            onMouseUp={stopScroll}
                            onMouseLeave={stopScroll}
                        >&larr; Left Scroll</button>
                        <input
                            type="range"
                            min="0"
                            max={maxScrollTime}
                            value={currentStartTime}
                            step={scrollStep}
                            onChange={onScrollbarChange}
                        />
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