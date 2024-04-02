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

// Global variables
const UNKNOWN_SPECIES = 'Unknown Species'
const UNKNOWN_INDIVIDUAL = 'Unknown Individual'
const UNKNOWN_CLUSTERNAME = 'Unknown Clustername'

function AnnotationLabels () {

    const [newSpeciesInputFieldText, setNewSpeciesInputFieldText] = useState('')
    const [newClusternameInputFieldTexts, setNewClusternameInputFieldTexts] = useState([])

    const [speciesArray, setSpeciesArray] = useState([
        new Species(nanoid(),UNKNOWN_SPECIES, [UNKNOWN_INDIVIDUAL], [UNKNOWN_CLUSTERNAME])
    ])


    /* ++++++++++++++++++++ Species ++++++++++++++++++++ */

    const addNewSpecies = (event) => {
        event.preventDefault()

        setNewSpeciesInputFieldText('')

        const allSpeciesNames = speciesArray.map( speciesObject => speciesObject.name )
        if (checkIfItemAlreadyExists(newSpeciesInputFieldText, allSpeciesNames)) return

        setSpeciesArray( prevState => [...prevState, new Species(nanoid(), newSpeciesInputFieldText, [UNKNOWN_INDIVIDUAL], [UNKNOWN_CLUSTERNAME])] )
    }

    const deleteSpecies = (selectedID) => {
        const modifiedSpeciesArray = speciesArray.filter(speciesObject => speciesObject.id !== selectedID)
        setSpeciesArray(modifiedSpeciesArray)
    }


    /* ++++++++++++++++++++ Individuals ++++++++++++++++++++ */

    const addNewIndividual = (selectedID) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const newIndividualNumber = speciesObject.individuals.length
                return {
                    ...speciesObject,
                    individuals: [...speciesObject.individuals, `Ind. ${newIndividualNumber}`]
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const deleteIndividual = (event, selectedID, selectedIndividual) => {
        event.preventDefault()

        if (selectedIndividual === UNKNOWN_INDIVIDUAL) return

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


    /* ++++++++++++++++++++ Clusternames ++++++++++++++++++++ */

    const addNewClustername = (event, selectedID, index) => {
        event.preventDefault()

        const newClustername = newClusternameInputFieldTexts[index]

        // Update the correct input field
        const updatedClusternameInputFieldTexts = [...newClusternameInputFieldTexts]
        updatedClusternameInputFieldTexts[index] = ''
        setNewClusternameInputFieldTexts(updatedClusternameInputFieldTexts)

        // Update species Array
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                if ( checkIfItemAlreadyExists(newClusternameInputFieldTexts[index], speciesObject.clusternames) ) {
                    return speciesObject
                }

                return {
                    ...speciesObject,
                    clusternames: [...speciesObject.clusternames, newClustername]
                }
            } else {
                return speciesObject
            }
        })
        setSpeciesArray(modifiedSpeciesArray)
    }



    const handleClusternameInputChange = (event, index) => {
        const updatedClusternameInputFieldTexts = [...newClusternameInputFieldTexts]
        updatedClusternameInputFieldTexts[index] = event.target.value
        setNewClusternameInputFieldTexts(updatedClusternameInputFieldTexts)
    }

    const deleteClustername = (event, selectedID, selectedClustername) => {
        event.preventDefault()

        if (selectedClustername === UNKNOWN_CLUSTERNAME) return

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const updatedClusternames = speciesObject.clusternames.filter( clustername => clustername !== selectedClustername)
                return {
                    ...speciesObject,
                    clusternames: updatedClusternames
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const editClustername = (selectedID, selectedClustername) => {
        const editedClustername = prompt('Change clustername: ')

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                if ( checkIfItemAlreadyExists(editedClustername, speciesObject.clusternames) ) {
                    return speciesObject
                }

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    return clustername === selectedClustername ? editedClustername : clustername
                })

                return {
                    ...speciesObject,
                    clusternames: updatedClusternames
                }

            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }


    /* ++++++++++++++++++++ Helper methods ++++++++++++++++++++ */

    const checkIfItemAlreadyExists = ( newItem, array ) => {
        for (let item of array){
            if (item === newItem){
                alert(`${newItem} already exists. Add a different one.`)
                return true
            }
        }
    }


    return(
        <div id='annotation-labels-container'>

            <div id='annotation-labels-menu'>

                {
                    speciesArray.map( (species, index) =>
                        <div
                            id={species.id}
                            key={species.id}
                            className='species'
                        >
                            {species.name}
                            {species.name !== UNKNOWN_SPECIES && <button onClick={() => deleteSpecies(species.id)}>🗑️</button>}

                            <div className='individual-btn-container'>
                                {
                                    species.individuals.map( individual =>
                                        <div
                                            key={`${species.id}-${individual}`}
                                            className='individual-btn'
                                        >
                                            <div
                                                onContextMenu={ (event) => deleteIndividual(event, species.id, individual)}
                                            >
                                                {individual}
                                            </div>
                                        </div>
                                    )
                                }
                                <button onClick={() => addNewIndividual(species.id)}>➕</button>
                            </div>

                            <div className='clustername-btn-container'>
                                {
                                    species.clusternames.map( clustername =>
                                        <div
                                            key={`${species.id}-${clustername}`}
                                            className='clustername-btn'
                                        >
                                            <div
                                                onContextMenu={ (event) => deleteClustername(event, species.id, clustername)}
                                            >
                                                {clustername}
                                            </div>
                                            {
                                                clustername !== UNKNOWN_CLUSTERNAME &&
                                                <button
                                                    className='edit-name-btn'
                                                    onClick={ () => editClustername(species.id, clustername) }
                                                    onContextMenu={ (event) => event.preventDefault() }
                                                >
                                                    ✏️
                                                </button>
                                            }
                                        </div>
                                    )
                                }
                                <form onSubmit={ (event) => addNewClustername(event,species.id, index) }>
                                    <input
                                        className='clustername-input-field'
                                        type='text'
                                        required='required'
                                        pattern='^[^,]{1,30}$'
                                        title='No commas allowed. Max length 30 characters'
                                        value={newClusternameInputFieldTexts[index] || ''}
                                        placeholder='Add a new Clustername'
                                        onChange={ (event) => handleClusternameInputChange(event, index) }
                                    />
                                </form>
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