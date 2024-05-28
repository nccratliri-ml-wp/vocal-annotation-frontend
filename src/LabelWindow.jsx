import React, {useEffect, useState} from "react";
import {Label} from "./label.js"
import {
    INACTIVE_BUTTON_COLOR,
    Species,
    Individual,
    Clustername,
    UNKNOWN_CLUSTERNAME,
    activateIndividual,
    activateClustername,
    deactivateExistingIndividuals,
    deactivateExistingClusternames,
    checkIfEveryObjectIsInactive,
    UNKNOWN_INDIVIDUAL,
    ANNOTATED_AREA
} from "./species.js";
import {iconSmall} from "./styles.js";
import PlayArrowIcon from "@mui/icons-material/PlayArrow.js";

function LabelWindow(
                        {
                            speciesArray,
                            labels,
                            expandedLabel,
                            passLabelsToScalableSpec,
                            passExpandedLabelToScalableSpec,
                            getAllIndividualIDs,
                            globalMouseCoordinates,
                            getAudio
                        }
                    )
                {

    // Creating a local copy of speciesArray. I do this so the user can activate species, individuals in the video separately from AnnotationLabels.jsx
    const [localSpeciesArray, setLocalSpeciesArray] = useState(updateLocalSpeciesArrayFromOriginal)

    let updatedLabel = new Label(
        expandedLabel.id,
        expandedLabel.trackID,
        expandedLabel.filename,
        expandedLabel.onset,
        expandedLabel.offset,
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

    const changeSpecies = (clickedSpecies) => {
        updatedLabel.species = clickedSpecies.name
        updatedLabel.speciesID = clickedSpecies.id
    }

    const changeIndividual = (clickedIndividual) => {
        const allIndividualIDs = getAllIndividualIDs()
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
        passLabelsToScalableSpec(updatedLabels)
        passExpandedLabelToScalableSpec(updatedLabel)

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
        passLabelsToScalableSpec(updatedLabels)
        passExpandedLabelToScalableSpec(updatedLabel)


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


    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    // When the user makes changes in AnnotationLabels Component or clicks on a different label in the spectrogram, update the localSpeciesArray
    useEffect( () => {
        if (!speciesArray) return
        const updatedLocalSpeciesArray = updateLocalSpeciesArrayFromOriginal()
        setLocalSpeciesArray(updatedLocalSpeciesArray)
    }, [speciesArray, expandedLabel])


    return (
        <div
            className='label-window'
            onContextMenu={ (event) => event.preventDefault()}
            style={{
                top: globalMouseCoordinates.y + 20,
                left: globalMouseCoordinates.x + 20
            }}
        >
            <div className='close-btn-container'>
                <button className='close-btn' onClick={ () => passExpandedLabelToScalableSpec(null) }>✖</button>
                <p className='window-header'>Reassign label</p>
            </div>

            <div className='window-label-play-btn' onClick={ () => getAudio(expandedLabel.onset, expandedLabel.offset - expandedLabel.onset) }>
                <PlayArrowIcon style={iconSmall}/>
                Playback Section
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
                                    {species.name}
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
    )
}

export default LabelWindow