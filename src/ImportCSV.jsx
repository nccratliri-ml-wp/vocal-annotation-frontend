// React
import React, {useState} from "react";

// External dependencies
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import UploadFileIcon from "@mui/icons-material/UploadFile";

// Internal dependencies
import {createSpeciesFromImportedLabels} from "./species.js";
import {globalControlsBtn, icon, iconBtnDisabled} from "./styles.js";

function ImportCSV( {passImportedLabelsToApp, speciesArray, passSpeciesArrayToApp, atLeastOneAudioFileUploaded} ) {

    const [csvFileUploaded, setCsvFileUploaded] = useState(false);

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
                setCsvFileUploaded(event.target.files[0].name)
            }
            reader.readAsText(file)
        }
    }

    const handleClick = () => {
        if (csvFileUploaded){
            const answer = confirm(`A file named ${csvFileUploaded} has already been uploaded. Uploading a new CSV file will add the new labels to the existing one's.`)
            if (!answer) return
        }
        // Trigger the file input click
        document.getElementById("csv-file-input").click()
    }

    const getCorrectTooltip = () => {
        if (!atLeastOneAudioFileUploaded){
            return 'Upload all your audio files before uploading your CSV annotations file'
        }
        if (!csvFileUploaded){
            return 'Import CSV'
        }
        return csvFileUploaded
    }

    return (
        <Tooltip title={getCorrectTooltip()}>
            <div style={{display: 'inline'}}>
                <IconButton
                    style={{...globalControlsBtn, ...(!atLeastOneAudioFileUploaded && iconBtnDisabled)}}
                    disabled={!atLeastOneAudioFileUploaded}
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
