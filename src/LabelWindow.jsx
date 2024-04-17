import React from "react";
import {Label} from "./label.js"

function LabelWindow ( { speciesArray, labels, expandedLabel, passLabelsToScalableSpec, passExpandedLabelToScalableSpec, getAllIndividualIDs } ){
    // To-do:
    // 1. Implement change Species and Clustername method
    // Save all changes temporaily,
    // create and pass the new labels array upon clicking the submit button
    // setExpandedLabel(null)
    // Close the window

    const changeIndividual = (clickedIndividual) => {

        const allIndividualIDs = getAllIndividualIDs()

        const updatedLabels = labels.map( label => {
            if (label === expandedLabel){
                return new Label(
                    label.onset,
                    label.offset,
                    label.species,
                    clickedIndividual.name,
                    label.clustername,
                    label.speciesID,
                    clickedIndividual.id,
                    label.clusternameID,
                    allIndividualIDs.indexOf(clickedIndividual.id),
                    label.annotator,
                    label.color
                )
            } else {
                return label
            }
        })

        passLabelsToScalableSpec(updatedLabels)
    }

    return (
        <div className='label-window'>
            <div id='annotation-labels-menu'>

                {
                    speciesArray.map( (species) =>
                        <div
                            id={species.id}
                            key={species.id}
                        >
                            {species.name}

                            <div className='individual-btn-container'>
                                Individuals:
                                {
                                    species.individuals.map( individual =>
                                        <div
                                            key={individual.id}
                                            onClick={ () => changeIndividual(individual)}
                                        >
                                            {individual.name}
                                        </div>
                                    )
                                }
                            </div>

                            <div className='clustername-btn-container'>
                                Clusternames:
                                {
                                    species.clusternames.map( clustername =>
                                        <div
                                            key={clustername.id}
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
            <button >Submit</button>
            <button onClick={() => passExpandedLabelToScalableSpec(false) }>Close</button>
        </div>
    )
}

export default LabelWindow