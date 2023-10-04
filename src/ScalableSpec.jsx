import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

class Label {
    constructor(onset, offset, clustername) {
        this.onset = onset
        this.offset = offset
        this.clustername = clustername
    }
}

function ScalableSpec() {
    const [selectedFile, setSelectedFile] = useState(null);
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

    const onFileChange = event => {
        setSelectedFile(event.target.files[0]);
    };

    const onUpload = async () => {
        const formData = new FormData();
        formData.append('newAudioFile', selectedFile);

        try {
            const response = await axios.post('http://localhost:8050/upload', formData);
            setAudioDuration(response.data.audio_duration);
            setAudioId(response.data.audio_id);
            setClipDuration(response.data.audio_duration);
            setCurrentStartTime(0);
            setMaxScrollTime(0);
            setScrollStep(response.data.audio_duration*0.05);
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };

    const getAudioClipSpec = async (start_time, duration) => {
        try {
            const response = await axios.post('http://localhost:8050/get-audio-clip-spec', {
                audio_id: audioId,
                start_time: start_time,
                clip_duration: duration
            });
            setSpectrogram(response.data.spec);
        } catch (error) {
            console.error("Error fetching audio clip spec:", error);
        }
    };

    /*
    const renderTimeAxis = () => {
        const canvas = timeAxisRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

        const intervals = canvas.width / 50; // Number of intervals based on 50 pixels
        const timeStep = clipDuration / intervals; // Time duration for each interval

        for (let i = 0; i <= intervals; i++) {
            const x = i * 50;
            const time = currentStartTime + i * timeStep;

            // Calculate text width to center the timestamp
            const textWidth = ctx.measureText(time.toFixed(2)).width;

            // Draw a vertical line above the position where the timestamp will be
            ctx.beginPath();
            ctx.moveTo(x, 5); // Start point of the line (5 pixels from the top)
            ctx.lineTo(x, 15); // End point of the line (10 pixels long)
            ctx.strokeStyle = '#9db4c0'
            ctx.stroke();

            // Display time with 2 decimal places followed by 's', positioned below the line
            ctx.fillStyle = '#9db4c0'
            ctx.fillText(time.toFixed(2), x - textWidth / 2, 30);
        }
    };
    */

    const renderTimeAxis = () => {
        const canvas = timeAxisRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

        const extraTimestamps = clipDuration !== audioDuration

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

        // Drawing lines in between
        const step = canvas.width / clipDuration
        let timestamp =  clipDuration * (step / canvas.width)
        for (let i = step; i < canvas.width; i += step) {
            ctx.beginPath()
            ctx.moveTo(i, canvas.height)
            ctx.lineTo(i, 15)
            ctx.lineWidth = 2
            ctx.strokeStyle = '#9db4c0'
            ctx.stroke()
            ctx.font = "14px Arial";
            ctx.fillStyle = '#9db4c0'
            ctx.fillText(timestamp.toString() + '.00', i - 14, 12);
            timestamp++
        }

        timestamp = clipDuration * (step / canvas.width)
        for (let i = step/4; i < canvas.width; i += step/4) {
            if (timestamp % 4 === 0){
                timestamp++
                continue;
            }
            ctx.beginPath()
            ctx.moveTo(i, canvas.height)
            ctx.lineTo(i, 25)
            ctx.lineWidth = 1
            ctx.strokeStyle = '#9db4c0'
            ctx.stroke()
            ctx.font = "10px Arial";
            ctx.fillStyle = '#9db4c0'
            if (extraTimestamps){
                const timestampText = (timestamp/4).toString()
                ctx.fillText(timestampText, i - 10, 20);
            }
            timestamp++
        }
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




    /* ++++++++++++++++++ Label methods ++++++++++++++++++ */

    const handleLMBDown = (event) => {
        if (event.button !== 0){
            return
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
        drawLine(clickedTimestamp, "#00FF00")
        addNewLabel(clickedTimestamp)
    }

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

    const getXClicked = (event) => {
        const rect = event.target.getBoundingClientRect()
        return event.clientX - rect.left
    }

    const calculateTimestamp = (event) => {
        const xClicked = getXClicked(event)
        const ratio = (xClicked / canvasRef.current.width)
        return clipDuration * ratio + currentStartTime
    }

    const calculateXPosition = (timeframe) => {
        return ( timeframe * canvasRef.current.width / clipDuration ) - ( currentStartTime * canvasRef.current.width / clipDuration )
    }

    const addNewLabel = (onset) => {
        setLabels(current => [...current, new Label (onset, undefined, 'my clustername')])
    }

    const drawAllLabels = () => {
        for (let label of labels) {
            drawLine(label.onset, "#00FF00")
            drawLine(label.offset, "#00FF00")
            drawLineBetween(label,"#00FF00")
        }
    }

    const flipOnsetOffset = (label) => {
        const newOnset = label.offset
        const newOffset = label.onset

        label.onset = newOnset
        label.offset = newOffset

        return label
    }




    useEffect(() => {
        if (spectrogram) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                drawAllLabels()
            };
            image.src = `data:image/png;base64,${spectrogram}`;


            renderTimeAxis();
        }
    }, [spectrogram]);

    useEffect( () => {
        if (!clipDuration){
            return
        }
            getAudioClipSpec(currentStartTime, clipDuration);
        },
        [currentStartTime, clipDuration]
    );



    return (
        <div>
            <input
                type="file"
                accept=".wav"
                onChange={onFileChange}
            />
            <button
                onClick={onUpload}
            >
                Upload
            </button>
            {spectrogram && (
                <div>
                    <canvas
                        ref={canvasRef}
                        width={parent.innerWidth - 30}
                        height={300}
                        onMouseDown={handleLMBDown}
                    />
                    <canvas
                        ref={timeAxisRef}
                        width={parent.innerWidth - 30}
                        height={40}
                    />
                    <div>
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
                            Zoom In
                        </button>
                        <button
                            onClick={onZoomOut}
                        >
                            Zoom Out
                        </button>
                        <button
                            onClick={() => console.log(labels)}
                        >
                            Console log labels
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScalableSpec;