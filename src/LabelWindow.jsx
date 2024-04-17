import React from "react";
import {Label} from "./label.js"

function LabelWindow ( { speciesArray, labels, expandedLabel, passLabelsToScalableSpec, passExpandedLabelToScalableSpec, getAllIndividualIDs } ){
    // To-do:
    // 1. Implement change Species and Clustername method
    // Save all changes temporaily,
    // create and pass the new labels array upon clicking the submit button
    // setExpandedLabel(null)
    // Close the window

    const allIndividualIDs = getAllIndividualIDs()

    const updatedLabel = new Label(
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

    const changeIndividual = (clickedIndividual) => {
        updatedLabel.individual = clickedIndividual.name
        updatedLabel.individualID = clickedIndividual.id
        updatedLabel.individualIndex = allIndividualIDs.indexOf(clickedIndividual.id)
    }

    const changeSpecies = (clickedSpecies) => {
        updatedLabel.species = clickedSpecies.name
        updatedLabel.speciesID = clickedSpecies.id
    }

    const submit = () => {
        const updatedLabels = labels.filter( label => label !== expandedLabel)
        updatedLabels.push(updatedLabel)

        passLabelsToScalableSpec(updatedLabels)
        passExpandedLabelToScalableSpec(null)
    }

    return (
        <div
            className='label-window'
            style={{
                top: 400,
                left: 400
            }}
        >
            <div id='annotation-labels-menu'>

                {
                    speciesArray.map( (species) =>
                        <div
                            key={species.id}
                            onClick={ () => changeSpecies(species)}
                        >
                            {species.name}

                            <div className='individual-btn-container'>
                                Individuals:
                                {
                                    species.individuals.map( individual =>
                                        <button
                                            key={individual.id}
                                            onClick={ () => changeIndividual(individual)}
                                        >
                                            {individual.name}
                                        </button>
                                    )
                                }
                            </div>

                            <div className='clustername-btn-container'>
                                Clusternames:
                                {
                                    species.clusternames.map( clustername =>
                                        <button
                                            key={clustername.id}
                                        >
                                            {clustername.name}
                                        </button>
                                    )
                                }
                            </div>

                        </div>
                    )
                }
            </div>
            <button onClick={submit}>Submit</button>
            <button onClick={ () => passExpandedLabelToScalableSpec(false) }>Cancel</button>
        </div>
    )
}

export default LabelWindow