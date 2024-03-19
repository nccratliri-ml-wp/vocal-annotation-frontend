import React, { useState } from 'react';

function Parameters(
        {
            specCallMethod,
            nfft,
            binsPerOctave,
            minFreq,
            maxFreq,
            passSpecCallMethodToScalableSpec,
            passNfftToScalableSpec,
            passBinsPerOctaveToScalableSpec,
            passMinFreqToScalableSpec,
            passMaxFreqToScalableSpec,
            submitLocalParameters
        }
    )
{

    const [showConfigPanel, setShowConfigPanel] = useState(false)
    const [showNFftInput, setShowNFftInput] = useState(true)
    const [showBinsPerOctaveInput, setShowBinsPerOctaveInput] = useState(false)

    const handleRadioChange = (method) => {
        setShowNFftInput(method === 'log-mel')
        setShowBinsPerOctaveInput(method === 'constant-q')

        passSpecCallMethodToScalableSpec( method )
    }

    const handleNFftInputChange = (event) => {
        passNfftToScalableSpec(event.target.value)
    }

    const handleBinsPerOctaveInputChange = (event) => {
        passBinsPerOctaveToScalableSpec(event.target.value)
    }

    const handleMinFreqInputChange = (event) => {
        passMinFreqToScalableSpec(event.target.value)
    }

    const handleMaxFreqInputChange = (event) => {
        passMaxFreqToScalableSpec(event.target.value)
    }

    const handleSubmit = () => {
        setShowConfigPanel(false)
        submitLocalParameters()
    }

    return (
        <>
            <button onClick={ () => setShowConfigPanel(!showConfigPanel) }>Show ConfigPanel</button>
        {
            showConfigPanel &&
            <div
                className="local-parameters-config-panel"
            >

                <div>
                    <label>
                        <input
                            type="radio"
                            value="log-mel"
                            checked={specCallMethod === 'log-mel'}
                            onChange={() => handleRadioChange('log-mel')}
                        />
                        Log-Mel
                    </label>
                    {showNFftInput && (
                        <label>
                            N-FFT:
                            <input
                                type="number"
                                value={nfft}
                                min={0}
                                onChange={handleNFftInputChange}
                                onFocus={(event) => event.target.select()}
                            />
                        </label>
                    )}
                </div>

                <div>
                    <label>
                        <input
                            type="radio"
                            value="constant-q"
                            checked={specCallMethod === 'constant-q'}
                            onChange={() => handleRadioChange('constant-q')}
                        />
                        Constant-Q
                    </label>
                    {showBinsPerOctaveInput && (
                        <label>
                            BPO:
                            <input
                                type="number"
                                value={binsPerOctave}
                                onChange={handleBinsPerOctaveInputChange}
                                onFocus={(event) => event.target.select()}
                            />
                        </label>
                    )}
                </div>

                <div>
                    <label>
                        Min Freq
                        <input
                            type="number"
                            value={minFreq}
                            onChange={handleMinFreqInputChange}
                            onFocus={(event) => event.target.select()}
                        />
                    </label>
                    <label>
                        Max Freq
                        <input
                            type="number"
                            value={maxFreq}
                            onChange={handleMaxFreqInputChange}
                            onFocus={(event) => event.target.select()}
                        />
                    </label>
                </div>

                <button onClick={handleSubmit}>Submit All</button>

            </div>
        }
        </>
    )
}

export default Parameters;
