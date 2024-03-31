import React, {useState} from "react";
import { nanoid } from 'nanoid'

class Species {
    constructor(id, name, individuals, clusternames) {
        this.id = id
        this.name = name
        this.individuals = individuals
        this.clusternames = clusternames
    }
}

function AnnotationLabels () {

    const [speciesArray, setSpeciesArray] = useState([
        new Species(nanoid(),'Unknown', ['Unknown'], ['Unknown'])
    ])

    const addNewSpecies = () => {
        setSpeciesArray( prevState => [...prevState, new Species(nanoid(), 'New Species', ['Unknown'], ['Unknown'])] )
    }

    const addNewIndividual = (selectedID) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                return {
                    ...speciesObject,
                    individuals: [...speciesObject.individuals, 'My Individual']
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const addNewClustername = (selectedID) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                return {
                    ...speciesObject,
                    clusternames: [...speciesObject.clusternames, 'My Clustername']
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }


    return(
        <div id='annotation-labels-container'>
            <button onClick={addNewSpecies}>Add New Species</button>
            {
                speciesArray.map( species =>
                    <div
                        id={species.id}
                        key={species.id}
                        className='species'
                    >
                        {species.name}
                        {
                            species.individuals.map( individual =>
                                <div
                                    key={nanoid()}
                                    className='individual-btn'
                                >
                                    {individual}
                                </div>
                            )
                        }
                        <button onClick={() => addNewIndividual(species.id)}>Add new Individual</button>
                        {
                            species.clusternames.map( clustername =>
                                <div
                                    key={nanoid()}
                                    className='clustername-btn'
                                >
                                    {clustername}
                                </div>
                            )
                        }
                        <button onClick={() => addNewClustername(species.id)}>Add new Clustername</button>
                    </div>
                )
            }
        </div>
    )
}

export default AnnotationLabels