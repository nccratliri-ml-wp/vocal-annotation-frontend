import {useEffect, useState} from "react"
import { nanoid } from 'nanoid'

class ClusternameButton {
    constructor(id, clustername, isActive) {
        this.id = id
        this.clustername = clustername
        this.isActive = isActive
    }
}

function Clusternames( { passActiveClusternameToApp, importedClusternameButtons, base64Url } ){
    const [newClustername, setNewClustername] = useState('')
    const [clusternameButtons, setClusternameButtons] = useState([])

    function handleChange(event){
        setNewClustername(event.target.value)
    }

    function updateClusternamesButtons(event){
        event.preventDefault()

        setClusternameButtons( deactivateAll() )

        setClusternameButtons(prevState =>
            [
                ...prevState,
                new ClusternameButton( nanoid(),newClustername, true )
            ])

        passActiveClusternameToApp(newClustername)

        setNewClustername('')
    }

    function deactivateAll(){
        return clusternameButtons.map(item => {
            return new ClusternameButton (item.id, item.clustername, false)
        })
    }

    function handleLMB(event){
        setClusternameButtons( activateButton(event.target) )
    }

    function activateButton(btn){
        const newClusternameButtons = deactivateAll()

        return newClusternameButtons.map(item => {
            if (item.id === btn.id){
                passActiveClusternameToApp(item.clustername)
                return new ClusternameButton (item.id, item.clustername, !item.isActive)
            }
            return new ClusternameButton (item.id, item.clustername, item.isActive)
        })
    }

    function handleRightClick(event){
        event.preventDefault()
        setClusternameButtons( deleteClusternameButton(event.target) )
    }

    function deleteClusternameButton(btn){
        return clusternameButtons.filter(item => item.id !== btn.id)
    }

    // When a new CSV-File was uploaded, update the Clustername Buttons and re-render the component
    useEffect( () => {
        setClusternameButtons(importedClusternameButtons)

    }, [importedClusternameButtons])

    // When a new Audio-File was uploaded, delete previous clusternameButtons and re-render the component
    useEffect( () => {
        setClusternameButtons([])

    }, [base64Url])

    // Whenever user deletes the active Clustername Button, the last button in the state array becomes active
    useEffect( () => {
        for (let item of clusternameButtons){
            if (item.isActive){
                return
            }
        }

        const lastClusternameBtn = clusternameButtons[clusternameButtons.length - 1]
        setClusternameButtons( activateButton(lastClusternameBtn) )

    }, [JSON.stringify(clusternameButtons)])

    return (
        <div id='clusternames-container'>
            <form onSubmit={updateClusternamesButtons}>
                <input
                    id='clustername-input-field'
                    type='text'
                    required='required'
                    pattern='^[^,]{1,30}$'
                    title='No commas allowed. Max length 30 characters'
                    value={newClustername}
                    placeholder='Add a custom tag:'
                    onChange={handleChange}
                />
            </form>
            <div id='clustername-buttons-container'>
                {
                    clusternameButtons.map( data =>
                        <div
                            key={data.id}
                            id={data.id}
                            isactive={data.isActive.toString()}
                            onClick={handleLMB}
                            onContextMenu={handleRightClick}
                        >
                            {data.clustername}
                        </div>)
                }
            </div>
        </div>
    )
}

export default Clusternames

