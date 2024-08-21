// React
import React, {useState, useEffect} from "react";

// External dependencies
import {toast} from "react-toastify";
import Draggable from "react-draggable";

function GlobalConfig (
            {
                globalAudioDuration,
                currentStartTime,
                updateClipDurationAndTimes,
                globalHopLength,
                globalNumSpecColumns,
                globalSamplingRate,
                passGlobalNumSpecColumnsToApp,
                passGlobalSamplingRateToApp,
                defaultConfig,
                passShowGlobalConfigWindowToApp,
                substractOneNewOpenWindow,
                strictMode,
            }
        )
    {

    const [hopLengthInputValue, setHopLengthInputValue] = useState(globalHopLength)
    const [numSpecColumnsInputValue, setColumnsInputValue] = useState(globalNumSpecColumns)
    const [samplingRateInputValue, setSamplingRateInputValue] = useState(globalSamplingRate)

    const [lastValidConfigCombination, setLastValidConfigCombination] = useState({
        hopLength: globalHopLength,
        numSpecColumns: globalNumSpecColumns,
        samplingRate: globalSamplingRate
    })

    function submitGlobalParameters(){
        // Input field values are strings, so convert them to numbers
        const newHopLength = Number(hopLengthInputValue)
        const newNumSpecColumns = Number(numSpecColumnsInputValue)
        const newSamplingRate = Number(samplingRateInputValue)

        // Check if value combination is valid according to formula
        const newDuration = newHopLength / newSamplingRate * newNumSpecColumns
        if (newDuration > globalAudioDuration) {
            // Replace invalid values with last valid config
            setHopLengthInputValue(lastValidConfigCombination.hopLength)
            setColumnsInputValue(lastValidConfigCombination.numSpecColumns)
            setSamplingRateInputValue(lastValidConfigCombination.samplingRate)
            toast.error('Combination of values is not valid. Returned to previous valid combination. The following must be satisfied:\n\nAudioDuration >= HopLength / SamplingRate * NumSpecColumns')
            return
        }

        // If the values combination is valid, update everything
        const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
        const newStartTime = Math.min( newMaxScrollTime, currentStartTime)
        const newEndTime = newStartTime + newDuration
        updateClipDurationAndTimes( newHopLength, newDuration, newMaxScrollTime, newStartTime, newEndTime )
        passGlobalNumSpecColumnsToApp(newNumSpecColumns)
        passGlobalSamplingRateToApp(newSamplingRate)
    }

    const restoreDefaultValues = () => {
        if (!defaultConfig) return

        const { hop_length: defaultHopLength, num_spec_columns: defaultNumSpecColumns, sampling_rate: defaultSamplingRate } = defaultConfig

        setHopLengthInputValue(defaultHopLength)
        setColumnsInputValue(defaultNumSpecColumns)
        setSamplingRateInputValue(defaultSamplingRate)
    }

    const excludeNonDigits = (event) => {
        // Prevent the default behavior if the pressed key is not a digit
        if (!/\d/.test(event.key)) {
            event.preventDefault()
        }
    }

    const closeWindow = () => {
        passShowGlobalConfigWindowToApp(false)
        substractOneNewOpenWindow()
    }

    // Update the input field values with the values returned from the backend (maybe not necessary?)
    useEffect( () => {
        setHopLengthInputValue(globalHopLength)
        setColumnsInputValue(globalNumSpecColumns)
        setSamplingRateInputValue(globalSamplingRate)

        // Save last valid config
        setLastValidConfigCombination({
            hopLength: globalHopLength,
            numSpecColumns: globalNumSpecColumns,
            samplingRate: globalSamplingRate
        })

    }, [globalHopLength, globalNumSpecColumns, globalSamplingRate])


    return (
        <Draggable cancel='#global-config-window-content'>
            <div id='global-config-window'>

                <div className='close-btn-container'>
                    <button className='close-btn' onClick={closeWindow}>✖</button>
                    <p className='window-header'>Global Configurations</p>
                </div>

                <div id='global-config-window-content'>

                    <div>
                        <label className='global-config-window-label'>
                            Hop Length
                            <input
                                type="number"
                                value={hopLengthInputValue}
                                min={0}
                                disabled={strictMode}
                                onKeyPress={excludeNonDigits}
                                onChange={() => setHopLengthInputValue(event.target.value)}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>

                        <label className='global-config-window-label'>
                            Num Spec Columns
                            <input
                                type="number"
                                value={numSpecColumnsInputValue}
                                min={0}
                                disabled={strictMode}
                                onChange={(event) => setColumnsInputValue(event.target.value)}
                                onKeyPress={excludeNonDigits}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>

                        <label className='global-config-window-label'>
                            Sampling Rate
                            <input
                                type="number"
                                value={samplingRateInputValue}
                                min={0}
                                disabled={strictMode}
                                onChange={(event) => setSamplingRateInputValue(event.target.value)}
                                onKeyPress={excludeNonDigits}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>

                        <div id='global-config-default-values-btn-container' >
                            <div></div>
                            <button id='global-config-default-values-btn' disabled={strictMode} onClick={restoreDefaultValues}>Restore Default Values</button>
                        </div>

                    </div>

                    <div id='global-config-window-buttons-container'>
                        <button onClick={() => passShowGlobalConfigWindowToApp(false)}>Cancel</button>
                        <button id='global-config-submit-btn' disabled={strictMode} onClick={submitGlobalParameters}>Submit</button>
                    </div>

                </div>
            </div>
        </Draggable>
    )
}

export default GlobalConfig