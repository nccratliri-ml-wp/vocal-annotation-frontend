import React, {useEffect, useRef, useState} from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import FileUpload from "./FileUpload.jsx";
import axios from "axios";

// Global variables
const SCROLL_STEP_RATIO = 0.1
const LABEL_COLOR = "#00FF00"
const LABEL_COLOR_HOVERED = "#f3e655"
const specType = 'log-mel'

function AudioTrack (){
    // General
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioId, setAudioId] = useState(null);
    const [clipDuration, setClipDuration] = useState(null);
    const [currentStartTime, setCurrentStartTime] = useState(0);
    const [currentEndTime, setCurrentEndTime] = useState(0);
    const [maxScrollTime, setMaxScrollTime] = useState(0);
    const [scrollStep, setScrollStep] = useState(0);

    // Spectrogram
    const specCanvasRef = useRef(null);
    const specImgData = useRef(null)
    const [spectrogram, setSpectrogram] = useState(null);

    // Waveform
    const waveformCanvasRef = useRef(null)
    const waveformImgData = useRef(null)
    const [audioArray, setAudioArray] = useState(null)

    // File Upload
    const [selectedFile, setSelectedFile] = useState(null)
    const [response, setResponse] = useState(null)
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)


    /* ++++++++++++++++++++ Pass methods ++++++++++++++++++++ */

    const passSelectedFileToScalableSpec = ( newFile ) => {
        setSelectedFile( newFile )
    }

    const passResponseToScalableSpec = ( newResponse ) => {
        setResponse( newResponse )
    }

    const passSpectrogramIsLoadingToScalableSpec = ( boolean ) => {
        setSpectrogramIsLoading( boolean )
    }


    /* ++++++++++++++++++ Spectrogram fetching methods ++++++++++++++++++ */

    const getAudioClipSpec = async (startTime, duration, spectrogramType) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-spec'
        const requestParameters = {
            //...parameters,
            audio_id: audioId,
            start_time: startTime,
            clip_duration: duration,
            spec_cal_method: spectrogramType,
        }

        const response = await axios.post(path, requestParameters)

        return response.data.spec
    }

    const getAudioArray = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-for-visualization'
        const requestParameters = {
            audio_id: audioId,
            start_time: currentStartTime,
            clip_duration: clipDuration,
            target_length: 100000
        }

        const response = await axios.post(path, requestParameters);
        return response.data.wav_array
    };

    const getSpecAndAudioArray = async () => {
        try {
            const [newSpec, newAudioArray] = await Promise.all(
                [
                    getAudioClipSpec(currentStartTime, clipDuration, specType),
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

    /* ++++++++++++++++++ Draw methods ++++++++++++++++++ */

    const drawEditorCanvases = (spectrogram, newAudioArray) => {
        if (!specCanvasRef.current) return

        const canvas = specCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
        const image = new Image();

        // Draw Spectrogram and labels
        image.addEventListener('load', () => {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            specImgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            drawWaveform(newAudioArray)
            //drawAllLabels()
            //drawPlayhead(playheadRef.current.timeframe)
            //passSpectrogramIsLoadingToApp(false)
        })
        image.src = `data:image/png;base64,${spectrogram}`;

        // Draw Time Axis, Viewport and Waveform
        //drawTimeAxis()
        //drawViewport(currentStartTime, currentEndTime, 'white', 2)
    }

    const drawWaveform = (newAudioArray) => {
        if (!waveformCanvasRef.current) return
        const canvas = waveformCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
        canvas.width = window.innerWidth -30;

        const scale = 50;
        const centerY = canvas.height / 2
        ctx.strokeStyle = '#ddd8ff'

        for (let i = 0; i < newAudioArray.length; i++) {
            const datapoint = newAudioArray[i]
            const y = centerY + scale * Math.sin(datapoint)

            ctx.beginPath()
            ctx.moveTo(i * (canvas.width / newAudioArray.length), y)
            ctx.lineTo((i + 1) * (canvas.width / newAudioArray.length), centerY + scale * newAudioArray[i + 1])
            ctx.stroke()
        }

        waveformImgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }


    // When user zoomed in/out, scrolled
    useEffect( () => {
            if (!clipDuration) return

            getSpecAndAudioArray()
        }, [currentStartTime, clipDuration]
    );

    // When a new audio file is uploaded:
    useEffect( () => {
        if (!response) return

        setAudioDuration(response.data.audio_duration);
        setAudioId(response.data.audio_id);
        setClipDuration(response.data.audio_duration);
        setCurrentStartTime(0);
        setCurrentEndTime(response.data.audio_duration)
        setMaxScrollTime(0);
        setScrollStep(response.data.audio_duration * SCROLL_STEP_RATIO);

    }, [response])


    return (
        <div
            className='audio-track'
        >
            <p>New Canvas </p>
            <FileUpload
                passSelectedFileToScalableSpec={passSelectedFileToScalableSpec}
                passResponseToScalableSpec={passResponseToScalableSpec}
                passSpectrogramIsLoadingToScalableSpec={passSpectrogramIsLoadingToScalableSpec}
            />
            <canvas
                ref={waveformCanvasRef}
                width={parent.innerWidth -30}
                height={150}
            />
            <canvas
                className='new-canvas'
                ref={specCanvasRef}
                width={parent.innerWidth -30}
                height={300}
            />
            {spectrogramIsLoading ? <Box sx={{ width: '100%' }}><LinearProgress /></Box> : ''}
        </div>
    )
}

export default AudioTrack