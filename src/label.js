class Label {
    constructor(id, onset, offset, species, individual, clustername, speciesID, individualID, clusternameID, individualIndex, annotator, color) {
        this.id = id
        this.onset = onset
        this.offset = offset
        this.species = species
        this.individual = individual
        this.clustername = clustername
        this.speciesID = speciesID
        this.individualID = individualID
        this.clusternameID = clusternameID
        this.individualIndex = individualIndex
        this.annotator = annotator
        this.color = color
    }
}

export { Label }