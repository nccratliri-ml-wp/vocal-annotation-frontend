// External dependencies
import {nanoid} from "nanoid";

/* ++++++++++++++++++ Global variables ++++++++++++++++++ */

const UNKNOWN_SPECIES = 'Unknown'
const UNKNOWN_INDIVIDUAL = 'Unknown'
const UNKNOWN_CLUSTERNAME = 'Unknown'
const DEFAULT_UNKNOWN_CLUSTERNAME_COLOR = '#00EEFF'
const CLUSTERNAME_COLOR_ARRAY = [
    "#36ff00", // Light Green
    "#ff3333", // Tomato
    "#3357FF", // Blue
    "#fda000", // Orange
    "#25aba4", // Cyan
    "#8D33FF", // Purple
    "#a6b02e", // Yellow
    "#eeb962", // Beige
    "#d3b0ff", // Light Purple
    "#d26c1d", // Dark Orange
    "#913c3c", // Crimson
    "#33A1FF", // Sky Blue
    "#cc77c1", // Pale Pink
    "#86a9ce", // Pale Blue
    "#B8E986", // Grasshoper
    "#FF33A1", // Pink
    "#33FF8C", // Spring Green
    "#8B572A", // Brown
    "#FA8072", // Salmon
    "#3a7528", // Wood Green
]
const INACTIVE_BUTTON_COLOR = '#626262'
const ANNOTATED_AREA = 'Annotated Area'
const ANNOTATED_AREA_INDIVIDUAL = '🔒'
const ANNOTATED_AREA_CLUSTERNAME = 'Annotated Area'
const ANNOTATED_AREA_COLOR = '#33c220'


/* ++++++++++++++++++ Class definitions ++++++++++++++++++ */

class Species {
    constructor(id, name, individuals, clusternames, minFreq=null, maxFreq=null ) {
        this.id = id
        this.name = name
        this.individuals = individuals
        this.clusternames = clusternames
        this.minFreq = minFreq
        this.maxFreq = maxFreq
        this.showIndividualInputWindow = false
        this.showClusternameInputWindow = false
    }
}

class Individual {
    constructor(id, name) {
        this.id = id
        this.name = name
        this.isActive = true
    }
}

class Clustername {
    constructor(id, name, color) {
        this.id = id
        this.name = name
        this.isActive = true
        this.color = color
        this.showColorwheel = false
    }
}


/* ++++++++++++++++++ Species array manipulations methods ++++++++++++++++++ */

const activateIndividual = (individuals, selectedIndividualName) => {
    return individuals.map( individual => {
        if (individual.name === selectedIndividualName){
            const activatedIndividual = new Individual(individual.id, individual.name)
            activatedIndividual.isActive = true
            return activatedIndividual
        } else {
            const deactivatedIndividual = new Individual(individual.id, individual.name)
            deactivatedIndividual.isActive = false
            return deactivatedIndividual
        }
    })
}

const activateClustername = (clusternames, selectedClusternameName) => {
    return clusternames.map( clustername => {
        if (clustername.name === selectedClusternameName){
            const activatedClustername = new Clustername (clustername.id, clustername.name, clustername.color)
            activatedClustername.isActive = true
            return activatedClustername
        } else {
            const deActivatedClustername = new Clustername (clustername.id, clustername.name, clustername.color)
            deActivatedClustername.isActive = false
            return deActivatedClustername
        }
    })
}

const deactivateExistingIndividuals = (individuals) => {
    return individuals.map(individual => {
        const deactivatedIndividual = new Individual(individual.id, individual.name)
        deactivatedIndividual.isActive = false
        return deactivatedIndividual
    })
}

const deactivateExistingClusternames = (clusternames) => {
    return clusternames.map(clustername => {
        const deactivatedClustername = new Clustername (clustername.id, clustername.name, clustername.color)
        deactivatedClustername.isActive = false
        return deactivatedClustername
    })
}

const createSpeciesFromImportedLabels = (importedLabels, currentSpeciesArray) => {
    let updatedSpeciesArray = [...currentSpeciesArray]
    const allExistingSpeciesNames = currentSpeciesArray.map(speciesObj => speciesObj.name)
    let clusternameColorIndex = 0

    for (let label of importedLabels){

        for (let speciesObj of updatedSpeciesArray){

            // For Existing species, update Individuals and Clusternames
            if (speciesObj.name === label.species){
                const allIndividualNames = speciesObj.individuals.map(individual => individual.name)
                if ( !allIndividualNames.includes(label.individual) ){
                    const newIndividual = new Individual(nanoid(), label.individual)
                    newIndividual.isActive = false
                    speciesObj.individuals = [...speciesObj.individuals, newIndividual]
                }

                const allClusternamesNames = speciesObj.clusternames.map(clustername => clustername.name)
                if ( !allClusternamesNames.includes(label.clustername) ){
                    const newClustername = new Clustername(nanoid(), label.clustername, CLUSTERNAME_COLOR_ARRAY[clusternameColorIndex])
                    newClustername.isActive = false
                    speciesObj.clusternames = [...speciesObj.clusternames, newClustername]
                    clusternameColorIndex = goToNextColor(clusternameColorIndex)
                }
            }
        }

        // If imported species does not exist already, create a new one
        if (!allExistingSpeciesNames.includes(label.species)){

            const newIndividualsArray = []
            // Create Unknown Individual
            const newUnknownIndividual = new Individual(nanoid(), UNKNOWN_INDIVIDUAL, 0)
            newUnknownIndividual.isActive = false
            newIndividualsArray.unshift(newUnknownIndividual)

            // If that label's individual is not Unknown, create that individual for this species
            if (label.individual !== UNKNOWN_INDIVIDUAL){
                const newIndividual = new Individual(nanoid(), label.individual)
                newIndividual.isActive = false
                newIndividualsArray.push(newIndividual)
            }


            const newClusternamesArray = []
            // Create Unknown Clustername
            const newUnknownClustername = new Clustername(nanoid(), UNKNOWN_CLUSTERNAME, DEFAULT_UNKNOWN_CLUSTERNAME_COLOR)
            newUnknownClustername.isActive = false
            newClusternamesArray.push(newUnknownClustername)

            // If that label's clustername is not Unknown, create that clustername for this species
            if (label.clustername !== UNKNOWN_CLUSTERNAME) {
                const newClustername = new Clustername(nanoid(), label.clustername, CLUSTERNAME_COLOR_ARRAY[clusternameColorIndex])
                newClustername.isActive = false
                newClusternamesArray.push(newClustername)
                clusternameColorIndex = goToNextColor(clusternameColorIndex)
            }

            const newSpecies = new Species(
                nanoid(),
                label.species,
                newIndividualsArray,
                newClusternamesArray,
            )

            const insertionIndex = updatedSpeciesArray.length - 1
            allExistingSpeciesNames.splice(insertionIndex,0,label.species)
            updatedSpeciesArray.splice(insertionIndex,0,newSpecies)
        }
    }

    return updatedSpeciesArray
}

/* ++++++++++++++++++ Helper methods ++++++++++++++++++ */

const checkIfEveryObjectIsInactive = (objects) => {
    return objects.every(object => !object.isActive)
}

const goToNextColor = (currentIndex) => {
    return currentIndex === CLUSTERNAME_COLOR_ARRAY.length -1 ? 0 : currentIndex + 1
}


export {
    Species,
    Individual,
    Clustername,
    activateIndividual,
    activateClustername,
    deactivateExistingIndividuals,
    deactivateExistingClusternames,
    checkIfEveryObjectIsInactive,
    createSpeciesFromImportedLabels,
    UNKNOWN_SPECIES,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_CLUSTERNAME,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    CLUSTERNAME_COLOR_ARRAY,
    INACTIVE_BUTTON_COLOR,
    ANNOTATED_AREA,
    ANNOTATED_AREA_INDIVIDUAL,
    ANNOTATED_AREA_CLUSTERNAME,
    ANNOTATED_AREA_COLOR,
}