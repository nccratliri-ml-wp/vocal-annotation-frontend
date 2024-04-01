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

    const [newSpeciesInputFieldText, setNewSpeciesInputFieldText] = useState('')

    const [speciesArray, setSpeciesArray] = useState([
        new Species(nanoid(),'Unknown Species', ['Unknown'], ['Unknown'])
    ])

    const addNewSpecies = (event) => {
        event.preventDefault()
        setSpeciesArray( prevState => [...prevState, new Species(nanoid(), newSpeciesInputFieldText, ['Unknown'], ['Unknown'])] )
        setNewSpeciesInputFieldText('')
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

    const deleteSpecies = (selectedID) => {
        const modifiedSpeciesArray = speciesArray.filter(speciesObject => speciesObject.id !== selectedID)
        setSpeciesArray(modifiedSpeciesArray)
    }

    const deleteIndividual = (event, selectedID, selectedIndividual) => {
        event.preventDefault()

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const updatedIndividuals = speciesObject.individuals.filter( individual => individual !== selectedIndividual)
                return {
                    ...speciesObject,
                    individuals: updatedIndividuals
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const deleteClustername = (event, selectedID, selectedClustername) => {
        event.preventDefault()

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const updatedClustername = speciesObject.clusternames.filter( clustername => clustername !== selectedClustername)
                return {
                    ...speciesObject,
                    clusternames: updatedClustername
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }


    return(
        <div id='annotation-labels-container'>

            <div id='annotation-labels-menu'>

                {
                    speciesArray.map( species =>
                        <div
                            id={species.id}
                            key={species.id}
                            className='species'
                        >
                            {species.name}
                            {speciesArray.indexOf(species) !== 0 && <button onClick={() => deleteSpecies(species.id)}>🗑️</button>}

                            <div className='individual-btn-container'>
                                {
                                    species.individuals.map( individual =>
                                        <div
                                            key={nanoid()}
                                            className='individual-btn'
                                            onContextMenu={ (event) => deleteIndividual(event, species.id, individual)}
                                        >
                                            {individual}
                                        </div>
                                    )
                                }
                                <button onClick={() => addNewIndividual(species.id)}>Add new Individual</button>
                            </div>

                            <div className='clustername-btn-container'>
                            {
                                species.clusternames.map( clustername =>
                                    <div
                                        key={nanoid()}
                                        className='clustername-btn'
                                        onContextMenu={ (event) => deleteClustername(event, species.id, clustername)}
                                    >
                                        {clustername}
                                    </div>
                                )
                            }
                                <button onClick={() => addNewClustername(species.id)}>Add new Clustername</button>
                            </div>

                        </div>
                    )
                }

            </div>

            <form onSubmit={addNewSpecies}>
                <input
                    type='text'
                    required='required'
                    pattern='^[^,]{1,30}$'
                    title='No commas allowed. Max length 30 characters'
                    value={newSpeciesInputFieldText}
                    placeholder='Add a new Species'
                    onChange={ (event) => setNewSpeciesInputFieldText(event.target.value) }
                />
            </form>

        </div>
    )
}

export default AnnotationLabels