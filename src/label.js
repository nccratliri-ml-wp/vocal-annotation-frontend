class Label {
    constructor(id, trackID, filename, onset, offset, minFreq, maxFreq, species, individual, clustername, speciesID, individualID, clusternameID, individualIndex, annotator, color) {
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


/*
1. add new porperty to label object,
2. adapt all instances of new label
2.1 Find out if there's other places I need to update
3. fill with dummy data for now
4. adapt import and export, submit
5. replace dummy data with frequency lines values
6. display the label frequency somewhere
7. Fix/refactor frequency drag methods
 */