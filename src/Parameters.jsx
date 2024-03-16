
import React, { useState } from 'react';

function Parameters(
    {
        specCallMethod,
        nfft,
        binsPerOctave,
        minFreq,
        maxFreq,
        passParametersToScalableSpec,
        passSpecCallMethodToScalableSpec,
        passNfftToScalableSpec,
        passBinsPerOctaveToScalableSpec,
        passMinFreqToScalableSpec,
        passMaxFreqToScalableSpec,
        submitLocalParameters
    }
)
{

    const [selectedMethod, setSelectedMethod] = useState(specCallMethod)
    const [nFftValue, setNFftValue] = useState(nfft)
    const [binsPerOctaveValue, setBinsPerOctaveValue] = useState(0)
    const [showNFftInput, setShowNFftInput] = useState(true)
    const [showBinsPerOctaveInput, setShowBinsPerOctaveInput] = useState(false)
    const [minFreqValue, setMinFreqValue] = useState(0)
    const [maxFreqValue, setMaxFreqValue] = useState(5000)

    const handleRadioChange = (method) => {
        setShowNFftInput(method === 'log-mel')
        setShowBinsPerOctaveInput(method === 'constant-q')

        passSpecCallMethodToScalableSpec( method )
    }

    const handleNFftInputChange = (event) => {
        passNfftToScalableSpec( parseInt(event.target.value, 10 ) )
    }

    const handleBinsPerOctaveInputChange = (event) => {
        passBinsPerOctaveToScalableSpec( parseInt(event.target.value, 10 ) )
    }

    const handleMinFreqInputChange = (event) => {
        passMinFreqToScalableSpec( parseInt(event.target.value, 10 ) )
    }

    const handleMaxFreqInputChange = (event) => {
        passMaxFreqToScalableSpec( parseInt(event.target.value, 10 ) )

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
                            onChange={handleNFftInputChange}
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
                    />
                </label>
                <label>
                    Max Freq
                    <input
                        type="number"
                        value={maxFreq}
                        onChange={handleMaxFreqInputChange}
                    />
                </label>
            </div>

            <button onClick={submitLocalParameters}>Submit All</button>

        </div>
    )
}

export default Parameters;

/*
function Parameters(
                    {
                        passParametersToScalableSpec,
                        passSpecCallMethodToScalableSpec,
                        passNfftToScalable,
                        SpecpassBinsPerOctaveToScalableSpec,
                        passMinFreqToScalableSpec,
                        passMaxFreqToScalableSpec
                    }
                )
            {

    const [selectedMethod, setSelectedMethod] = useState('log-mel')
    const [nFftValue, setNFftValue] = useState(512)
    const [binsPerOctaveValue, setBinsPerOctaveValue] = useState(0)
    const [showNFftInput, setShowNFftInput] = useState(true)
    const [showBinsPerOctaveInput, setShowBinsPerOctaveInput] = useState(false)
    const [minFreqValue, setMinFreqValue] = useState(0)
    const [maxFreqValue, setMaxFreqValue] = useState(5000)

    const handleRadioChange = (method) => {
        setSelectedMethod(method)
        setShowNFftInput(method === 'log-mel')
        setShowBinsPerOctaveInput(method === 'constant-q')
        passParametersToScalableSpec(
            {
                spec_cal_method: method,
                n_fft: nFftValue,
                bins_per_octave: binsPerOctaveValue,
                min_frequency: minFreqValue,
                max_frequency: maxFreqValue
            }
        ) //to be deleted probably to not trigger uneccessary calls to backend
        passSpecCallMethodToScalableSpec()
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
                    bins_per_octave: binsPerOctaveValue,
                    min_frequency: minFreqValue,
                    max_frequency: maxFreqValue
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
                bins_per_octave: binsPerOctave,
                min_frequency: minFreqValue,
                max_frequency: maxFreqValue
            })
        }
    }

    const handleMinFreqInputChange = (event) => {
        setMinFreqValue(event.target.value)
    }

    const handleMinFreqSubmit = () => {
        const minFreq = parseInt(minFreqValue, 10)
        if (!isNaN(minFreq)){
            passParametersToScalableSpec({
                spec_cal_method: selectedMethod,
                n_fft: nFftValue,
                bins_per_octave: binsPerOctaveValue,
                min_frequency: minFreq,
                max_frequency: maxFreqValue
            })
        }
    }

    const handleMaxFreqInputChange = (event) => {
        setMaxFreqValue(event.target.value)
    }

    const handleMaxFreqSubmit = () => {
        const maxFreq = parseInt(maxFreqValue, 10)
        if (!isNaN(maxFreq)){
            passParametersToScalableSpec({
                spec_cal_method: selectedMethod,
                n_fft: nFftValue,
                bins_per_octave: binsPerOctaveValue,
                min_frequency: minFreqValue,
                max_frequency: maxFreq
            })
            passMaxFreqToScalableSpec(maxFreq)
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
                    <label>
                        N-FFT:
                        <input
                            type="number"
                            value={nFftValue}
                            onChange={handleNFftInputChange}
                        />
                        <button onClick={handleNFftSubmit}>Submit</button>
                    </label>
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
                    <label>
                        BPO:
                        <input
                            type="number"
                            value={binsPerOctaveValue}
                            onChange={handleBinsPerOctaveInputChange}
                        />
                        <button onClick={handleBinsPerOctaveSubmit}>Submit</button>
                    </label>
                )}
            </div>

            <div>
                <label>
                    Min Freq
                    <input
                        type="number"
                        value={minFreqValue}
                        onChange={handleMinFreqInputChange}
                    />
                    <button onClick={handleMinFreqSubmit}>Submit</button>
                </label>
                <label>
                    Max Freq
                    <input
                        type="number"
                        value={maxFreqValue}
                        onChange={handleMaxFreqInputChange}
                    />
                    <button onClick={handleMaxFreqSubmit}>Submit</button>
                </label>
            </div>

        </div>
    )
}

export default Parameters;
*/
