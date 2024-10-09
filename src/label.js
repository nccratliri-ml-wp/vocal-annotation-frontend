class Label {
    constructor(id, trackID, filename, onset, offset, minFreq, maxFreq, species, individual, clustername, 
                speciesID, individualID, clusternameID, individualIndex, annotator, color) {
        this.id = id
        this.trackID = trackID
        this.filename = filename
        this.onset = onset
        this.offset = offset
        this.minFreq = minFreq
        this.maxFreq = maxFreq
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
