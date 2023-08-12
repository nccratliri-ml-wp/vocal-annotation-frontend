function Export( {labels, audioFileName} ){

    function exportCSV(){
        let csvData = labels.map(label => `${label.onset},${label.offset},${label.clustername}`)
        csvData.unshift('onset, offset, cluster')
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
        <button
            id='export-btn'
            onClick={exportCSV}>
            Export
        </button>
    )
}

export default Export