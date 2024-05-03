import React, {useEffect, useState} from 'react';

function Parameters(
        {
            showLocalConfigWindow,
            specCalMethod,
            nfft,
            binsPerOctave,
            minFreq,
            maxFreq,
            passShowLocalConfigWindowToScalableSpec,
            passSpecCalMethodToScalableSpec,
            passNfftToScalableSpec,
            passBinsPerOctaveToScalableSpec,
            passMinFreqToScalableSpec,
            passMaxFreqToScalableSpec,
            submitLocalParameters
        }
    )
{


    const [showNFftInput, setShowNFftInput] = useState(true)
    const [showBinsPerOctaveInput, setShowBinsPerOctaveInput] = useState(false)

    const handleRadioChange = (method) => {
        passSpecCalMethodToScalableSpec( method )
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
        passShowLocalConfigWindowToScalableSpec(false)
        submitLocalParameters()
    }

    const excludeNonDigits = (event) => {
        // Prevent the default behavior if the pressed key is not a digit
        if (!/\d/.test(event.key)) {
            event.preventDefault()
        }
    }


    /* ++++++++++++++++++ Use Effect Hooks ++++++++++++++++++ */

    useEffect( () => {
        // Conditionally render the nfft or binsPerOctave Input field according to the selected specCalMethod
        if (!specCalMethod) return

        if (specCalMethod === 'log-mel') {
            setShowNFftInput(true)
            setShowBinsPerOctaveInput(false)
        }

        if (specCalMethod === 'constant-q'){
            setShowNFftInput(false)
            setShowBinsPerOctaveInput(true)
        }

    }, [specCalMethod])

    return (
        <>
        {
            showLocalConfigWindow &&
            <div
                className="local-parameters-config-panel"
            >
                <div className='close-btn-container'>
                    <button className='close-btn' onClick={ () => passShowLocalConfigWindowToScalableSpec(false) }>✖</button>
                    <p className='window-header'>Track Configurations</p>
                </div>

                <div className={'local-config-window-label'}>
                    <label>
                        <input
                            type="radio"
                            value="log-mel"
                            checked={specCalMethod === 'log-mel'}
                            onChange={() => handleRadioChange('log-mel')}
                        />
                        Log-Mel
                    </label>
                    {showNFftInput && (
                        <label>
                            N-FFT
                            <input
                                type="number"
                                value={nfft}
                                min={0}
                                onChange={handleNFftInputChange}
                                onKeyPress={excludeNonDigits}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>
                    )}
                </div>

                <div className={'local-config-window-label'}>
                    <label>
                        <input
                            type="radio"
                            value="constant-q"
                            checked={specCalMethod === 'constant-q'}
                            onChange={() => handleRadioChange('constant-q')}
                        />
                        Constant-Q
                    </label>
                    {showBinsPerOctaveInput && (
                        <label>
                            BPO
                            <input
                                type="number"
                                value={binsPerOctave}
                                min={0}
                                onChange={handleBinsPerOctaveInputChange}
                                onKeyPress={excludeNonDigits}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>
                    )}
                </div>

                <div className='frequencies-labels-container'>
                    <label className={'local-config-window-label'}>
                        Min Frequency
                        <input
                            type="number"
                            value={minFreq}
                            min={0}
                            onChange={handleMinFreqInputChange}
                            onKeyPress={excludeNonDigits}
                            onFocus={(event) => event.target.select()}
                            onPaste={(event) => event.preventDefault()}
                        />
                    </label>
                    <label className={'local-config-window-label'}>
                        Max Frequency
                        <input
                            type="number"
                            value={maxFreq}
                            min={0}
                            onChange={handleMaxFreqInputChange}
                            onKeyPress={excludeNonDigits}
                            onFocus={(event) => event.target.select()}
                            onPaste={(event) => event.preventDefault()}
                        />
                    </label>
                </div>

                <div className={'local-config-window-label'}>
                    <div></div>
                    <button onClick={handleSubmit}>Submit</button>
                </div>

            </div>
        }
        </>
    )
}

export default Parameters;
