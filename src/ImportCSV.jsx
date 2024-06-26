import React from "react"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import {globalControlsBtn, icon} from "./styles.js"

function ImportCSV( {passImportedLabelsToApp} ) {

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

                passImportedLabelsToApp(importedLabelsArray)
            }
            reader.readAsText(file)
        }
    }

    const handleClick = () => {
        // Trigger the file input click
        document.getElementById("csv-file-input").click()
    }

    return (
        <Tooltip title="Import CSV">
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
