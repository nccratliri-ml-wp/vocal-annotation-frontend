import React from "react"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import {nanoid} from "nanoid";
import { icon } from "./styles.js"
import { Label } from "./label.js"

function ImportCSV() {
    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const contents = e.target.result
                const lines = contents.split('\n')
                const annotations = []

                // Starting from the second line to skip the CSV header
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i]
                    const [onset, offset, species, individual, clustername, filename] = line.trim().split(',')
                    annotations.push({
                        onset: parseFloat(onset),
                        offset: parseFloat(offset),
                        species: species.trim(),
                        individual: individual.trim(),
                        clustername: clustername.trim(),
                        filename: filename.trim()
                    })
                    annotations.push(
                        new Label(
                            nanoid(),
                            onset,
                            offset,
                            species,
                            individual,
                            clustername,

                        )
                    )
                    // 1. Refactor label class to contain new filename and trackID property
                    // 2. Change Submit and Export process accordingly, also createGenericLableObject
                    // 3. Return importedLabels array into the App component, feed different tracks with the correct labels
                }

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
                <IconButton onClick={handleClick}>
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
