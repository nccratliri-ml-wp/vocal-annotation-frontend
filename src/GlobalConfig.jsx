// React
import React, {useState, useEffect} from "react";

// External dependencies
import {toast} from "react-toastify";
import Draggable from "react-draggable";
import { Box, Button, Icon } from "@mui/material";
import ModuleTitle from "./ModuleTitle";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import IconButton from '@mui/material/IconButton';
import { Tooltip } from "@mui/material";
import StarIcon from '@mui/icons-material/Star'; // Example icon
import FavoriteIcon from '@mui/icons-material/Favorite'; // Example icon
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Slider from '@mui/material/Slider';
import LineStyleIcon from '@mui/icons-material/LineStyle';

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
                strictMode,
                specCanvasHeight,
                setSpecCanvasHeight,
                showAllWaveforms,
                setShowAllWaveforms,
                showAllLabels,
                setShowAllLabels
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

    const increaseSpecHeight = ()=>{
        setSpecCanvasHeight( Math.min( specCanvasHeight + 10, 300 ) )
    }

    const decreaseSpecHeight = ()=>{
        setSpecCanvasHeight( Math.max( specCanvasHeight - 10, 50 ) )
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
        <Draggable cancel='#global-config-window-non-drag-content'>
            <div id='global-config-window'>
                <div className='close-btn-container'>
                    <button className='close-btn' onClick={ () => passShowGlobalConfigWindowToApp(false) }>✖</button>
                    <p className='window-header'>Global Configurations</p>
                </div>
                <Box id="global-config-window-non-drag-content" display={"flex"} flexDirection={"column"} width="100vw" >
                    <div style={{"paddingLeft":"40px"}}> <ModuleTitle text="Spectrogram Calculation" /> </div>
                    <Box style={{"width":"380px", "marginLeft":"10px", "marginTop":"10px"}} >
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
                    </Box>
                    <Box display="flex" flexDirection="row" justifyContent={"flex-end"} style={{"width":"380px", "marginTop":"10px", "marginLeft":"10px"}} >
                        <Button style={{"marginRight":"10px"}} variant="contained" disabled={strictMode} onClick={restoreDefaultValues}>Restore Default Values</Button>
                        <Button variant="contained" disabled={strictMode} onClick={submitGlobalParameters}>Apply</Button>
                    </Box>
                    <div style={{"paddingLeft":"100px", "paddingTop":"10px"}}> <ModuleTitle text="Display" /> </div>
                    <Box style={{"paddingLeft":"10px"}} display={"flex"} alignItems={"center"}>Spectrogram Height 
                        <Box style={{"paddingLeft":"120px", "paddingTop":"7px"}}>  
                            {/* <Tooltip title="Increase"> <IconButton variant="contained" onClick={increaseSpecHeight} ><AddIcon style={{"color":"white"}}/></IconButton> </Tooltip> */}
                            <Slider
                                value={specCanvasHeight}
                                onChange={(event, newValue)=>{setSpecCanvasHeight(newValue)}}
                                min={50}
                                max={300}
                                step={1} // Ensures only integer values
                                valueLabelDisplay="auto" // Shows the value label on hover or drag
                                style={{"width":"100px"}}
                            />
                            {/* <Tooltip title="Decrease"> <IconButton variant="contained" onClick={decreaseSpecHeight} ><RemoveIcon style={{"color":"white"}}/></IconButton> </Tooltip> */}
                        </Box> 
                    </Box>
                    <Box style={{"paddingLeft":"10px", "paddingBottom":"20px"}} display={"flex"} alignItems={"center"}>{showAllWaveforms?"Hide All Waveforms":"Show All Waveforms"}
                        <Box style={{"paddingLeft": showAllWaveforms? "125px":"118px"}}> 
                            <Tooltip title={showAllWaveforms?"Hide":"Show"}> 
                                <IconButton
                                    style={{
                                        position: 'relative',
                                        paddingBottom: "15px"
                                    }}
                                    onClick={ ()=>{ setShowAllWaveforms( !showAllWaveforms ) } }
                                    >
                                    {/* First Icon */}
                                    <GraphicEqIcon
                                        style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        // fontSize: '24px',
                                        color: "white"
                                        }}
                                    />
                                    {/* Second Icon */}
                                    { showAllWaveforms?
                                        <VisibilityOffIcon
                                            style={{
                                            position: 'absolute',
                                            top: '-5',
                                            left: '15px', // Adjust for overlap
                                            fontSize: '16px',
                                            color: "white"
                                            }}
                                        />:
                                        <VisibilityIcon
                                            style={{
                                            position: 'absolute',
                                            top: '-5',
                                            left: '15px', // Adjust for overlap
                                            fontSize: '16px',
                                            color: "white"
                                            }}
                                        />
                                    }
                                </IconButton>
                            </Tooltip>
                        </Box> 
                    </Box>
                    <Box style={{"paddingLeft":"10px", "paddingBottom":"20px"}} display={"flex"} alignItems={"center"}>{showAllLabels?"Hide All Annotations":"Show All Annotations"}
                        <Box style={{"paddingLeft": showAllLabels? "120px":"113px"}}> 
                            <Tooltip title={showAllLabels?"Hide":"Show"}> 
                                <IconButton
                                    style={{
                                        position: 'relative',
                                        paddingBottom: "15px"
                                    }}
                                    onClick={ ()=>{ setShowAllLabels( !showAllLabels ) } }
                                    >
                                    {/* First Icon */}
                                    <LineStyleIcon
                                        style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        // fontSize: '24px',
                                        color: "white"
                                        }}
                                    />
                                    {/* Second Icon */}
                                    { showAllLabels?
                                        <VisibilityOffIcon
                                            style={{
                                            position: 'absolute',
                                            top: '-5',
                                            left: '15px', // Adjust for overlap
                                            fontSize: '16px',
                                            color: "white"
                                            }}
                                        />:
                                        <VisibilityIcon
                                            style={{
                                            position: 'absolute',
                                            top: '-5',
                                            left: '15px', // Adjust for overlap
                                            fontSize: '16px',
                                            color: "white"
                                            }}
                                        />
                                    }
                                </IconButton>
                            </Tooltip>
                        </Box> 
                    </Box>



                </Box>
            </div>




            {/* <Box display="flex" flexDirection="column" width="100vw">
                <Box display="flex" flexDirection="row" >
                    <div id='global-config-window'>

                        <div className='close-btn-container'>
                            <button className='close-btn' onClick={ () => passShowGlobalConfigWindowToApp(false) }>✖</button>
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
                                <button id='global-config-submit-btn' disabled={strictMode} onClick={submitGlobalParameters}>Apply</button>
                            </div>

                        </div>
                    </div>
                </Box>

            </Box> */}

        </Draggable>
    )
}

export default GlobalConfig