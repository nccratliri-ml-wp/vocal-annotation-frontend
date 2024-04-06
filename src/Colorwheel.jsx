import React, { useState } from 'react'
import Sketch from '@uiw/react-color-sketch'

function Colorwheel( { toggleColorwheel, passChosenColorToAnnotationLabels, selectedID, selectedClustername } ) {
    const [hex, setHex] = useState(selectedClustername.color)
    const [disableAlpha, setDisableAlpha] = useState(false)

    return (
        <div className='colorwheel'>
            <Sketch
                style={{ marginTop: 40 }}
                color={hex}
                disableAlpha={disableAlpha}
                onChange={(color) => {
                    setHex(color.hex)
                    passChosenColorToAnnotationLabels(selectedID, selectedClustername, color.hex)
                }}
            />
            <button onClick={() => toggleColorwheel(selectedID, selectedClustername)}>
                Close
            </button>
        </div>
    )
}

export default Colorwheel

