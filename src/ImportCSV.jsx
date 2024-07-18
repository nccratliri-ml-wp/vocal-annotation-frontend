import React, {useState} from "react"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import {globalControlsBtn, icon} from "./styles.js"
import {createSpeciesFromImportedLabels} from "./species.js";

function ImportCSV( {passImportedLabelsToApp, speciesArray, createSpeciesFromImportedLabels, passSpeciesArrayToApp} ) {

    const [fileUploaded, setFileUploaded] = useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const contents = e.target.result
                const lines = contents.split('\n')
                const importedLabelsArray = []

                // Starting from the second line to skip the CSV header
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i]
                    // Skip empty rows
                    if (line === '') continue

                    const [onset, offset, species, individual, clustername, filename, channelIndex] = line.trim().split(',')

                    importedLabelsArray.push({
                        onset: parseFloat(onset),
                        offset: parseFloat(offset),
                        species: species.trim(),
                        individual: individual.trim(),
                        clustername: clustername.trim(),
                        filename: filename.trim(),
                        channelIndex: parseFloat(channelIndex)
                    })

                }


                const newSpeciesArray = createSpeciesFromImportedLabels(importedLabelsArray, speciesArray)
                passSpeciesArrayToApp(newSpeciesArray)

                passImportedLabelsToApp(importedLabelsArray)
                setFileUploaded(event.target.files[0].name)
            }
            reader.readAsText(file)
        }
    }

    const handleClick = () => {
        if (fileUploaded){
            const answer = confirm(`A file named ${fileUploaded} has already been uploaded. Uploading a new CSV file will add the new labels to the existing one's.`)
            if (!answer) return
        }
        // Trigger the file input click
        document.getElementById("csv-file-input").click()
    }

    return (
        <Tooltip title={fileUploaded ? fileUploaded : "Import CSV"}>
            <div style={{display: 'inline'}}>
                <IconButton
                    style={globalControlsBtn}
                    onClick={handleClick}
                >
                    <UploadFileIcon style={icon} />
                </IconButton>
                <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
            </div>
        </Tooltip>
    )
}

export default ImportCSV
