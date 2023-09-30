import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

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

    const onFileChange = event => {
        setSelectedFile(event.target.files[0]);
    };

    const onUpload = async () => {
        const formData = new FormData();
        formData.append('newAudioFile', selectedFile);

        try {
            const response = await axios.post('http://localhost:5000/upload', formData);
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
            const response = await axios.post('http://localhost:5000/get-audio-clip-spec', {
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
            ctx.stroke();

            // Display time with 2 decimal places followed by 's', positioned below the line
            ctx.fillText(time.toFixed(2), x - textWidth / 2, 30);
        }
    };



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

    useEffect(() => {
        if (spectrogram) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            };
            image.src = `data:image/png;base64,${spectrogram}`;

            renderTimeAxis(); // Render the time axis
        }
    }, [spectrogram, currentStartTime, clipDuration]);

    useEffect( () => {
            getAudioClipSpec(currentStartTime, clipDuration);
        },
        [currentStartTime, clipDuration]
    );

    return (
        <div className="App">
            <h2>Upload WAV and Get Spectrogram</h2>
            <input type="file" accept=".wav" onChange={onFileChange} />
            <button onClick={onUpload}>Upload</button>
            {spectrogram && (
                <div style={{ marginLeft: '20px' }}>
                    <h3>Spectrogram:</h3>
                    <canvas ref={canvasRef} width={1500} height={300}></canvas>
                    <div style={{ marginLeft: '0px' }}>
                        <canvas ref={timeAxisRef} width={1500} height={30}></canvas>
                    </div>
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
                        >Right Scroll &rarr;</button>
                        <button onClick={onZoomIn}>Zoom In</button>
                        <button onClick={onZoomOut}>Zoom Out</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScalableSpec;