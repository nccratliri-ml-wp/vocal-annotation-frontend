import IconButton from "@material-ui/core/IconButton";
import DownloadIcon from '@mui/icons-material/Download';
import Tooltip from "@material-ui/core/Tooltip";
import React from "react";
import {iconStyle} from "./styles.js"

function Export( { labels, audioFileName } ){

    function exportCSV(){
        // Remove Protected Area labels
        labels = labels.filter(label => label.clustername !== 'Protected Area🔒')

        // Sort the labels ascending by onset
        labels = labels.sort( (firstLabel, secondLabel ) => firstLabel.onset - secondLabel.onset )

        // Transform to CSV data
        let csvData = labels.map(label => `${label.onset},${label.offset},${label.clustername},${label.individual}`)
        csvData.unshift('onset,offset,cluster,individual')
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
            <IconButton onClick={exportCSV}>
                <DownloadIcon style={iconStyle}/>
            </IconButton>
        </Tooltip>
    )
}

export default Export