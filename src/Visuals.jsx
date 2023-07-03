import {useEffect, useRef} from "react";


function Visuals( {audioLength, spectrogramImg} ){

    const canvasRef = useRef(null)
    const contextRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current

        const context = canvas.getContext('2d')
        contextRef.current = context

        context.drawImage(spectrogramImg, 0, 0, 200, spectrogramImg.naturalHeight * 1.5)


        }
    , [])

    return (
        <>
            <canvas id='spectrogram-canvas'
                    ref={canvasRef}
            />
        </>
    )
}

export default Visuals