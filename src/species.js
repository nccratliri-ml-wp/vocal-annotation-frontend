const UNKNOWN_SPECIES = 'Unknown Species'
const UNKNOWN_INDIVIDUAL = 'Unknown'
const UNKNOWN_CLUSTERNAME = 'Unknown'
const DEFAULT_CLUSTERNAME_COLOR = '#36ff00'
const DEFAULT_UNKNOWN_CLUSTERNAME_COLOR = '#00EEFF'
const INACTIVE_BUTTON_COLOR = '#626262'

class Species {
    constructor(id, name, individuals, clusternames) {
        this.id = id
        this.name = name
        this.individuals = individuals
        this.clusternames = clusternames
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

export {
    UNKNOWN_SPECIES,
    UNKNOWN_INDIVIDUAL,
    UNKNOWN_CLUSTERNAME,
    DEFAULT_CLUSTERNAME_COLOR,
    DEFAULT_UNKNOWN_CLUSTERNAME_COLOR,
    INACTIVE_BUTTON_COLOR,
    Species,
    Individual,
    Clustername
}