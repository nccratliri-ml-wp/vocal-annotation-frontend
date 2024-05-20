import React, { useState } from 'react'
import Sketch from '@uiw/react-color-sketch'

function Colorwheel( { toggleColorwheel, passChosenColorToAnnotationLabels, selectedID, selectedClustername } ) {
    const [hex, setHex] = useState(selectedClustername.color)
    const [disableAlpha, setDisableAlpha] = useState(false)

    return (
        <div className='colorwheel' >
            <div className='close-btn-container'>
                <button className='close-btn' onClick={() => toggleColorwheel(selectedID, selectedClustername)}>
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

