import React, { useState } from 'react'

function InputWindow ( {handleCancel, objectType, speciesID, addNewObject} ) {

    const [inputFieldContent, setInputFieldContent] = useState('')

    return (
        <div className="input-window">

            <div className='close-btn-container'>
                <button className='close-btn' onClick={(event) => handleCancel(event, speciesID)}>✖</button>
                <p className='window-header'>{objectType} Input</p>
            </div>

            <form
                className='input-window-form'
                onSubmit={ (event) => addNewObject(event, inputFieldContent, speciesID)}
            >
                <input
                    className='input-field'
                    type='text'
                    required='required'
                    pattern='^[^,]{1,30}$'
                    title='No commas allowed. Max length 30 characters'
                    value={inputFieldContent}
                    placeholder={`Add a new ${objectType}`}
                    onChange={ (event) => setInputFieldContent(event.target.value) }
                    autoFocus
                />
                <button className='input-window-submit-btn'>Submit</button>
            </form>

            <button className='input-window-cancel-btn' onClick={(event) => handleCancel(event, speciesID)}>Cancel</button>
        </div>
    )

}

export default InputWindow