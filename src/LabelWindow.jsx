// React
import React, {useEffect, useState} from "react";

// External dependencies
import axios from "axios";
import {toast} from "react-toastify";
import Draggable from "react-draggable";
import DownloadIcon from '@mui/icons-material/Download'
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DensityLargeIcon from '@mui/icons-material/DensityLarge';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Box from "@mui/material/Box";
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ClearIcon from '@mui/icons-material/Clear';
const FREQUENCY_LINES_COLOR = '#47ff14'

// Internal dependencies
import {Label} from "./label.js"
import {
    Species,
    Individual,
    Clustername,
    activateIndividual,
    activateClustername,
    deactivateExistingIndividuals,
    deactivateExistingClusternames,
    checkIfEveryObjectIsInactive,
    INACTIVE_BUTTON_COLOR,
    UNKNOWN_CLUSTERNAME,
    UNKNOWN_INDIVIDUAL,
    ANNOTATED_AREA, UNKNOWN_SPECIES
} from "./species.js";
import {iconSmall, iconBtnDisabled} from "./buttonStyles.js";
import {excludeNonDigits} from "./utils.js";
import { Margin } from "@mui/icons-material";

function LabelWindow(
                        {
                            speciesArray,
                            labels,
                            expandedLabel,
                            passLabelsToTrack,
                            passExpandedLabelToTrack,
                            getAllIndividualIDs,
                            globalMouseCoordinates,
                            audioId,
                            getAudio,
                            handleClickFrequencyLinesBtn,
                            handleClickRemoveAnnotatedFreqBtn,
                            numFreqLinesToAnnotate
                        }
                    )
                {

    // Creating a local copy of speciesArray. I do this so the user can activate species, individuals in the video separately from SpeciesMenu.jsx
    const [localSpeciesArray, setLocalSpeciesArray] = useState(updateLocalSpeciesArrayFromOriginal)

    let updatedLabel = new Label(
        expandedLabel.id,
        expandedLabel.trackID,
        expandedLabel.filename,
        expandedLabel.onset,
        expandedLabel.offset,
        expandedLabel.minFreq,
        expandedLabel.maxFreq,
        expandedLabel.species,
        expandedLabel.individual,
        expandedLabel.clustername,
        expandedLabel.speciesID,
        expandedLabel.individualID,
        expandedLabel.clusternameID,
        expandedLabel.individualIndex,
        expandedLabel.annotator,
        expandedLabel.color
    )

    const [minFreqInput, setMinFreqInput] = useState(expandedLabel.minFreq)
    const [maxFreqInput, setMaxFreqInput] = useState(expandedLabel.maxFreq)

    const changeSpecies = (clickedSpecies) => {
        updatedLabel.species = clickedSpecies.name
        updatedLabel.speciesID = clickedSpecies.id
    }

    const changeIndividual = (clickedIndividual) => {
        const allIndividualIDs = getAllIndividualIDs(speciesArray)
        updatedLabel.individual = clickedIndividual.name
        updatedLabel.individualID = clickedIndividual.id
        updatedLabel.individualIndex = allIndividualIDs.indexOf(clickedIndividual.id)
    }

    const changeClustername = (clickedClustername) => {
        updatedLabel.clustername = clickedClustername.name
        updatedLabel.clusternameID = clickedClustername.id
        updatedLabel.color = clickedClustername.color
    }


    const handleClickOnIndividual = (clickedSpecies, clickedIndividual) => {
        // Apply the changes to updatedLabel
        changeSpecies(clickedSpecies)
        changeIndividual(clickedIndividual)

        /* When the user clicks on the individual of a different species, change the clustername to Unknown. This is to prevent
        an individual from keeping a clustername from another species */
        if (clickedSpecies.id !== expandedLabel.speciesID){
            changeClustername(clickedSpecies.clusternames[0])
        }

        // Apply changes to labels
        const updatedLabels = labels.filter( label => label.id !== expandedLabel.id)
        updatedLabels.push(updatedLabel)
        passLabelsToTrack(updatedLabels)
        passExpandedLabelToTrack(updatedLabel)

        // Update local species Array
        const updatedLocalSpeciesArray = localSpeciesArray.map(speciesObj => {
            if (speciesObj.id === clickedSpecies.id){

                // Activate selected individual, deactivate all others
                const updatedIndividuals = activateIndividual(speciesObj.individuals, clickedIndividual.name)

                // Activate Unknown clustername, only if all other clusternames are inactive (this happens when the user switches species)
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObj.individuals)
                    ? activateClustername(speciesObj.clusternames, UNKNOWN_CLUSTERNAME)
                    : speciesObj.clusternames

                return new Species(
                    speciesObj.id,
                    speciesObj.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObj.minFreq,
                    speciesObj.maxFreq
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObj.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObj.clusternames)
                return new Species(
                    speciesObj.id,
                    speciesObj.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObj.minFreq,
                    speciesObj.maxFreq
                )
            }
        })
        setLocalSpeciesArray(updatedLocalSpeciesArray)
    }

    const handleClickOnClustername = (clickedSpecies, clickedClustername) => {
        // Apply the changes to updatedLabel
        changeSpecies(clickedSpecies)
        changeClustername(clickedClustername)

        /* When the user clicks on the clustername of a different species, change the Individual to Unknown. This is to prevent
        a clustername from keeping an individual from another species */
        if (clickedSpecies.id !== expandedLabel.speciesID){
            changeIndividual(clickedSpecies.individuals[0])
        }

        // Apply changes to labels
        const updatedLabels = labels.filter( label => label.id !== expandedLabel.id)
        updatedLabels.push(updatedLabel)
        passLabelsToTrack(updatedLabels)
        passExpandedLabelToTrack(updatedLabel)


        const modifiedSpeciesArray = speciesArray.map(speciesObj => {
            if (speciesObj.id === clickedSpecies.id) {

                // Activate selected clustername, deactivate all others
                const updatedClusternames = activateClustername(speciesObj.clusternames, clickedClustername.name)

                // Activate Unknown individual, only if all other Individuals are inactive (this happens when the user switches species)
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObj.individuals)
                    ? activateIndividual(speciesObj.individuals, UNKNOWN_INDIVIDUAL)
                    : speciesObj.individuals

                return new Species(
                    speciesObj.id,
                    speciesObj.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObj.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObj.clusternames)
                return new Species(
                    speciesObj.id,
                    speciesObj.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })

        setLocalSpeciesArray(modifiedSpeciesArray)
    }


    function updateLocalSpeciesArrayFromOriginal() {
        // I chose function declaration for this to use JS function hoisting because I use this function at run-time to set localSpeciesArray on mount
        return speciesArray.map( speciesObj => {

            const updatedIndividuals = speciesObj.individuals.map( individual => {
                if (individual.id === expandedLabel.individualID){
                    const activatedIndividual = new Individual(individual.id, individual.name )
                    activatedIndividual.isActive = true
                    return activatedIndividual
                } else {
                    const deactivatedIndividual = new Individual(individual.id, individual.name )
                    deactivatedIndividual.isActive = false
                    return deactivatedIndividual
                }
            })

            const updatedClusternames = speciesObj.clusternames.map( clustername => {
                if (clustername.id === expandedLabel.clusternameID){
                    const activatedClustername = new Clustername(clustername.id, clustername.name, clustername.color )
                    activatedClustername.isActive = true
                    return activatedClustername
                } else {
                    const deactivatedClustername = new Clustername(clustername.id, clustername.name, clustername.color )
                    deactivatedClustername.isActive = false
                    return deactivatedClustername
                }
            })

            return new Species(
                speciesObj.id,
                speciesObj.name,
                [...updatedIndividuals],
                [...updatedClusternames]
            )
        })
    }

    /* ++++++++++++++++++ Audio Download ++++++++++++++++++ */

    const downloadAudioClip = async (newStartTime, newClipDuration) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-wav'
        try {
            const response = await axios.post(path, {
                audio_id: audioId,
                start_time: newStartTime,
                clip_duration: newClipDuration
            })
            const audioBase64 = response.data.wav

            // Decode the base64 string to binary data
            const binaryString = atob(audioBase64)
            const len = binaryString.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            // Create a Blob from the binary data
            const blob = new Blob([bytes], { type: 'audio/wav' })

            // Create a temporary URL for the Blob
            const url = URL.createObjectURL(blob)

            // Create a temporary anchor element and trigger the download
            const a = document.createElement('a')
            a.href = url
            a.download = 'audio_clip.wav' // Set the desired file name here
            document.body.appendChild(a)
            a.click()

            // Clean up by revoking the object URL and removing the anchor element
            URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            toast.error('Something went wrong trying to download the audio clip. Check the console for more information.')
            console.error("Error fetching audio clip:", error)
        }
    }

    /* ++++++++++++++++++ Frequencies ++++++++++++++++++ */

    const handleMinFreqInputChange = (event) => {
        setMinFreqInput(event.target.value)
    }

    const handleMaxFreqInputChange = (event) => {
        setMaxFreqInput(event.target.value)
    }

    const saveFreqChanges = () => {
        updatedLabel.minFreq = Number(minFreqInput)
        updatedLabel.maxFreq = Number(maxFreqInput)

        // Apply changes to labels
        const updatedLabels = labels.filter( label => label.id !== expandedLabel.id)
        updatedLabels.push(updatedLabel)
        passLabelsToTrack(updatedLabels)
        passExpandedLabelToTrack(null)
    }


    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    // When the user makes changes in SpeciesMenu Component or clicks on a different label in the spectrogram, update the localSpeciesArray
    useEffect( () => {
        if (!speciesArray) return
        const updatedLocalSpeciesArray = updateLocalSpeciesArrayFromOriginal()
        setLocalSpeciesArray(updatedLocalSpeciesArray)

        setMinFreqInput(expandedLabel.minFreq)
        setMaxFreqInput(expandedLabel.maxFreq)
    }, [speciesArray, expandedLabel])


    return (
        <Draggable cancel='.label-window-audio-btn-container, .label-window-content, .label-window-frequencies-container'>
            <div
                className='label-window'
                onContextMenu={ (event) => event.preventDefault()}
                style={{
                    top: globalMouseCoordinates.y + 20,
                    left: globalMouseCoordinates.x + 20
                }}
            >
                <div className='close-btn-container'>
                    <button className='close-btn' onClick={ () => passExpandedLabelToTrack(null) }>✖</button>
                    <p className='window-header'>Reassign label</p>
                </div>

                <div className='label-window-controls-container'>
                    {/* <div className='label-window-audio-btn' onClick={ () => getAudio(expandedLabel.onset, expandedLabel.offset - expandedLabel.onset) }>
                        <DensityLargeIcon style={iconSmall}/>
                        Annotate Frequency
                    </div> */}
                    <div className='label-window-icon-btn'>
                        <Tooltip title="Annotate Frequency">
                            <Badge badgeContent={numFreqLinesToAnnotate} color="primary" anchorOrigin={{
                                   vertical: 'top',
                                   horizontal: 'right'
                                }}>
                                    <IconButton
                                        style={{...iconSmall, ...({ paddingTop: '20px', paddingBottom: '20px', paddingLeft: '8px', paddingRight: '8px' }), ...(expandedLabel.minFreq!=='' && iconBtnDisabled) }}
                                        onClick={()=>{handleClickFrequencyLinesBtn()}}
                                        disabled={expandedLabel.minFreq!==''}
                                    >
                                        <DensityLargeIcon  />
                                    </IconButton>
                            </Badge>
                        </Tooltip>
                    </div>
                    <div className='label-window-icon-btn' 
                         style={{ marginLeft: '5px' }}
                    >
                        <Tooltip title="Remove Annotated Frequency">
                                    <IconButton
                                        style={{...iconSmall, ...({ paddingTop: '20px', paddingBottom: '20px', paddingLeft: '8px', paddingRight: '8px' }), ...(expandedLabel.minFreq==='' && iconBtnDisabled) }}
                                        onClick={()=>{handleClickRemoveAnnotatedFreqBtn()}}
                                        disabled={expandedLabel.minFreq===''}
                                    >
                                        <DeleteSweepIcon  />
                                    </IconButton>
                        </Tooltip>
                    </div>
                    <div className='label-window-frequencies-container'>                        
                        <div className='label-window-frequencies-labels-container'
                            style={{ fontSize: '12px' }}>
                            <label className='label-window-frequencies-label'>
                                Min Freq:  { expandedLabel.minFreq} { expandedLabel.minFreq!=='' && "Hz"}
                                {/* <input
                                    type="number"
                                    value={minFreqInput}
                                    min={0}
                                    onChange={handleMinFreqInputChange}
                                    onKeyPress={excludeNonDigits}
                                    onFocus={(event) => event.target.select()}
                                    onPaste={(event) => event.preventDefault()}
                                /> */}
                            </label>
                            <label className='label-window-frequencies-label'>
                                Max Freq: { expandedLabel.maxFreq} { expandedLabel.maxFreq!=='' && "Hz"}
                                {/* <input
                                    type="number"
                                    value={maxFreqInput}
                                    min={0}
                                    onChange={handleMaxFreqInputChange}
                                    onKeyPress={excludeNonDigits}
                                    onFocus={(event) => event.target.select()}
                                    onPaste={(event) => event.preventDefault()}
                                /> */}
                            </label>
                        </div>
                        {/* <button className='label-window-frequencies-save-btn' onClick={saveFreqChanges}>Save</button> */}
                    </div>
                </div>

                <div className='label-window-controls-container'>
                    <div className='label-window-audio-btn' onClick={ () => getAudio(expandedLabel.onset, expandedLabel.offset - expandedLabel.onset) }>
                        <PlayArrowIcon style={iconSmall}/>
                        Play Audio
                    </div>
                    <div className='label-window-audio-btn' onClick={ () => downloadAudioClip(expandedLabel.onset, expandedLabel.offset - expandedLabel.onset) }>
                        <DownloadIcon style={iconSmall}/>
                        Download Audio
                    </div>
                </div>

                <div className='label-window-content'>

                    {
                        localSpeciesArray.map( (species) => {

                            // Don't render Annotated Area "species" in the label window
                            if (species.name === ANNOTATED_AREA) return

                            // Render all other species
                            return (
                                <fieldset
                                    key={species.id}
                                    className='label-window-species'
                                >

                                    <legend>
                                        {species.name === UNKNOWN_SPECIES ? `${UNKNOWN_SPECIES} Species` : species.name}
                                    </legend>

                                    <div className='label-window-individual-btn-container'>
                                        Individuals:
                                        {
                                            species.individuals.map( individual =>
                                                <div
                                                    key={individual.id}
                                                    isactive={individual.isActive.toString()}
                                                    className='label-window-individual-btn'
                                                    onClick={ () => handleClickOnIndividual(species, individual) }
                                                >
                                                    {individual.name}
                                                </div>
                                            )
                                        }
                                    </div>

                                    <div className='label-window-clustername-btn-container'>
                                        Clusternames:
                                        {
                                            species.clusternames.map( clustername =>
                                                <div
                                                    key={clustername.id}
                                                    className='label-window-clustername-btn'
                                                    isactive={clustername.isActive.toString()}
                                                    onClick={ () => handleClickOnClustername(species, clustername) }
                                                    style={{
                                                        borderLeft: `2px solid ${clustername.color}`,
                                                        backgroundColor: clustername.isActive? clustername.color : INACTIVE_BUTTON_COLOR
                                                    }}
                                                >
                                                    {clustername.name}
                                                </div>
                                            )
                                        }
                                    </div>

                                </fieldset>
                                )
                            }
                        )
                    }

                </div>
            </div>
        </Draggable>
    )
}

export default LabelWindow