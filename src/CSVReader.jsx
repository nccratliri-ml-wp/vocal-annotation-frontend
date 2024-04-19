import {useEffect, useState} from "react";
import { nanoid } from 'nanoid'

// This entire component must be refactored before use

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

function CSVReader({passLabelsToApp, passClusterNameButtonsToApp} ){

    // CSV Reader Implementation
    const [csvFile, setCSVFile] = useState(null)

    function handleFilePicked(newFile){
        setCSVFile( newFile )
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


    // Drag & Drop implementation
    const [dragActive, setDragActive] = useState(false)

    function handleDrag(event){
        event.preventDefault()
        event.stopPropagation()
        if (event.type === 'dragenter' || event.type === 'dragover') {
            setDragActive(true)
        } else if (event.type === 'dragleave') {
            setDragActive(false)
        }
    }

    function handleDrop(event){
        event.preventDefault()
        event.stopPropagation()
        setDragActive(false)
        if (event.dataTransfer.files && event.dataTransfer.files[0]){
            handleFilePicked(event.dataTransfer.files[0])
        }
    }

    function handleChange(event){
        event.preventDefault()
        setDragActive(false)
        if (event.target.files && event.target.files[0]){
            handleFilePicked(event.target.files[0])
        }
    }

    return (
        <form
            className='form-file-upload'
            onDragEnter={handleDrag}
            onSubmit={(event) => event.preventDefault()}
        >
            <input
                id='csv-file-upload'
                className='input-file-upload'
                type='file'
                accept='.csv'
                multiple={false}
                onChange={handleChange}
            />
            <label
                className='label-file-upload'
                htmlFor='csv-file-upload'
                isdragactive={dragActive ? 'true' : 'false'}
            >
                <div>
                    {csvFile ? <div><div className='file-icon'>🗎</div>{csvFile.name}</div> : 'Drag and drop your CSV file or click here to upload'}
                </div>
            </label>
            {
                dragActive &&
                <div
                    className='drag-file-element'
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}>
                </div>
            }
        </form>
    )
}

export default CSVReader