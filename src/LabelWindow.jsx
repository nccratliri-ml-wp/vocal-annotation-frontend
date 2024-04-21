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
    checkIfEveryObjectIsInactive
} from "./species.js";

function LabelWindow ( { speciesArray, labels, expandedLabel, passLabelsToScalableSpec, passExpandedLabelToScalableSpec, getAllIndividualIDs } ){
    // To-do:
    // 1. Implement change Species and Clustername method
    // on click activate clicked and deactivate the others
    // Move helper methods to species.js
    // Allow multiple windows to coexist or close the previous one after a new one has been opened.
    // Window Design
    // Test thoroughly

    // Creating a local copy of speciesArray. I do this so the user can activate species, individuals in the video separately from AnnotationLabels.jsx
    const [localSpeciesArray, setLocalSpeciesArray] = useState(updateLocalSpeciesArrayFromOriginal)

    const updatedLabel = new Label(
        expandedLabel.id,
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
        setLocalSpeciesArray(updatedLocalSpeciesArray)
    }


    function updateLocalSpeciesArrayFromOriginal() {
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

    // When the user makes changes in AnnotationLabels Component, update the localSpeciesArray
    useEffect( () => {
        if (!speciesArray) return
        const updatedLocalSpeciesArray = updateLocalSpeciesArrayFromOriginal()
        setLocalSpeciesArray(updatedLocalSpeciesArray)
    }, [speciesArray])


    return (
        <div
            className='label-window'
            onContextMenu={ (event) => event.preventDefault()}
            style={{
                top: 400,
                left: 400
            }}
        >
            <div className='label-window-annotation-labels-menu'>

                {
                    localSpeciesArray.map( (species) =>
                        <div
                            key={species.id}
                        >
                            {species.name}

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
                                            style={{
                                                borderLeft: `2px solid ${clustername.color}`,
                                                backgroundColor: clustername.isActive? clustername.color : INACTIVE_BUTTON_COLOR
                                            }}
                                            onClick={ () => changeClustername(species, clustername) }
                                        >
                                            {clustername.name}
                                        </div>
                                    )
                                }
                            </div>

                        </div>
                    )
                }
            </div>
            <button onClick={ () => passExpandedLabelToScalableSpec(null) }>Close</button>
        </div>
    )
}

export default LabelWindow