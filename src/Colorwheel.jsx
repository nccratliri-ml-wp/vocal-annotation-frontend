import React, { useState } from 'react'
import Sketch from '@uiw/react-color-sketch'

function Colorwheel( { toggleColorwheel, passChosenColorToClusternames, BTN } ) {
    const [hex, setHex] = useState(BTN.color)
    const [disableAlpha, setDisableAlpha] = useState(false)

    return (
        <div className='colorwheel'>
            <Sketch
                style={{ marginTop: 40 }}
                color={hex}
                disableAlpha={disableAlpha}
                onChange={(color) => {
                    setHex(color.hex)
                    passChosenColorToClusternames(BTN, color.hex)
                }}
            />
            <button onClick={() => toggleColorwheel(BTN)}>
                Close
            </button>
        </div>
    )
}

export default Colorwheel

