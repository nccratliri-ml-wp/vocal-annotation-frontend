// React
import React, { useState } from 'react'

// External dependencies
import Sketch from '@uiw/react-color-sketch'

function Colorwheel( { closeColorwheel, passChosenColorToAnnotationLabels, selectedID, selectedClustername, globalMouseCoordinates } ) {

    const [hex, setHex] = useState(selectedClustername.color)
    const [disableAlpha, setDisableAlpha] = useState(false)

    return (
        <div
            className='colorwheel'
            style={{
                top: globalMouseCoordinates.y + 10,
                left: globalMouseCoordinates.x + 10
            }}
        >
            <div className='close-btn-container'>
                <button className='close-btn' onClick={() => closeColorwheel(selectedID, selectedClustername)}>
                    ✖
                </button>
            </div>
            <Sketch
                style={{ borderRadius: 0 }}
                color={hex}
                disableAlpha={disableAlpha}
                onChange={(color) => {
                    setHex(color.hex)
                    passChosenColorToAnnotationLabels(selectedID, selectedClustername, color.hex)
                }}
            />
        </div>
    )
}

export default Colorwheel

