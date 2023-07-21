import {useEffect, useRef, useState} from "react"
import { nanoid } from 'nanoid'

class ClusternameButton {
    constructor(id, clustername, isActive) {
        this.id = id
        this.clustername = clustername
        this.isActive = isActive
    }
}

function Clusternames(){
    const [newClustername, setNewClustername] = useState('')
    const [clusternameButtons, setClusternameButtons] = useState([])

    function handleChange(event){
        setNewClustername(event.target.value)
    }

    function updateClusternamesButtons(event){
        event.preventDefault()
        setClusternameButtons(prevState =>
            [
                ...prevState,
                new ClusternameButton( nanoid(),newClustername, false )
            ])
        setNewClustername('')
    }

    function activateButton(event){
        let newClusternameButtons = clusternameButtons.map(item => {
            return new ClusternameButton (item.id, item.clustername, false)
        })

        newClusternameButtons = newClusternameButtons.map(item => {
            if (item.id === event.target.id){
                return new ClusternameButton (item.id, item.clustername, !item.isActive)
            }
            return new ClusternameButton (item.id, item.clustername, item.isActive)
        })

        setClusternameButtons(newClusternameButtons)
    }

    return (
        <div>
            <form onSubmit={updateClusternamesButtons}>
                <input
                    type='text'
                    value={newClustername}
                    placeholder='Add custom clustername'
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
                            onClick={activateButton}
                        >
                            {data.clustername}
                        </div>)
                }
            </div>
        </div>

    )
}

export default Clusternames

