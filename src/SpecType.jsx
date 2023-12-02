import {useState} from "react"
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Input from '@mui/material/Input';
import Box from '@mui/material/Box';

function SpecType({ specType, passSpecTypeToApp, passNfftToApp, passBinsPerOctaveToApp }) {
    const [nFft, setNFft] = useState("");
    const [binsPerOctave, setBinsPerOctave] = useState("");

    function handleChange(event) {
        passSpecTypeToApp(event.target.value);
    }

    function handleNFftChange(event) {
        setNFft(event.target.value);
    }

    function handleBinsPerOctaveChange(event) {
        setBinsPerOctave(event.target.value);
    }

    function handleKeyDownNfft(event) {
        if (event.key === 'Enter') {
            passNfftToApp(event.target.value)
        }
    }

    function handleKeyDownBins(event) {
        if (event.key === 'Enter') {
            passBinsPerOctaveToApp(event.target.value)
        }
    }

    function submitNfft(){
        console.log('submitted nfft: '+ nFft)
        passNfftToApp(nFft)
    }

    function submitBins(){
        console.log('submitted binsPerOctave: '+ binsPerOctave)
        passBinsPerOctaveToApp(binsPerOctave)
    }

    return (
        <FormControl id="spec-type-form">
            <FormLabel id="spec-type-label">Spectrogram Type</FormLabel>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
                <RadioGroup
                    aria-labelledby="spec-type-label"
                    name="spec-type-group"
                    value={specType}
                    onChange={handleChange}
                    id="spec-type-group"
                >
                    <FormControlLabel value="log-mel" control={<Radio />} label="Log-mel" />
                    <FormControlLabel value="constant-q" control={<Radio />} label="Constant Q" />
                </RadioGroup>

                {(specType === "log-mel" || specType === "constant-q") && (
                    <Box className="input-container">
                        {specType === "log-mel" && (
                            <FormControl>
                                <FormLabel id="n-fft-label">N FFT</FormLabel>
                                <div>
                                    <Input
                                        type="number"
                                        id="n-fft"
                                        value={nFft}
                                        onChange={handleNFftChange}
                                        onKeyDown={handleKeyDownNfft}
                                        className="input-field"
                                    />
                                    <button onClick={submitNfft} className="submit-btn">
                                        Submit
                                    </button>
                                </div>
                            </FormControl>
                        )}

                        {specType === "constant-q" && (
                            <FormControl>
                                <FormLabel id="bins-per-octave-label">Bins per Octave</FormLabel>
                                <div>
                                    <Input
                                        type="number"
                                        id="bins-per-octave"
                                        value={binsPerOctave}
                                        onChange={handleBinsPerOctaveChange}
                                        onKeyDown={handleKeyDownBins}
                                        className="input-field"
                                    />
                                    <button onClick={submitBins} className="submit-btn">
                                        Submit
                                    </button>
                                </div>
                            </FormControl>
                        )}
                    </Box>
                )}
            </Box>
        </FormControl>
    );
}

export default SpecType;



