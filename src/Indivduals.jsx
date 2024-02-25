import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

function Individuals( {activeIndividual, passActiveIndividualToApp} ) {

    const handleChange = (event) => {
        passActiveIndividualToApp(event.target.value)
    };

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
                <MenuItem value={1}>Individual 1</MenuItem>
                <MenuItem value={2}>Individual 2</MenuItem>
                <MenuItem value={3}>Individual 3</MenuItem>
            </Select>
        </FormControl>
    );
}

export default Individuals