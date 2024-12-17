// React
import React, {useEffect, useState} from 'react';

// External dependencies
import Draggable from "react-draggable";

// Internal dependencies
import {excludeNonDigits} from "./utils.js";


function Parameters(
        {
            specCalMethod,
            nfft,
            binsPerOctave,
            minFreq,
            maxFreq,
            passShowLocalConfigWindowToTrack,
            passSpecCalMethodToTrack,
            passNfftToTrack,
            passBinsPerOctaveToTrack,
            passMinFreqToTrack,
            passMaxFreqToTrack,
            submitLocalParameters,
            strictMode,
            strictDevMode,
            spectrogram
        }
    )
{


    const [showNFftInput, setShowNFftInput] = useState(true)
    const [showBinsPerOctaveInput, setShowBinsPerOctaveInput] = useState(false)

    const handleRadioChange = (method) => {
        passSpecCalMethodToTrack( method )
    }

    const handleNFftInputChange = (event) => {
        passNfftToTrack(event.target.value)
    }

    const handleBinsPerOctaveInputChange = (event) => {
        passBinsPerOctaveToTrack(event.target.value)
    }

    const handleMinFreqInputChange = (event) => {
        passMinFreqToTrack(event.target.value)
    }

    const handleMaxFreqInputChange = (event) => {
        passMaxFreqToTrack(event.target.value)
    }

    const handleSubmit = () => {
        passShowLocalConfigWindowToTrack(false)
        submitLocalParameters()
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

        if (specCalMethod === 'dummy'){
            setShowNFftInput(false)
            setShowBinsPerOctaveInput(false)
        }

    }, [specCalMethod])

    return (
        <Draggable cancel='.local-parameters-window-content'>
            <div className="local-parameters-config-panel">
                <div className='close-btn-container'>
                    <button className='close-btn' onClick={() => passShowLocalConfigWindowToTrack(false)}>✖
                    </button>
                    <p className='window-header'>Spectrogram Parameters</p>
                </div>

                <div className='local-parameters-window-content'>

                    <div className='local-config-window-label'>
                        <label>
                            <input
                                type="radio"
                                value="log-mel"
                                disabled={(strictMode && !strictDevMode) && specCalMethod !== 'log-mel'}
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
                                    min={5}
                                    disabled={strictMode && !strictDevMode}
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
                                disabled={(strictMode && !strictDevMode) && specCalMethod !== 'constant-q'}
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
                                    min={25}
                                    disabled={strictMode && !strictDevMode}
                                    onChange={handleBinsPerOctaveInputChange}
                                    onKeyPress={excludeNonDigits}
                                    onFocus={(event) => event.target.select()}
                                    onPaste={(event) => event.preventDefault()}
                                />
                            </label>
                        )}
                    </div>

                    {strictMode &&
                        <div className={'local-config-window-label'}>
                            <label>
                                <input
                                    type="radio"
                                    value="dummy"
                                    disabled={specCalMethod !== 'dummy'}
                                    checked={specCalMethod === 'dummy'}
                                    onChange={() => handleRadioChange('dummy')}
                                />
                                Dummy
                            </label>
                        </div>
                    }

                    <div className='frequencies-labels-container'>
                        <label className={'local-config-window-label'}>
                            Min Freq
                            <input
                                type="number"
                                value={minFreq}
                                min={0}
                                disabled={strictMode && !strictDevMode}
                                onChange={handleMinFreqInputChange}
                                onKeyPress={excludeNonDigits}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>
                        <label className={'local-config-window-label'}>
                            Max Freq
                            <input
                                type="number"
                                value={maxFreq}
                                min={0}
                                disabled={strictMode && !strictDevMode}
                                onChange={handleMaxFreqInputChange}
                                onKeyPress={excludeNonDigits}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>
                    </div>

                    <div className={'local-config-window-buttons-container'}>
                        <button onClick={() => passShowLocalConfigWindowToTrack(false)}>Cancel</button>
                        <button disabled={!spectrogram || (strictMode && !strictDevMode)} onClick={handleSubmit}>Submit</button>
                    </div>

                </div>

            </div>
        </Draggable>
    )
}

export default Parameters;
