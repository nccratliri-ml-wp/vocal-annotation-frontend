import React, {useState} from "react";
import {nanoid} from 'nanoid'
import Colorwheel from "./Colorwheel.jsx";
import InputWindow from "./InputWindow.jsx";
import {
    DEFAULT_CLUSTERNAME_COLOR,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    INACTIVE_BUTTON_COLOR,
    UNKNOWN_CLUSTERNAME,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_SPECIES,
    Species,
    Individual,
    Clustername,
    activateIndividual,
    activateClustername,
    deactivateExistingIndividuals,
    deactivateExistingClusternames,
    checkIfEveryObjectIsInactive,
    ANNOTATED_AREA_INDIVIDUAL,
    ANNOTATED_AREA_CLUSTERNAME,
    ANNOTATED_AREA,
    ANNOTATED_AREA_COLOR
} from './species.js'
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import LockIcon from '@mui/icons-material/Lock';
import {globalControlsBtn, icon, iconBig, iconBtnDisabled} from "./styles.js";
import AddBoxIcon from "@mui/icons-material/AddBox.js";


function AnnotationLabels ({speciesArray, passSpeciesArrayToApp, passDeletedItemIDToApp, strictMode }) {

    const [showSpeciesInputWindow, setShowSpeciesInputWindow] = useState(false)

    /* ++++++++++++++++++++ Species ++++++++++++++++++++ */

    const addNewSpecies = (event, inputFieldContent) => {
        event.preventDefault()

        setShowSpeciesInputWindow(false)

        const allSpeciesNames = speciesArray.map( speciesObject => speciesObject.name )
        if (checkIfObjectNameAlreadyExists(inputFieldContent, allSpeciesNames)){
            alert(`${inputFieldContent} already exists. Add a different one.`)
            return
        }

        // Deactivate all Individuals and all Clusternames of all Species
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
            const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

            return new Species(
                speciesObject.id,
                speciesObject.name,
                [...updatedIndividuals],
                [...updatedClusternames]
            )
        })

        // Create new Species
        const newIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL)
        const newClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
        const newSpecies = new Species(nanoid(),inputFieldContent, [newIndividual], [newClustername] )

        const insertionIndex = modifiedSpeciesArray.length - 1
        modifiedSpeciesArray.splice(insertionIndex, 0, newSpecies)
        passSpeciesArrayToApp( modifiedSpeciesArray )
    }

    const deleteSpecies = (selectedID) => {
        if (!confirm('Deleting this Species will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedID)

        // Delete Species
        let modifiedSpeciesArray = speciesArray.filter(speciesObject => speciesObject.id !== selectedID)

        // Activate Clusternames and Individual of the Unknown Species
        modifiedSpeciesArray = modifiedSpeciesArray.map((speciesObject) => {
            if (speciesObject.name === UNKNOWN_SPECIES) {
                const updatedIndividuals = activateIndividual(speciesObject.individuals, UNKNOWN_INDIVIDUAL)
                const updatedClusternames = activateClustername(speciesObject.clusternames, UNKNOWN_CLUSTERNAME)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const editSpecies = (selectedID) => {
        let editedSpeciesName = prompt('Change species name: ')
        if (!editedSpeciesName) return

        if (editedSpeciesName.includes(',') || editedSpeciesName.length > 45) {
            alert('Invalid input. Please provide a valid species name without commas and no longer than 45 characters.')
            return
        }

        const allSpeciesNames = speciesArray.map(speciesObject => speciesObject.name)
        if (allSpeciesNames.some(name => name === editedSpeciesName)) {
            alert(`${editedSpeciesName} already exists. Add a different one.`)
            return
        }

        const modifiedSpeciesArray = speciesArray.map( speciesObject => {
            if (speciesObject.id === selectedID) {
                return new Species(
                    speciesObject.id,
                    editedSpeciesName,
                    speciesObject.individuals,
                    speciesObject.clusternames
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }


    /* ++++++++++++++++++++ Individuals ++++++++++++++++++++ */

    const addNewIndividual = (event, inputFieldContent, selectedID) => {
        event.preventDefault()

        const newIndividualName = inputFieldContent

        // Update species Array
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate "Unknown" Clustername, only if all other clusternames are inactive (this happens when the user switches species)
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObject.clusternames)
                    ? activateClustername(speciesObject.clusternames, UNKNOWN_CLUSTERNAME)
                    : speciesObject.clusternames

                // If individual already exists, activate that one and alert the user
                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newIndividualName, allIndividualNames)
                if ( alreadyExistingObjectName ) {
                    const updatedIndividuals = activateClustername(speciesObject.individuals, alreadyExistingObjectName)
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return new Species(
                        speciesObject.id,
                        speciesObject.name,
                        [...updatedIndividuals],
                        [...updatedClusternames]
                    )
                }

                // Deactivate existing individuals of the current species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals, new Individual(nanoid(),newIndividualName)],
                    [...updatedClusternames]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })
        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const deleteIndividual = (event, selectedID, selectedIndividual) => {
        event.preventDefault()

        if (selectedIndividual.name === UNKNOWN_INDIVIDUAL) return

        if (!confirm('Deleting this Individual will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedIndividual.id)

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Delete selected Individual
                let updatedIndividuals = speciesObject.individuals.filter( individual => individual !== selectedIndividual)

                // If the deleted clustername was the active one, activate "Unknown Clustername"
                updatedIndividuals = checkIfEveryObjectIsInactive(updatedIndividuals) && !checkIfEveryObjectIsInactive(speciesObject.clusternames)
                    ? activateClustername(updatedIndividuals, UNKNOWN_INDIVIDUAL)
                    : updatedIndividuals

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    speciesObject.clusternames
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const editIndividual = (selectedID, selectedIndividual) => {
        let editedIndividual = prompt('Change individual: ')
        if (!editedIndividual) return

        if (editedIndividual.includes(',') || editedIndividual.length > 45) {
            alert('Invalid input. Please provide a valid Individual name without commas and no longer than 45 characters.')
            return
        }

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(editedIndividual, allIndividualNames)
                if ( alreadyExistingObjectName) {
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return speciesObject
                }

                const updatedIndividuals = speciesObject.individuals.map( individual => {
                    const updatedIndividual = new Individual( individual.id, editedIndividual)
                    return individual.name === selectedIndividual.name ? updatedIndividual : individual
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    speciesObject.clusternames
                )

            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const handleClickIndividual = (selectedID, selectedIndividual) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate selected individual, deactivate all others
                const updatedIndividuals = activateIndividual(speciesObject.individuals, selectedIndividual.name)

                // Activate Unknown clustername or Annotated Area clustername, only if all other clusternames are inactive (this happens when the user switches species)
                const fallbackClustername = speciesObject.name === ANNOTATED_AREA ? ANNOTATED_AREA_CLUSTERNAME : UNKNOWN_CLUSTERNAME
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateClustername(speciesObject.clusternames, fallbackClustername)
                    : speciesObject.clusternames

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }


    /* ++++++++++++++++++++ Clusternames ++++++++++++++++++++ */

    const addNewClustername = (event, inputFieldContent, selectedID) => {
        event.preventDefault()

        const newClusternameName = inputFieldContent

        // Update species Array
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate "Unknown" Individual, only if all other Individuals are inactive (this happens when the user switches species)
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateIndividual(speciesObject.individuals, UNKNOWN_INDIVIDUAL)
                    : speciesObject.individuals

                // If clustername already exists, activate that one and alert the user
                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newClusternameName, allClusternameNames)
                if ( alreadyExistingObjectName ) {
                    const updatedClusternames = activateClustername(speciesObject.clusternames, alreadyExistingObjectName)
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)

                    return new Species(
                        speciesObject.id,
                        speciesObject.name,
                        [...updatedIndividuals],
                        [...updatedClusternames]
                    )
                }

                // Deactivate existing clusternames of the current species
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames, new Clustername(nanoid(), newClusternameName, DEFAULT_CLUSTERNAME_COLOR)]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })
        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const deleteClustername = (event, selectedID, selectedClustername) => {
        event.preventDefault()

        if (selectedClustername.name === UNKNOWN_CLUSTERNAME) return

        if (!confirm('Deleting this Clustername will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedClustername.id)

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Delete selected clustername
                let updatedClusternames = speciesObject.clusternames.filter( clustername => clustername !== selectedClustername)

                // If the deleted clustername was the active one, activate "Unknown Clustername"
                updatedClusternames = checkIfEveryObjectIsInactive(updatedClusternames) && !checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateClustername(updatedClusternames, UNKNOWN_CLUSTERNAME)
                    : updatedClusternames

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const editClustername = (selectedID, selectedClustername) => {
        let editedClustername = prompt('Change clustername: ')
        if (!editedClustername) return

        if (editedClustername.includes(',') || editedClustername.length > 45) {
            alert('Invalid input. Please provide a valid clustername without commas and no longer than 45 characters.')
            return
        }

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(editedClustername, allClusternameNames)
                if ( alreadyExistingObjectName) {
                    alert(`${alreadyExistingObjectName} already exists. Add a different one.`)
                    return speciesObject
                }

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    const updatedClustername = new Clustername(clustername.id, editedClustername, clustername.color)
                    return clustername.name === selectedClustername.name ? updatedClustername : clustername
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )

            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const handleClickClustername = (selectedID, selectedClustername) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate selected clustername, deactivate all others
                const updatedClusternames = activateClustername(speciesObject.clusternames, selectedClustername.name)

                // Activate Unknown individual or Annotated Area Individual, only if all other Individuals are inactive (this happens when the user switches species)
                const fallbackIndividual = speciesObject.name === ANNOTATED_AREA ? ANNOTATED_AREA_INDIVIDUAL : UNKNOWN_INDIVIDUAL
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateIndividual(speciesObject.individuals, fallbackIndividual)
                    : speciesObject.individuals

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames]
                )
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const toggleColorwheel = (selectedID, selectedClustername) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    if (clustername === selectedClustername){
                        const updatedClustername = new Clustername(clustername.id, clustername.name, clustername.color)
                        updatedClustername.isActive = clustername.isActive
                        updatedClustername.showColorwheel = !clustername.showColorwheel
                        return updatedClustername
                    } else {
                        return clustername
                    }
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )

            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const passChosenColorToAnnotationLabels = (selectedID, selectedClustername, newColor) => {
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    if (clustername === selectedClustername){
                        const updatedClustername = new Clustername(clustername.id, clustername.name, newColor)
                        updatedClustername.isActive = clustername.isActive
                        updatedClustername.showColorwheel = clustername.showColorwheel
                        return updatedClustername
                    } else {
                        return clustername
                    }
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames]
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }


    /* ++++++++++++++++++++ Helper methods ++++++++++++++++++++ */

    const checkIfObjectNameAlreadyExists = ( newObjectName, array ) => {
        for (let objectName of array){
            if (objectName === newObjectName){
                return objectName
            }
        }
    }

    const handleCancel = (event) => {
        event.preventDefault()
        //setInputFieldContent('')
        setShowSpeciesInputWindow(false)
    }

    const toggleClusternameInputWindow = (event, selectedID) => {
        // Close New Species Input Window if it's open
        setShowSpeciesInputWindow(false)

        // Open/Close the selected Clustername Window
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {

            // Open Clustername Input Window of the clicked Species, close it's individual Input Window if it's open
            if (speciesObject.id === selectedID) {
                const updatedSpeciesObject = new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    speciesObject.clusternames
                )
                updatedSpeciesObject.showIndividualInputWindow = false
                updatedSpeciesObject.showClusternameInputWindow = !speciesObject.showClusternameInputWindow
                return updatedSpeciesObject

            // Close all Input windows of all other Species
            } else {
                const updatedSpeciesObject = new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    speciesObject.clusternames
                )
                updatedSpeciesObject.showIndividualInputWindow = false
                updatedSpeciesObject.showClusternameInputWindow = false
                return updatedSpeciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const toggleIndividualInputWindow = (event, selectedID) => {
        // Close New Species Input Window if it's open
        setShowSpeciesInputWindow(false)

        // Open/Close the selected Individual Window
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {

            // Open Individual Input Window of the clicked Species, close it's Clustername Input Window if it's open
            if (speciesObject.id === selectedID) {
                const updatedSpeciesObject = new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    speciesObject.clusternames
                )
                updatedSpeciesObject.showIndividualInputWindow = !speciesObject.showIndividualInputWindow
                updatedSpeciesObject.showClusternameInputWindow = false
                return updatedSpeciesObject

            // Close all Input windows of all other Species
            } else {
                const updatedSpeciesObject = new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    speciesObject.clusternames
                )
                updatedSpeciesObject.showIndividualInputWindow = false
                updatedSpeciesObject.showClusternameInputWindow = false
                return updatedSpeciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }


    return (
        <div id='annotation-labels-container'>

            <div id='annotation-labels-menu'>
                {
                    speciesArray.map( (species) => {

                        // Render Annotated Area Button in a different format
                        if (species.name === ANNOTATED_AREA){
                            return (
                                <div id='annotated-area-button-container' key={species.id}>
                                    <Tooltip title='Mark Annotated Area'>
                                        <IconButton style={strictMode ? iconBtnDisabled : globalControlsBtn}
                                                    disabled={strictMode}
                                                    onClick={ () => handleClickIndividual(species.id, species.individuals[0]) }
                                        >
                                            <LockIcon
                                                style={{...icon, ...(species.individuals[0].isActive && {color: ANNOTATED_AREA_COLOR})}}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            )
                        }

                        // Render all other species
                        return (
                            <fieldset
                                id={species.id}
                                key={species.id}
                                className='species'
                            >
                                <legend>
                                    {species.name}
                                    {species.name !== UNKNOWN_SPECIES &&
                                        <button className='edit-species-btn'
                                                onClick={() => editSpecies(species.id)}
                                        >
                                            ✏️
                                        </button>
                                    }
                                    {species.name !== UNKNOWN_SPECIES &&
                                        <button className='delete-species-btn'
                                                onClick={() => deleteSpecies(species.id)}
                                        >
                                            🗑️
                                        </button>
                                    }
                                </legend>

                                <div className='individual-btn-container'>
                                    Individuals:
                                    {
                                        species.individuals.map(individual =>
                                            <div
                                                key={individual.id}
                                                className='individual-btn'
                                                isactive={individual.isActive.toString()}>
                                                <div
                                                    className='individual-btn-name'
                                                    onClick={() => handleClickIndividual(species.id, individual)}
                                                    onContextMenu={(event) => deleteIndividual(event, species.id, individual)}
                                                >
                                                    {individual.name}
                                                </div>
                                                {
                                                    individual.name !== UNKNOWN_INDIVIDUAL &&
                                                    <button
                                                        className='edit-name-btn'
                                                        onClick={() => editIndividual(species.id, individual)}
                                                        onContextMenu={(event) => event.preventDefault()}
                                                    >
                                                        ✏️
                                                    </button>
                                                }
                                            </div>
                                        )
                                    }

                                    <Tooltip title='Add New Individual'>
                                        <IconButton style={{padding: 0}} onClick={ (event) => toggleIndividualInputWindow(event, species.id) }>
                                            <AddBoxIcon style={icon} />
                                        </IconButton>
                                    </Tooltip>
                                    {
                                        species.showIndividualInputWindow &&
                                            <InputWindow
                                                handleCancel={toggleIndividualInputWindow}
                                                objectType='Individual'
                                                speciesID={species.id}
                                                addNewObject={addNewIndividual}
                                            />
                                    }

                                </div>

                                <div className='clustername-btn-container'>
                                    Clusternames:
                                    {
                                        species.clusternames.map(clustername =>
                                            <div
                                                key={clustername.id}
                                                className='clustername-btn'
                                                style={{
                                                    borderLeft: `2px solid ${clustername.color}`,
                                                    backgroundColor: clustername.isActive ? clustername.color : INACTIVE_BUTTON_COLOR
                                                }}
                                                isactive={clustername.isActive.toString()}
                                            >
                                                <div
                                                    className='clustername-btn-name'
                                                    isactive={clustername.isActive.toString()}
                                                    onClick={() => handleClickClustername(species.id, clustername)}
                                                    onContextMenu={(event) => deleteClustername(event, species.id, clustername)}
                                                >
                                                    {clustername.name}
                                                </div>
                                                <button
                                                    className='colorwheel-btn'
                                                    onClick={() => toggleColorwheel(species.id, clustername)}
                                                    onContextMenu={(event) => event.preventDefault()}
                                                >
                                                    🎨️
                                                </button>
                                                {
                                                    clustername.showColorwheel &&
                                                        <Colorwheel
                                                            toggleColorwheel={toggleColorwheel}
                                                            passChosenColorToAnnotationLabels={passChosenColorToAnnotationLabels}
                                                            selectedID={species.id}
                                                            selectedClustername={clustername}/>
                                                }
                                                {
                                                    clustername.name !== UNKNOWN_CLUSTERNAME &&
                                                        <button
                                                            className='edit-name-btn'
                                                            onClick={() => editClustername(species.id, clustername)}
                                                            onContextMenu={(event) => event.preventDefault()}
                                                        >
                                                            ✏️
                                                        </button>
                                                }
                                            </div>
                                        )
                                    }

                                    <Tooltip title='Add New Clustername'>
                                        <IconButton style={{padding: 0}} onClick={ (event) => toggleClusternameInputWindow(event, species.id) }>
                                            <AddBoxIcon style={icon}/>
                                        </IconButton>
                                    </Tooltip>
                                    {
                                        species.showClusternameInputWindow &&
                                            <InputWindow
                                                handleCancel={toggleClusternameInputWindow}
                                                objectType='Clustername'
                                                speciesID={species.id}
                                                addNewObject={addNewClustername}
                                            />
                                    }
                                </div>

                            </fieldset>
                            )
                        }
                    )
                }

                <Tooltip title='Add New Species'>
                    <IconButton style={{padding: 0}} onClick={() => setShowSpeciesInputWindow(true)}>
                        <AddBoxIcon style={iconBig}/>
                    </IconButton>
                </Tooltip>
                {
                    showSpeciesInputWindow &&
                        <InputWindow
                            handleCancel={handleCancel}
                            objectType='Species'
                            addNewObject={addNewSpecies}
                        />
                }

            </div>

        </div>
    )
}

export default AnnotationLabels