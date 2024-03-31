import React, {useState, useEffect} from "react";

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
                defaultConfig
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
            alert('Combination of values is not valid. Returned to previous valid combination. The following must be satisfied:\n\nAudioDuration >= HopLength / SamplingRate * NumSpecColumns')
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
        <>

            <label>
                Hop Length
                <input
                    type="number"
                    value={hopLengthInputValue}
                    onKeyPress={excludeNonDigits}
                    onChange={() => setHopLengthInputValue(event.target.value)}
                    onFocus={(event) => event.target.select()}
                />
            </label>

            <label>
                Num Spec Columns
                <input
                    type="number"
                    value={numSpecColumnsInputValue}
                    onChange={(event) => setColumnsInputValue(event.target.value)}
                    onKeyPress={excludeNonDigits}
                    onFocus={(event) => event.target.select()}
                />
            </label>

            <label>
                Sampling Rate
                <input
                    type="number"
                    value={samplingRateInputValue}
                    onChange={(event) => setSamplingRateInputValue(event.target.value)}
                    onKeyPress={excludeNonDigits}
                    onFocus={(event) => event.target.select()}
                />
            </label>

            <button onClick={submitGlobalParameters}>Submit All</button>
            <button onClick={restoreDefaultValues}>Restore Default Values</button>
        </>
    )
}

export default GlobalConfig