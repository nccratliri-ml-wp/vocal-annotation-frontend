const UNKNOWN_SPECIES = 'Unknown'
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

const dummyData = {
    "response": [
        {
            "url": "https://www2.iis.fraunhofer.de/AAC/ChID-BLITS-EBU-Narration441-16b.wav",
            "id": "64bec7e26642cadf5dc0eb01",
            "filename": "6 channel test.wav",
            "annotation_instance": "XC785219_fd453602-a4a9-4f57-95f2-fd9084e9a161",
            "time": "2024-03-27 20:01:43",
            "hop_length": 500,
            "num_spec_columns": 900,
            "sampling_rate": 44200,
            "nfft": 40,
            "f_high": 8000,
            "f_low": 6000,
            "spec_cal_method": "constant-q",
            "labels": {
                "channels": {
                    "0": [
                        {
                            "onset": 1.2,
                            "offset": 1.7,
                            "species": "Unknown Species",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 2.4,
                            "offset": 2.6,
                            "species": "Unknown Species",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        }
                    ],
                    "1": [
                        {
                            "onset": 1.5,
                            "offset": 1.8,
                            "species": "Unknown Species",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 2.7,
                            "offset": 2.9,
                            "species": "Unknown Species",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        }
                    ],
                    "2": [
                        {
                            "onset": 1.9,
                            "offset": 2,
                            "species": "Unknown Species",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 3,
                            "offset": 3.2,
                            "species": "Unknown Species",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        }
                    ]
                }
            }
        },
        {
            "url": "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
            "id": "64bec7e26642cadf5dc0eb01",
            "filename": "BabyElephantWalk60.wav",
            "annotation_instance": "XC785219_fd453602-a4a9-4f57-95f2-fd9084e9a161",
            "time": "2024-03-27 20:01:43",
            "hop_length": 900,
            "nfft": 500,
            "f_high": 8000,
            "f_low": 0,
            "spec_cal_method": "log-mel",
            "labels": {
                "channels": {
                    "0": [
                        {
                            "onset": 1.2,
                            "offset": 1.7,
                            "species": "Unknown Species",
                            "individual": "Unknown",
                            "clustername": "Unknown"
                        },
                        {
                            "onset": 2.4,
                            "offset": 2.6,
                            "species": "Unknown Species",
                            "individual": "Ind4",
                            "clustername": "call 3"
                        }
                    ]
                }
            }
        },
    ]
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
    checkIfEveryObjectIsInactive,
    dummyData
}