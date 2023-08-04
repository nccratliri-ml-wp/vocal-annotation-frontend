import {useState} from "react";

class Label {
    constructor(onset, offset, clustername) {
        this.onset = onset
        this.offset = offset
        this.clustername = clustername
    }
}

function CSVReader( {passLabelsToApp} ){
    const [csvFile, setCSVFile] = useState(null)

    function handleChange(event){
        setCSVFile(event.target.files[0])
    }

    function submit(event){
        event.preventDefault()
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
        for (let item of rows){
            const values = item.split(delim)
            newLabels.push(new Label(
                parseFloat(values[0]),
                parseFloat(values[1]),
                values[2]) )
        }

        newLabels = newLabels.filter( label => !isNaN(label.onset) && !isNaN(label.offset) )

        passLabelsToApp(newLabels)
    }


    return(
        <form id='csv-form'>
            <input
                type='file'
                accept='.csv'
                id='csvFile'
                onChange={handleChange}
            />
            <button onClick={submit}>
                Submit
            </button>
        </form>
    )
}

export default CSVReader