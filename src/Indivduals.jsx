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
            <MenuItem key={nanoid()} value={2}>Individual 2</MenuItem>,
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