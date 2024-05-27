import React, { useState } from 'react'

function FrequencyRangeWindow ( {handleCancel, speciesID, assignFrequencyRange} ) {

    const [minFreq, setMinFreq] = useState('')
    const [maxFreq, setMaxFreq] = useState('')

    const excludeNonDigits = (event) => {
        // Prevent the default behavior if the pressed key is not a digit
        if (!/\d/.test(event.key)) {
            event.preventDefault()
        }
    }

    return (
        <div className="input-window">

            <div className='close-btn-container'>
                <button className='close-btn' onClick={(event) => handleCancel(event)}>✖</button>
                <p className='window-header'>Set Species Frequency Range</p>
            </div>

            <form
                className='input-window-form'
                onSubmit={ (event) => assignFrequencyRange(event, Number(minFreq), Number(maxFreq), speciesID)}
            >
                <input
                    className='input-field'
                    type='number'
                    required='required'
                    value={minFreq}
                    min={0}
                    placeholder={`Set min frequency`}
                    onKeyPress={excludeNonDigits}
                    onPaste={(event) => event.preventDefault()}
                    onChange={ (event) => setMinFreq(event.target.value) }
                    autoFocus
                />
                <input
                    className='input-field'
                    type='number'
                    required='required'
                    value={maxFreq}
                    min={0}
                    placeholder={`Set max frequency`}
                    onKeyPress={excludeNonDigits}
                    onPaste={(event) => event.preventDefault()}
                    onChange={ (event) => setMaxFreq(event.target.value) }
                />
                <button className='input-window-submit-btn'>Submit</button>
            </form>

            <button className='input-window-cancel-btn' onClick={(event) => handleCancel(event)}>Cancel</button>
        </div>
    )

}

export default FrequencyRangeWindow