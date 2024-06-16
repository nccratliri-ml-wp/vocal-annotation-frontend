import React from "react"
import { IconButton } from "@material-ui/core"
import DownloadIcon from '@mui/icons-material/Download'
import Tooltip from "@material-ui/core/Tooltip"
import {icon, globalControlsBtn} from "./styles.js"

function Export( { allLabels, annotationInstance } ){

    function exportCSV(){
        // Flatten the allLabels Object into a single array
        let labels = Object.values(allLabels).flat()

        // Transform to CSV data
        let csvData = labels.map(label => `${label.onset},${label.offset},${label.species},${label.individual},${label.clustername},${label.filename},${label.trackIndex}`)
        csvData.unshift('onset,offset,species,individual,clustername,filename,track')
        csvData = csvData.join('\n')

        const newCSVFileName = annotationInstance ? `${annotationInstance}.csv` : 'annotations.csv'

        const element = document.createElement('a')
        element.setAttribute('href', `data:text/csv;charset=utf-8,${csvData}`)
        element.setAttribute('download', newCSVFileName)

        document.body.appendChild(element)
        element.click()
        element.remove()
    }

    return (
        <Tooltip title="Download Annotations">
            <IconButton
                style={globalControlsBtn}
                onClick={exportCSV}
            >
                <DownloadIcon style={icon} />
            </IconButton>
        </Tooltip>
    )
}

export default Export
