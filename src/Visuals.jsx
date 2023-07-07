import {useEffect, useRef, useState} from "react";

function drawSpectrogram(spectrogramImg, spectrogramCanvas, spectrogramCanvasContext, zoomLevel){
    spectrogramCanvas.width = zoomLevel
    spectrogramCanvas.height = spectrogramImg.naturalHeight * 1.5
    spectrogramCanvasContext.drawImage(spectrogramImg, 0, 0, zoomLevel, spectrogramImg.naturalHeight * 1.5)
}

function Visuals( {audioLength, spectrogramImg} ){

    const canvasContainerRef = useRef(null)
    const spectrogramCanvasRef = useRef(null)
    const spectrogramContextRef = useRef(null)

    const [zoomLevel, setZoomLevel] = useState(null)

    function handleClickZoomIn(){
        console.log('zoomed in')
        setZoomLevel(spectrogramImg.naturalWidth)
    }

    function handleClickZoomOut(){
        console.log('zoomed out')
        setZoomLevel(canvasContainerRef.current.clientWidth)
    }

    useEffect( () => {
        console.log('Set up Initial Drawing')
        setZoomLevel(canvasContainerRef.current.clientWidth)

        spectrogramContextRef.current = spectrogramCanvasRef.current.getContext('2d')

        spectrogramImg.onload = () => {
        drawSpectrogram(spectrogramImg,
            spectrogramCanvasRef.current,
            spectrogramContextRef.current,
            zoomLevel)
        }
    }
    , [spectrogramImg])

    useEffect( () => {
        console.log('Runs each time zoom level is changed')

        spectrogramContextRef.current = spectrogramCanvasRef.current.getContext('2d')

        drawSpectrogram(spectrogramImg,
            spectrogramCanvasRef.current,
            spectrogramContextRef.current,
            zoomLevel)

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
            <div id='canvas-container' ref={canvasContainerRef}>
                <canvas id='spectrogram-canvas' ref={spectrogramCanvasRef} />
            </div>
        </div>

    )
}

export default Visuals