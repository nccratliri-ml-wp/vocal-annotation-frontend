import React, {useState} from 'react'
import { nanoid } from 'nanoid'
import MenuItem from '@mui/material/MenuItem'

class Individual {
    constructor(value, isActive) {
        this.value = value
        this.isActive = isActive
    }
}

function Individuals( {activeIndividual, passActiveIndividualToApp, passNumberOfIndividualsToApp} ) {

    const [individuals, setIndividuals] = useState(
        [
            new Individual(1, true)
        ]
    )

    function activateIndividual(event) {

        const newActiveIndividualValue = event.target.value

        const updatedIndividuals = individuals.map(individual => {
            if (individual.value === newActiveIndividualValue) {
                return { ...individual, isActive: true }
            }
            return { ...individual, isActive: false }
        })

        setIndividuals(updatedIndividuals)
        passActiveIndividualToApp(newActiveIndividualValue)
    }


    function addIndividual() {
        const newIndividualNumber = individuals.length + 1;

        const updatedIndividuals = individuals.map((individual) => ({
            ...individual,
            isActive: false,
        }))

        updatedIndividuals.push(new Individual(newIndividualNumber, true))

        setIndividuals(updatedIndividuals)

        passNumberOfIndividualsToApp(newIndividualNumber)
        passActiveIndividualToApp(newIndividualNumber)
    }

    return (
        <div className='individuals-container'>
            <div
                className='individuals-menu'
                >
                {
                    individuals.map( individual =>
                        <MenuItem
                            key={nanoid()}
                            value={individual.value}
                            className={'individual-menu-item'}
                            isactive={individual.isActive.toString()}
                            onMouseDown={activateIndividual}
                        >
                            Individual {individual.value}
                        </MenuItem>
                    )
                }
            </div>
            <MenuItem className='add-individual-btn' onMouseDown={addIndividual}>Add Individual</MenuItem>
        </div>
    )
}

export default Individuals

/*

import React, {useState} from 'react'
import { nanoid } from 'nanoid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'

function Individuals( {activeIndividual, passActiveIndividualToApp, passNumberOfIndividualsToApp} ) {

    const [menuItems, setMenuItems] = useState(
        [
            <MenuItem key={nanoid()} value={1}>Individual 1</MenuItem>,
        ])

    const handleChange = (event) => {
        passActiveIndividualToApp(event.target.value)
    }

    const addIndividual = () => {
        const newIndividualNumber = menuItems.length + 1
        setMenuItems(prevState => [...prevState, <MenuItem key={nanoid()} value={newIndividualNumber}>Individual {newIndividualNumber}</MenuItem>])
        passNumberOfIndividualsToApp( newIndividualNumber )
        passActiveIndividualToApp( newIndividualNumber )
    }

    return (
        <FormControl
            sx={{ m: 1, minWidth: 120 }} size="small"
            id="individual-dropdown-menu"
        >
            <InputLabel
                sx={{
                    color: 'white',
                    '&.Mui-focused': {
                        color: 'white'
                    }
                }}
            >
                Individuals
            </InputLabel>
            <Select
                value={activeIndividual}
                label="Individual"
                onChange={handleChange}
                sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                    },
                    '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white'
                        }
                    },
                    '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white'
                        }
                    },
                    '& .MuiInputBase-input': {
                        color: 'white',
                    },
                }}
            >
                {menuItems}
                <MenuItem onMouseDown={addIndividual}>Add Individual</MenuItem>
            </Select>
        </FormControl>
    )
}

export default Individuals

 */