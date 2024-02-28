import {useEffect, useState} from "react"
import {nanoid} from 'nanoid'
import Colorwheel from "./Colorwheel.jsx"

class ClusternameButton {
    constructor(id, clustername, isActive, color) {
        this.id = id
        this.clustername = clustername
        this.isActive = isActive
        this.color = color
        this.showColorwheel = false
    }
}

const DEFAULT_BTN_COLOR = '#55e6f3'

function Clusternames( { passClusterNameButtonsToApp, clusternameButtons } ){
    const [newClustername, setNewClustername] = useState('')

    function handleChange(event){
        setNewClustername(event.target.value)
    }

    function updateClusternamesButtons(event){
        event.preventDefault()

        passClusterNameButtonsToApp( deactivateAll() )

        const newBTN = new ClusternameButton( nanoid(),newClustername, true, DEFAULT_BTN_COLOR)

        passClusterNameButtonsToApp(prevState => [...prevState, newBTN] )

        setNewClustername('')
    }

    function deactivateAll(){
        return clusternameButtons.map(btn => {
            return new ClusternameButton (btn.id, btn.clustername, false, btn.color)
        })
    }

    function handleLMB(event){
        passClusterNameButtonsToApp( activateButton(event.target) )
    }

    function activateButton(btn){
        const newClusternameButtons = deactivateAll()

        return newClusternameButtons.map(item => {
            if (item.id === btn.id){
                return new ClusternameButton (item.id, item.clustername, !item.isActive, item.color)
            }
            return new ClusternameButton (item.id, item.clustername, item.isActive, item.color)
        })
    }

    function handleRightClick(event){
        event.preventDefault()
        passClusterNameButtonsToApp( deleteClusternameButton(event.target) )
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

        passClusterNameButtonsToApp(updatedClusternameButtons)
    }

    function passChosenColorToClusternames(clusternameBtn, newColor) {
        const updatedClusternameButtons = clusternameButtons.map(btn => {
            if (btn.id === clusternameBtn.id) {
                return {...btn, color: newColor}
            } else {
                return btn
            }
        })

        passClusterNameButtonsToApp(updatedClusternameButtons)

    }


    // When a new CSV-File was uploaded, update the Clustername Buttons and re-render the component
    /*
    useEffect( () => {
        passClusterNameButtonsToApp(importedClusternameButtons)

    }, [importedClusternameButtons])
    */

    // Whenever user deletes the active Clustername Button, the last button in the state array becomes active
    useEffect( () => {
        for (let btn of clusternameButtons){
            if (btn.isActive){
                return
            }
        }

        const lastClusternameBtn = clusternameButtons[clusternameButtons.length - 1]
        passClusterNameButtonsToApp( activateButton(lastClusternameBtn) )

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

