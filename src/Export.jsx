import React from "react"
import { IconButton } from "@material-ui/core"
import DownloadIcon from '@mui/icons-material/Download'
import Tooltip from "@material-ui/core/Tooltip"
import {iconBtn, icon, globalControlsBtn} from "./styles.js"
import ExcelJS from 'exceljs'

function Export({ allLabels, audioFileName }) {
    async function exportExcel() {
        try {
            let workbook = new ExcelJS.Workbook()

            // Iterate over all tracks
            for (let [trackName, labels] of Object.entries(allLabels)) {

                // Create worksheets and sheet Data template
                const newWorksheet = workbook.addWorksheet(`${trackName} - ${labels[0]?.filename}`)
                const sheetData = [['onset', 'offset', 'cluster', 'individual', 'species']]

                // Sort the labels ascending by onset
                labels = labels.sort( (firstLabel, secondLabel ) => firstLabel.onset - secondLabel.onset )

                // Feed the sheet
                for (let label of labels){
                    sheetData.push([label.onset, label.offset, label.clustername, label.individual, label.species])
                }
                newWorksheet.addRows(sheetData)
            }

            const buffer = await workbook.xlsx.writeBuffer()

            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', audioFileName.slice(0, -4) + '.xlsx')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error exporting Excel:', error)
        }
    }

    return (
        <Tooltip title="Download Annotations">
            <IconButton
                style={globalControlsBtn}
                onClick={exportExcel}
            >
                <DownloadIcon style={icon} />
            </IconButton>
        </Tooltip>
    )
}

export default Export
