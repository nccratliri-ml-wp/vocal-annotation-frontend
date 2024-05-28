import React, { useState } from 'react'

function FrequencyRangeWindow ( {handleCancel, speciesID, minFreq, maxFreq, assignFrequencyRange} ) {

    const [minFreqInputField, setMinFreqInputField] = useState(minFreq ? minFreq.toString() : '')
    const [maxFreqInputField, setMaxFreqInputField] = useState(maxFreq ? maxFreq.toString() : '')

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
                onSubmit={ (event) => assignFrequencyRange(event, Number(minFreqInputField), Number(maxFreqInputField), speciesID)}
            >
                <input
                    className='input-field'
                    type='number'
                    required='required'
                    value={minFreqInputField}
                    min={0}
                    placeholder={`Set min frequency`}
                    onKeyPress={excludeNonDigits}
                    onPaste={(event) => event.preventDefault()}
                    onChange={ (event) => setMinFreqInputField(event.target.value) }
                    autoFocus
                />
                <input
                    className='input-field'
                    type='number'
                    required='required'
                    value={maxFreqInputField}
                    min={0}
                    placeholder={`Set max frequency`}
                    onKeyPress={excludeNonDigits}
                    onPaste={(event) => event.preventDefault()}
                    onChange={ (event) => setMaxFreqInputField(event.target.value) }
                />
                <button className='input-window-submit-btn'>Submit</button>
            </form>

            <button className='input-window-cancel-btn' onClick={(event) => handleCancel(event)}>Cancel</button>
        </div>
    )

}

export default FrequencyRangeWindow