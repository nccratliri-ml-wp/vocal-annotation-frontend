import React, {useState, useEffect} from "react";

function GlobalConfig (
            {
                globalHopLength,
                globalNumSpecColumns,
                globalSamplingRate,
                passGlobalHopLengthToApp,
                passGlobalNumSpecColumns,
                passGlobalSamplingRate,
            }
        )
    {

    const [hopLengthValue, setHopLengthValue] = useState(globalHopLength)
    const [numSpecColumnsValue, setColumnsValue] = useState(globalNumSpecColumns)
    const [samplingRateValue, setSamplingRateValue] = useState(globalSamplingRate)

    function submitGlobalParameters(){
        passGlobalHopLengthToApp(Number(hopLengthValue))
        passGlobalNumSpecColumns(Number(numSpecColumnsValue))
        passGlobalSamplingRate(Number(samplingRateValue))
    }

    // Update the input field values with the values returned from the backend (maybe not necessary?)
    useEffect( () => {
        setHopLengthValue(globalHopLength)
        setColumnsValue(globalNumSpecColumns)
        setSamplingRateValue(globalSamplingRate)
    }, [globalHopLength, globalNumSpecColumns, globalSamplingRate])

    return (
        <>

            <label>
                Hop Length
                <input
                    type="number"
                    value={hopLengthValue}
                    onChange={(event) => setHopLengthValue(event.target.value)}
                    onFocus={(event) => event.target.select()}
                />
            </label>

            <label>
                Num Spec Columns
                <input
                    type="number"
                    value={numSpecColumnsValue}
                    onChange={(event) => setColumnsValue(event.target.value)}
                    onFocus={(event) => event.target.select()}
                />
            </label>

            <label>
                Sampling Rate
                <input
                    type="number"
                    value={samplingRateValue}
                    onChange={(event) => setSamplingRateValue(event.target.value)}
                    onFocus={(event) => event.target.select()}
                />
            </label>

            <button onClick={submitGlobalParameters}>Submit All</button>
        </>
    )
}

export default GlobalConfig