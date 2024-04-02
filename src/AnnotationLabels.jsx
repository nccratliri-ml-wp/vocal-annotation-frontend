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

class Individual {
    constructor(name) {
        this.name = name
        this.isActive = true
    }
}

class Clustername {
    constructor(name) {
        this.name = name
        this.isActive = true
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
        new Species(nanoid(),UNKNOWN_SPECIES, [ new Individual(UNKNOWN_INDIVIDUAL) ], [ new Clustername(UNKNOWN_CLUSTERNAME) ] )
    ])


    /* ++++++++++++++++++++ Species ++++++++++++++++++++ */

    const addNewSpecies = (event) => {
        event.preventDefault()

        setNewSpeciesInputFieldText('')

        const allSpeciesNames = speciesArray.map( speciesObject => speciesObject.name )
        if (checkIfItemAlreadyExists(newSpeciesInputFieldText, allSpeciesNames)) return

        const newSpeciesObject = new Species(nanoid(), newSpeciesInputFieldText,[ new Individual(UNKNOWN_INDIVIDUAL) ], [ new Clustername(UNKNOWN_CLUSTERNAME) ])
        setSpeciesArray( prevState => [...prevState, newSpeciesObject] )
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
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                return {
                    ...speciesObject,
                    individuals: [...updatedIndividuals, new Individual( `Ind. ${newIndividualNumber}`) ]
                }
            } else {
                return speciesObject
            }
        })

        setSpeciesArray(modifiedSpeciesArray)
    }

    const deleteIndividual = (event, selectedID, selectedIndividual) => {
        event.preventDefault()

        if (selectedIndividual.name === UNKNOWN_INDIVIDUAL) return

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

    const activateIndividual = (selectedID, selectedIndividual) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const updatedIndividuals = speciesObject.individuals.map( individual => {
                    if (individual === selectedIndividual){
                        return {...individual, isActive: true}
                    } else {
                        return {...individual, isActive: false}
                    }
                })
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

    const deactivateExistingIndividuals = (individuals) => {
        return individuals.map(individual => ({
            ...individual,
            isActive: false
        }))
    }


    /* ++++++++++++++++++++ Clusternames ++++++++++++++++++++ */

    const addNewClustername = (event, selectedID, index) => {
        event.preventDefault()

        const newClusternameName = newClusternameInputFieldTexts[index]

        // Update the correct input field
        const updatedClusternameInputFieldTexts = [...newClusternameInputFieldTexts]
        updatedClusternameInputFieldTexts[index] = ''
        setNewClusternameInputFieldTexts(updatedClusternameInputFieldTexts)

        // Update species Array
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                if ( checkIfItemAlreadyExists(newClusternameInputFieldTexts[index], allClusternameNames) ) {
                    return speciesObject
                }

                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                return {
                    ...speciesObject,
                    clusternames: [...updatedClusternames, new Clustername(newClusternameName)]
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

        if (selectedClustername.name === UNKNOWN_CLUSTERNAME) return

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
        let editedClustername = prompt('Change clustername: ')
        if (!editedClustername) return

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                if ( checkIfItemAlreadyExists(editedClustername, allClusternameNames) ) {
                    return speciesObject
                }

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    return clustername.name === selectedClustername.name ? {...clustername, name: editedClustername} : clustername
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

    const activateClustername = (selectedID, selectedClustername) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {
                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    if (clustername === selectedClustername){
                        return {...clustername, isActive: true}
                    } else {
                        return {...clustername, isActive: false}
                    }
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

    const deactivateExistingClusternames = (clusternames) => {
        return clusternames.map(clustername => ({
            ...clustername,
            isActive: false
        }))
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
                            {species.name !== UNKNOWN_SPECIES && <button className='delete-species-btn' onClick={() => deleteSpecies(species.id)}>🗑️</button>}

                            <div className='individual-btn-container'>
                                {
                                    species.individuals.map( individual =>
                                        <div
                                            key={`${species.id}-${individual.name}`}
                                            className='individual-btn'
                                            isactive={individual.isActive.toString()}
                                            onClick={ () => activateIndividual(species.id, individual) }
                                            onContextMenu={ (event) => deleteIndividual(event, species.id, individual)}
                                        >
                                            {individual.name}
                                        </div>
                                    )
                                }
                                <button className='add-individual-btn' onClick={() => addNewIndividual(species.id)}>➕</button>
                            </div>

                            <div className='clustername-btn-container'>
                                {
                                    species.clusternames.map( clustername =>
                                        <div
                                            key={`${species.id}-${clustername.name}`}
                                            className='clustername-btn'
                                            isactive={clustername.isActive.toString()}
                                        >
                                            <div
                                                className='clustername-btn-name'
                                                onClick={ () => activateClustername(species.id, clustername) }
                                                onContextMenu={ (event) => deleteClustername(event, species.id, clustername)}
                                            >
                                                {clustername.name}
                                            </div>
                                            <button
                                                className='colorwheel-btn'
                                                onContextMenu={ (event) => event.preventDefault() }
                                            >
                                                🎨️
                                            </button>
                                            {
                                                clustername.name !== UNKNOWN_CLUSTERNAME &&
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
                                <form className='clustername-form' onSubmit={ (event) => addNewClustername(event,species.id, index) }>
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
                                    <button className='add-clustername-btn'>➕</button>
                                </form>
                            </div>

                        </div>
                    )
                }

            </div>

            <form onSubmit={addNewSpecies}>
                <input
                    className='species-input-field'
                    type='text'
                    required='required'
                    pattern='^[^,]{1,30}$'
                    title='No commas allowed. Max length 30 characters'
                    value={newSpeciesInputFieldText}
                    placeholder='Add a new Species'
                    onChange={ (event) => setNewSpeciesInputFieldText(event.target.value) }
                />
                <button className='add-species-btn'>➕</button>
            </form>

        </div>
    )
}

export default AnnotationLabels