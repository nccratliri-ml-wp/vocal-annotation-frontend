

/*
import IconButton from "@material-ui/core/IconButton";
import DownloadIcon from '@mui/icons-material/Download';
import Tooltip from "@material-ui/core/Tooltip";
import React from "react";
import {iconBtn, icon} from "./styles.js"
import {ANNOTATED_AREA} from "./species.js";

function Export( { allLabels, audioFileName } ){

    function exportCSV(){
        console.log(allLabels)
        let allLabelsArray = Object.values(allLabels).flat()

        // Remove Annotated Area labels
        allLabelsArray = allLabelsArray.filter(label => label.species !== ANNOTATED_AREA)

        // Sort the labels ascending by onset
        allLabelsArray = allLabelsArray.sort( (firstLabel, secondLabel ) => firstLabel.onset - secondLabel.onset )

        // Transform to CSV data
        let csvData = allLabelsArray.map(label => `${label.onset},${label.offset},${label.clustername},${label.individual},${label.species}`)
        csvData.unshift('onset,offset,cluster,individual,species')
        csvData = csvData.join('\n')

        const newCSVFileName = audioFileName.slice(0, -4) + '.csv'

        const element = document.createElement('a')
        element.setAttribute('href', `data:text/csv;charset=utf-8,${csvData}`)
        element.setAttribute('download', newCSVFileName)

        document.body.appendChild(element)
        element.click()
        element.remove()
    }

    return (
        <Tooltip title="Download Annotations">
            <IconButton style={iconBtn} onClick={exportCSV}>
                <DownloadIcon style={icon}/>
            </IconButton>
        </Tooltip>
    )
}

export default Export
 */