const UNKNOWN_SPECIES = 'Unknown Species'
const UNKNOWN_INDIVIDUAL = 'Unknown'
const UNKNOWN_CLUSTERNAME = 'Unknown'
const DEFAULT_CLUSTERNAME_COLOR = '#36ff00'
const DEFAULT_UNKNOWN_CLUSTERNAME_COLOR = '#00EEFF'
const INACTIVE_BUTTON_COLOR = '#626262'
const ANNOTATED_AREA = 'Annotated Area'
const ANNOTATED_AREA_INDIVIDUAL = '🔒'
const ANNOTATED_AREA_CLUSTERNAME = 'Annotated Area'
const ANNOTATED_AREA_COLOR = '#296c16'

class Species {
    constructor(id, name, individuals, clusternames) {
        this.id = id
        this.name = name
        this.individuals = individuals
        this.clusternames = clusternames
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
    constructor(id, name, color=DEFAULT_CLUSTERNAME_COLOR) {
        this.id = id
        this.name = name
        this.isActive = true
        this.color = color
        this.showColorwheel = false
    }
}

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

const checkIfEveryObjectIsInactive = (objects) => {
    return objects.every(object => !object.isActive)
}

export {
    UNKNOWN_SPECIES,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_CLUSTERNAME,
    DEFAULT_CLUSTERNAME_COLOR,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    INACTIVE_BUTTON_COLOR,
    ANNOTATED_AREA,
    ANNOTATED_AREA_INDIVIDUAL,
    ANNOTATED_AREA_CLUSTERNAME,
    ANNOTATED_AREA_COLOR,
    Species,
    Individual,
    Clustername,
    activateIndividual,
    activateClustername,
    deactivateExistingIndividuals,
    deactivateExistingClusternames,
    checkIfEveryObjectIsInactive
}