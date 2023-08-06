import {useEffect, useState} from "react";
import { nanoid } from 'nanoid'

class Label {
    constructor(onset, offset, clustername) {
        this.onset = onset
        this.offset = offset
        this.clustername = clustername
    }
}

class ClusternameButton {
    constructor(id, clustername, isActive) {
        this.id = id
        this.clustername = clustername
        this.isActive = isActive
    }
}

function CSVReader( {passLabelsToApp, passClusterNameButtonsToApp} ){
    const [csvFile, setCSVFile] = useState(null)

    function handleChange(event){
        setCSVFile(event.target.files[0])
    }

    function readFile(){
        if (!csvFile){
            return
        }

        const fileReader = new FileReader()

        fileReader.onload = (event) => {
            const text = event.target.result
            processCSV(text)
        }

        fileReader.readAsText(csvFile)
    }

    function processCSV(str, delim=',') {
        const rows = str.slice(str.indexOf('\n')+1).split('\n')

        let newLabels = []
        let clusternames = []
        for (let item of rows){
            const values = item.split(delim)
            newLabels.push(
                new Label(
                parseFloat(values[0]),
                parseFloat(values[1]),
                values[2])
            )
            if ( values[2] && !clusternames.includes(values[2]) ){
                clusternames.push(values[2])
            }
        }

        newLabels = newLabels.filter( label => !isNaN(label.onset) && !isNaN(label.offset) )
        passLabelsToApp(newLabels)

        const newClusternameButtons = clusternames.map( clustername => new ClusternameButton(nanoid(), clustername, false) )
        passClusterNameButtonsToApp(newClusternameButtons)
    }

    // When a new CSV file is added, read it
    useEffect( () => {
        readFile()
    }, [csvFile])

    return(
        <form id='csv-form'>
            <input
                type='file'
                accept='.csv'
                id='csvFile'
                onChange={handleChange}
            />
        </form>
    )
}

export default CSVReader