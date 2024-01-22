import React, { useState } from 'react';

function Parameters({ passParametersToScalableSpec }) {
    const [selectedMethod, setSelectedMethod] = useState('log-mel')
    const [nFftValue, setNFftValue] = useState('')
    const [binsPerOctaveValue, setBinsPerOctaveValue] = useState('')
    const [showNFftInput, setShowNFftInput] = useState(true)
    const [showBinsPerOctaveInput, setShowBinsPerOctaveInput] = useState(false)

    const handleRadioChange = (method) => {
        setSelectedMethod(method)
        setShowNFftInput(method === 'log-mel')
        setShowBinsPerOctaveInput(method === 'constant-q')
        passParametersToScalableSpec({ spec_cal_method: method, n_fft: nFftValue, bins_per_octave: binsPerOctaveValue }) //to be deleted probably to not trigger uneccessary calls to backend
    }

    const handleNFftInputChange = (event) => {
        setNFftValue(event.target.value)
    }

    const handleNFftSubmit = () => {
        const nFft = parseInt(nFftValue, 10)
        if (!isNaN(nFft)) {
            passParametersToScalableSpec(
                {
                    spec_cal_method: 'log-mel',
                    n_fft: nFft,
                    bins_per_octave: binsPerOctaveValue
                }
            )
        }
    }

    const handleBinsPerOctaveInputChange = (event) => {
        setBinsPerOctaveValue(event.target.value)
    }

    const handleBinsPerOctaveSubmit = () => {
        const binsPerOctave = parseInt(binsPerOctaveValue, 10)
        if (!isNaN(binsPerOctave)){
            passParametersToScalableSpec({
                spec_cal_method: 'constant-q',
                n_fft: nFftValue,
                bins_per_octave: binsPerOctave
            })
        }
    }

    return (
        <div
            className="parameters"
        >

            <div>
                <label>
                    <input
                        type="radio"
                        value="log-mel"
                        checked={selectedMethod === 'log-mel'}
                        onChange={() => handleRadioChange('log-mel')}
                    />
                    Log-Mel
                </label>
                {showNFftInput && (
                    <>
                        <label>
                            N-FFT:
                            <input
                                type="number"
                                value={nFftValue}
                                onChange={handleNFftInputChange}
                            />
                            <button onClick={handleNFftSubmit}>Submit</button>
                        </label>

                    </>
                )}
            </div>

            <div>
                <label>
                    <input
                        type="radio"
                        value="constant-q"
                        checked={selectedMethod === 'constant-q'}
                        onChange={() => handleRadioChange('constant-q')}
                    />
                    Constant-Q
                </label>
                {showBinsPerOctaveInput && (
                    <>
                        <label>
                            BPO:
                            <input
                                type="number"
                                value={binsPerOctaveValue}
                                onChange={handleBinsPerOctaveInputChange}
                            />
                            <button onClick={handleBinsPerOctaveSubmit}>Submit</button>
                        </label>

                    </>
                )}
            </div>

        </div>
    )
}

export default Parameters;



/*
import React, { useState } from 'react'

function Parameters({ passParametersToScalableSpec }) {

    const [selectedMethod, setSelectedMethod] = useState('log-mel')

    const handleRadioChange = (method) => {
        setSelectedMethod(method)
        passParametersToScalableSpec({ spec_cal_method: method })
    }

    return (
        <div>
            <label>
                <input
                    type="radio"
                    value="log-mel"
                    checked={selectedMethod === 'log-mel'}
                    onChange={() => handleRadioChange('log-mel')}
                />
                Log-Mel
            </label>
            <label>
                <input
                    type="radio"
                    value="constant-q"
                    checked={selectedMethod === 'constant-q'}
                    onChange={() => handleRadioChange('constant-q')}
                />
                Constant-Q
            </label>
        </div>
    )
}

export default Parameters
*/
