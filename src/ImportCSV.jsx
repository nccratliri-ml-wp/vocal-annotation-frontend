import React from "react"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import {globalControlsBtn, icon} from "./styles.js"

function ImportCSV( {passCsvImportedLabelsToApp} ) {

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
                    const [onset, offset, species, individual, clustername, filename, trackID] = line.trim().split(',')

                    importedLabelsArray.push({
                        onset: parseFloat(onset),
                        offset: parseFloat(offset),
                        species: species.trim(),
                        individual: individual.trim(),
                        clustername: clustername.trim(),
                        filename: filename.trim(),
                        trackID: trackID.trim()
                    })

                }

                let allImportedLabelsObject = {
                    'track_1': [],
                    'track_2': [],
                    'track_3': [],
                    'track_4': [],
                    'track_5': [],
                    'track_6': [],
                    'track_7': [],
                    'track_8': [],
                    'track_9': [],
                    'track_10': [],
                    'track_11': [],
                    'track_12': [],
                    'track_13': [],
                    'track_14': [],
                    'track_15': [],
                    'track_16': [],
                    'track_17': [],
                    'track_18': [],
                    'track_19': [],
                    'track_20': [],
                }

                for (const label of importedLabelsArray) {
                    const trackID = label.trackID
                    allImportedLabelsObject[trackID] = [
                        ...(allImportedLabelsObject[trackID] || []), // Ensure the track array exists
                        label
                    ]
                }

                passCsvImportedLabelsToApp(allImportedLabelsObject)
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
