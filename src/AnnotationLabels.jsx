import React, {useState} from "react";
import {nanoid} from 'nanoid'
import Colorwheel from "./Colorwheel.jsx";
import InputWindow from "./InputWindow.jsx";
import {
    activateClustername,
    activateIndividual,
    ANNOTATED_AREA,
    ANNOTATED_AREA_CLUSTERNAME,
    ANNOTATED_AREA_COLOR,
    ANNOTATED_AREA_INDIVIDUAL,
    checkIfEveryObjectIsInactive,
    Clustername,
    deactivateExistingClusternames,
    deactivateExistingIndividuals,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    CLUSTERNAME_COLOR_ARRAY,
    INACTIVE_BUTTON_COLOR,
    Individual,
    Species,
    UNKNOWN_CLUSTERNAME,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_SPECIES
} from './species.js'
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    globalControlsBtn,
    globalControlsBtnDisabled,
    icon,
    iconBig,
    iconBtnSmallest,
    iconSmall
} from "./styles.js";
import AddBoxIcon from "@mui/icons-material/AddBox.js";
import FrequencyRangeWindow from "./FrequencyRangeWindow.jsx";
import {toast} from "react-toastify";


function AnnotationLabels ({speciesArray, passSpeciesArrayToApp, passDeletedItemIDToApp, strictMode }) {

    const [showSpeciesInputWindow, setShowSpeciesInputWindow] = useState(false)
    const [showSpeciesFrequencyRangeWindow, setShowSpeciesFrequencyRangeWindow] = useState(false)
    const [globalMouseCoordinates, setGlobalMouseCoordinates] = useState(null)

    /* ++++++++++++++++++++ Species ++++++++++++++++++++ */

    const addNewSpecies = (event, inputFieldContent) => {
        event.preventDefault()

        setShowSpeciesInputWindow(false)

        const allSpeciesNames = speciesArray.map( speciesObject => speciesObject.name )
        if (checkIfObjectNameAlreadyExists(inputFieldContent, allSpeciesNames)){
            toast.error(`Species '${inputFieldContent}' already exists. Add a different one.`)
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
                [...updatedClusternames],
                speciesObject.minFreq,
                speciesObject.maxFreq
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

        // Activate Clusternames and Individual of the first Species, but not if it's the special annotated area species object
        const firstSpecies = modifiedSpeciesArray[0]

        if (firstSpecies.name !== ANNOTATED_AREA) {
            const updatedIndividuals = activateIndividual(firstSpecies.individuals, firstSpecies.individuals[0].name)
            const updatedClusternames = activateClustername(firstSpecies.clusternames, firstSpecies.clusternames[0].name)
            firstSpecies.individuals = updatedIndividuals
            firstSpecies.clusternames = updatedClusternames
        }

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const editSpecies = (selectedID) => {
        let editedSpeciesName = prompt('Change species name: ')
        if (!editedSpeciesName) return

        if (editedSpeciesName.includes(',') || editedSpeciesName.length > 45) {
            toast.error('Invalid input. Please provide a valid species name without commas and no longer than 45 characters.')
            return
        }

        const allSpeciesNames = speciesArray.map(speciesObject => speciesObject.name)
        if (allSpeciesNames.some(name => name === editedSpeciesName)) {
            toast.error(`Species '${editedSpeciesName}' already exists. Add a different one.`)
            return
        }

        const modifiedSpeciesArray = speciesArray.map( speciesObject => {
            if (speciesObject.id === selectedID) {
                return new Species(
                    speciesObject.id,
                    editedSpeciesName,
                    speciesObject.individuals,
                    speciesObject.clusternames,
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const assignFrequencyRange = (event, newMinFreq, newMaxFreq, selectedSpeciesID) => {
        event.preventDefault()

        const modifiedSpeciesArray = speciesArray.map( speciesObj => {
            if (speciesObj.id === selectedSpeciesID){
                return new Species(
                    speciesObj.id,
                    speciesObj.name,
                    speciesObj.individuals,
                    speciesObj.clusternames,
                    newMinFreq,
                    newMaxFreq
                )
            } else {
                return speciesObj
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
        setShowSpeciesFrequencyRangeWindow(false)
    }


    /* ++++++++++++++++++++ Individuals ++++++++++++++++++++ */

    const addNewIndividual = (event, inputFieldContent, selectedID) => {
        event.preventDefault()

        const newIndividualName = inputFieldContent

        // Update species Array
        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Activate first Clustername, only if all other clusternames are inactive (this happens when the user switches species)
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObject.clusternames)
                    ? activateClustername(speciesObject.clusternames, speciesObject.clusternames[0].name)
                    : speciesObject.clusternames

                // If individual already exists, activate that one and alert the user
                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newIndividualName, allIndividualNames)
                if ( alreadyExistingObjectName ) {
                    const updatedIndividuals = activateClustername(speciesObject.individuals, alreadyExistingObjectName)
                    toast.error(`Individual '${alreadyExistingObjectName}' already exists. Add a different one.`)
                    return new Species(
                        speciesObject.id,
                        speciesObject.name,
                        [...updatedIndividuals],
                        [...updatedClusternames],
                        speciesObject.minFreq,
                        speciesObject.maxFreq
                    )
                }

                // Deactivate existing individuals of the current species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals, new Individual(nanoid(),newIndividualName)],
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            }
        })
        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const deleteIndividual = (event, selectedSpeciesID, selectedIndividual) => {
        event.preventDefault()

        if (strictMode && selectedIndividual.name === UNKNOWN_INDIVIDUAL) return

        const individualsArray = speciesArray.find(speciesObj => speciesObj.id === selectedSpeciesID).individuals
        if (individualsArray.length <= 1){
            toast.error("At least one individual per species needed.")
            return
        }

        if (!confirm('Deleting this Individual will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedIndividual.id)

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedSpeciesID) {

                // Delete selected Individual
                let updatedIndividuals = speciesObject.individuals.filter( individual => individual !== selectedIndividual)

                // If the deleted individual was the active one, activate the first individual
                updatedIndividuals = checkIfEveryObjectIsInactive(updatedIndividuals) && !checkIfEveryObjectIsInactive(speciesObject.clusternames)
                    ? activateIndividual(updatedIndividuals, updatedIndividuals[0].name)
                    : updatedIndividuals

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    speciesObject.clusternames,
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
            toast.error('Invalid input. Please provide a valid Individual name without commas and no longer than 45 characters.')
            return
        }

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allIndividualNames = speciesObject.individuals.map( individual => individual.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(editedIndividual, allIndividualNames)
                if ( alreadyExistingObjectName) {
                    toast.error(`Individual '${alreadyExistingObjectName}' already exists. Add a different one.`)
                    return speciesObject
                }

                const updatedIndividuals = speciesObject.individuals.map( individual => {
                    const updatedIndividual = new Individual( individual.id, editedIndividual)
                    updatedIndividual.isActive = selectedIndividual.isActive
                    return individual.name === selectedIndividual.name ? updatedIndividual : individual
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    speciesObject.clusternames,
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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

                // Activate the first clustername or Annotated Area clustername, only if all other clusternames are inactive (this happens when the user switches species)
                const fallbackClustername = speciesObject.name === ANNOTATED_AREA ? ANNOTATED_AREA_CLUSTERNAME : speciesObject.clusternames[0].name
                const updatedClusternames = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateClustername(speciesObject.clusternames, fallbackClustername)
                    : speciesObject.clusternames

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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

                // Activate first Individual, only if all other Individuals are inactive (this happens when the user switches species)
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateIndividual(speciesObject.individuals, speciesObject.individuals[0].name)
                    : speciesObject.individuals

                // If clustername already exists, activate that one and alert the user
                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(newClusternameName, allClusternameNames)
                if ( alreadyExistingObjectName ) {
                    const updatedClusternames = activateClustername(speciesObject.clusternames, alreadyExistingObjectName)
                    toast.error(`Vocalization '${alreadyExistingObjectName}' already exists. Add a different one.`)

                    return new Species(
                        speciesObject.id,
                        speciesObject.name,
                        [...updatedIndividuals],
                        [...updatedClusternames],
                        speciesObject.minFreq,
                        speciesObject.maxFreq
                    )
                }

                // Deactivate existing clusternames of the current species
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)

                // Get random color for the new clustername
                const randomColor = CLUSTERNAME_COLOR_ARRAY[Math.floor(Math.random() * 20)]

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames, new Clustername(nanoid(), newClusternameName, randomColor)],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            }
        })
        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const deleteClustername = (event, selectedSpeciesID, selectedClustername) => {
        event.preventDefault()

        if (strictMode && selectedClustername.name === UNKNOWN_CLUSTERNAME) return

        const clusternamesArray = speciesArray.find(speciesObj => speciesObj.id === selectedSpeciesID).clusternames
        if (clusternamesArray.length <= 1){
            toast.error("At least one vocalization per species needed.")
            return
        }

        if (!confirm('Deleting this Clustername will remove any annotations associated with it.')) return
        passDeletedItemIDToApp(selectedClustername.id)

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedSpeciesID) {

                // Delete selected clustername
                let updatedClusternames = speciesObject.clusternames.filter( clustername => clustername !== selectedClustername)

                // If the deleted clustername was the active one, activate the first one
                updatedClusternames = checkIfEveryObjectIsInactive(updatedClusternames) && !checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateClustername(updatedClusternames, updatedClusternames[0].name)
                    : updatedClusternames

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            } else {
                return speciesObject
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const editClustername = (selectedID, selectedClustername) => {
        let editedClustername = prompt('Edit vocalization: ')
        if (!editedClustername) return

        if (editedClustername.includes(',') || editedClustername.length > 45) {
            toast.error('Invalid input. Please provide a valid vocalization without commas and no longer than 45 characters.')
            return
        }

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                const allClusternameNames = speciesObject.clusternames.map( clustername => clustername.name)
                const alreadyExistingObjectName = checkIfObjectNameAlreadyExists(editedClustername, allClusternameNames)
                if ( alreadyExistingObjectName) {
                    toast.error(`Vocalization '${alreadyExistingObjectName}' already exists. Add a different one.`)
                    return speciesObject
                }

                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    const updatedClustername = new Clustername(clustername.id, editedClustername, clustername.color)
                    updatedClustername.isActive = selectedClustername.isActive
                    return clustername.name === selectedClustername.name ? updatedClustername : clustername
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
                const fallbackIndividual = speciesObject.name === ANNOTATED_AREA ? ANNOTATED_AREA_INDIVIDUAL :  speciesObject.individuals[0].name
                const updatedIndividuals = checkIfEveryObjectIsInactive(speciesObject.individuals)
                    ? activateIndividual(speciesObject.individuals, fallbackIndividual)
                    : speciesObject.individuals

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            } else {
                //Deactivate existing clusternames and individuals of all other species
                const updatedIndividuals = deactivateExistingIndividuals(speciesObject.individuals)
                const updatedClusternames = deactivateExistingClusternames(speciesObject.clusternames)
                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    [...updatedIndividuals],
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const openColorwheel = (event, selectedID, selectedClustername) => {
        // Set Global Mouse Coordinates to place the Colorwheel Window at the correct location on the screen
        setGlobalMouseCoordinates({x: event.clientX, y: event.clientY})

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Open Colorwheel of the clicked clustername
                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    if (clustername === selectedClustername){
                        const updatedClustername = new Clustername(clustername.id, clustername.name, clustername.color)
                        updatedClustername.isActive = clustername.isActive
                        updatedClustername.showColorwheel = true
                        return updatedClustername
                    // Close Colorwheels of all other clusternames to not clutter the user's screen
                    } else {
                        const updatedClustername = new Clustername(clustername.id, clustername.name, clustername.color)
                        updatedClustername.isActive = clustername.isActive
                        updatedClustername.showColorwheel = false
                        return updatedClustername
                    }
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )

            } else {

                // Close Colorwheels of all other species
                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    const updatedClustername = new Clustername(clustername.id, clustername.name, clustername.color)
                    updatedClustername.isActive = clustername.isActive
                    updatedClustername.showColorwheel = false
                    return updatedClustername
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
                )
            }
        })

        passSpeciesArrayToApp(modifiedSpeciesArray)
    }

    const closeColorwheel = (selectedID, selectedClustername) => {

        const modifiedSpeciesArray = speciesArray.map(speciesObject => {
            if (speciesObject.id === selectedID) {

                // Close Colorwheel of the clicked clustername
                const updatedClusternames = speciesObject.clusternames.map( clustername => {
                    if (clustername === selectedClustername){
                        const updatedClustername = new Clustername(clustername.id, clustername.name, clustername.color)
                        updatedClustername.isActive = clustername.isActive
                        updatedClustername.showColorwheel = false
                        return updatedClustername
                    } else {
                        return clustername
                    }
                })

                return new Species(
                    speciesObject.id,
                    speciesObject.name,
                    speciesObject.individuals,
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
                    [...updatedClusternames],
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
        setShowSpeciesInputWindow(false)
        setShowSpeciesFrequencyRangeWindow(false)
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
                    speciesObject.clusternames,
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
                    speciesObject.clusternames,
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
                    speciesObject.clusternames,
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
                    speciesObject.clusternames,
                    speciesObject.minFreq,
                    speciesObject.maxFreq
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
                                        <IconButton style={strictMode ? globalControlsBtnDisabled : globalControlsBtn}
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
                                    {species.name === UNKNOWN_SPECIES ? `${UNKNOWN_SPECIES} Species` : species.name}
                                    {/*
                                    species.name !== UNKNOWN_SPECIES &&
                                        <IconButton
                                            style={iconBtnSmallest}
                                            onClick={() => setShowSpeciesFrequencyRangeWindow(species.id)}
                                        >
                                            <BarChartIcon style={iconSmall}/>
                                        </IconButton>
                                    */}
                                    {
                                        showSpeciesFrequencyRangeWindow === species.id &&
                                        <FrequencyRangeWindow
                                            handleCancel={handleCancel}
                                            speciesID={species.id}
                                            minFreq={species.minFreq}
                                            maxFreq={species.maxFreq}
                                            assignFrequencyRange={assignFrequencyRange}
                                        />
                                    }
                                    {!strictMode &&
                                        <IconButton
                                            style={iconBtnSmallest}
                                            onClick={() => editSpecies(species.id)}
                                        >
                                            <EditIcon style={iconSmall}/>
                                        </IconButton>
                                    }
                                    {!strictMode &&
                                        <IconButton
                                            style={iconBtnSmallest}
                                            onClick={() => deleteSpecies(species.id)}
                                        >
                                            <DeleteIcon style={iconSmall}/>
                                        </IconButton>
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
                                                    !strictMode &&
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
                                    Vocalizations:
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
                                                    onClick={(event) => openColorwheel(event,species.id, clustername)}
                                                    onContextMenu={(event) => event.preventDefault()}
                                                >
                                                    🎨️
                                                </button>
                                                {
                                                    clustername.showColorwheel &&
                                                        <Colorwheel
                                                            closeColorwheel={closeColorwheel}
                                                            passChosenColorToAnnotationLabels={passChosenColorToAnnotationLabels}
                                                            selectedID={species.id}
                                                            selectedClustername={clustername}
                                                            globalMouseCoordinates={globalMouseCoordinates}
                                                        />
                                                }
                                                {
                                                    !strictMode &&
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

                                    <Tooltip title='Add New Vocalization'>
                                        <IconButton style={{padding: 0}} onClick={ (event) => toggleClusternameInputWindow(event, species.id) }>
                                            <AddBoxIcon style={icon}/>
                                        </IconButton>
                                    </Tooltip>
                                    {
                                        species.showClusternameInputWindow &&
                                            <InputWindow
                                                handleCancel={toggleClusternameInputWindow}
                                                objectType='Vocalization'
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