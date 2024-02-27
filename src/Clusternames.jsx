import {useEffect, useState} from "react"
import { nanoid } from 'nanoid'
import Colorwheel from "./Colorwheel.jsx"

class ClusternameButton {
    constructor(id, clustername, isActive) {
        this.id = id
        this.clustername = clustername
        this.isActive = isActive
        this.color = 'colorHere'
        this.showColorwheel = false
    }
}

function Clusternames( { passActiveClusternameBTNToApp, importedClusternameButtons } ){
    const [newClustername, setNewClustername] = useState('')
    const [clusternameButtons, setClusternameButtons] = useState([])

    function handleChange(event){
        setNewClustername(event.target.value)
    }

    function updateClusternamesButtons(event){
        event.preventDefault()

        setClusternameButtons( deactivateAll() )

        const newBTN = new ClusternameButton( nanoid(),newClustername, true)

        setClusternameButtons(prevState => [...prevState, newBTN] )

        passActiveClusternameBTNToApp(newBTN)

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
                passActiveClusternameBTNToApp(item)
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

    function toggleColorwheel(clusternameBtn) {
        const updatedClusternameButtons = clusternameButtons.map(btn => {
            if (btn.id === clusternameBtn.id) {
                return { ...btn, showColorwheel: !btn.showColorwheel }
            } else {
                return btn
            }
        })

        setClusternameButtons(updatedClusternameButtons)
    }

    function passChosenColorToClusternames(clusternameBtn, newColor) {
        const updatedClusternameButtons = clusternameButtons.map(btn => {
            if (btn.id === clusternameBtn.id) {
                const updatedBTN = { ...btn, color: newColor }
                passActiveClusternameBTNToApp(updatedBTN)
                return updatedBTN
            } else {
                return btn
            }
        })

        setClusternameButtons(updatedClusternameButtons)

    }


    // When a new CSV-File was uploaded, update the Clustername Buttons and re-render the component
    useEffect( () => {
        setClusternameButtons(importedClusternameButtons)

    }, [importedClusternameButtons])


    // Whenever user deletes the active Clustername Button, the last button in the state array becomes active
    useEffect( () => {
        for (let btn of clusternameButtons){
            if (btn.isActive){
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
                    clusternameButtons.map( BTN =>
                        <div
                            className='clustername-btn'
                            key={BTN.id}>
                            <div
                                className='clustername-text'
                                style={{ backgroundColor: BTN.color }}
                                id={BTN.id}
                                isactive={BTN.isActive.toString()}
                                onClick={handleLMB}
                                onContextMenu={handleRightClick}
                            >
                                {BTN.clustername}
                            </div>
                            <button
                                className='open-colorwheel-btn'
                                onClick={() => toggleColorwheel(BTN)}
                            >
                                🎨
                            </button>
                            {BTN.showColorwheel && <Colorwheel toggleColorwheel={toggleColorwheel} passChosenColorToClusternames={passChosenColorToClusternames} BTN={BTN} />}
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default Clusternames

